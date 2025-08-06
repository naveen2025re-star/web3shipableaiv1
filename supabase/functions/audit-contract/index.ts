const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Credit system constants
const BASE_SCAN_COST = 1;        // Base cost per scan
const COST_PER_LINE = 0.01;      // Cost per line of code
const COST_PER_FILE = 0.5;       // Cost per file

interface AuditRequest {
  code: string;
  description?: string;
  githubRepo?: {
    owner: string;
    repo: string;
  };
  projectContext?: {
    contractLanguage: string;
    targetBlockchain: string;
    projectName: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { code, description, githubRepo, projectContext }: AuditRequest = await req.json();

    if (!code?.trim() && !githubRepo) {
      return new Response(
        JSON.stringify({ error: "Code or GitHub repository is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let finalCode = '';
    let codeSource = '';

    // Check if code contains file content from user selection (starts with // File:)
    if (code && code.trim().startsWith('// File:')) {
      // User has selected specific files, use the provided content directly
      finalCode = code;
      codeSource = "User-selected repository files";
      console.log("Using user-selected file content directly");
    } else if (githubRepo && (!code || !code.trim())) {
      // Fetch code from GitHub repository
      console.log(`Fetching code from GitHub repo: ${githubRepo.owner}/${githubRepo.repo}`);
      
      // Get the authorization header to identify the user
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing authorization header" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Get Supabase environment variables
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(
          JSON.stringify({ error: "Supabase configuration missing" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify JWT and get user
      const jwtResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseServiceKey,
        },
      });

      if (!jwtResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const userData = await jwtResponse.json();
      const userId = userData.id;

      // Fetch user's GitHub PAT
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=github_pat`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch user profile" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const profileData = await profileResponse.json();
      
      if (!profileData || profileData.length === 0 || !profileData[0].github_pat) {
        return new Response(
          JSON.stringify({ error: "GitHub PAT not found. Please add your GitHub Personal Access Token." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { github_pat: githubPat, credits: userCredits } = profileData[0];

      // Calculate audit cost before fetching repository
      const estimateLines = (text: string) => text.split('\n').filter(line => line.trim().length > 0).length;
      const estimateFiles = (text: string) => {
        const fileMarkers = (text.match(/\/\/ File:/g) || []).length;
        return Math.max(fileMarkers, 1); // At least 1 file
      };

      // Rough estimation for GitHub repos (will be refined after fetching)
      let estimatedCost = BASE_SCAN_COST + COST_PER_FILE; // Base + at least 1 file
      if (code && code.trim()) {
        estimatedCost += estimateLines(code) * COST_PER_LINE;
      }

      // Check if user has enough credits for basic estimation
      if (userCredits < estimatedCost) {
        return new Response(
          JSON.stringify({ 
            error: "Insufficient credits",
            details: `This audit requires approximately ${Math.ceil(estimatedCost)} credits, but you only have ${userCredits} credits available.`,
            requiredCredits: Math.ceil(estimatedCost),
            availableCredits: userCredits
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Fetch repository contents recursively
      const fetchRepoContents = async (path = ''): Promise<string> => {
        const url = `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}/contents/${path}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${githubPat}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'SmartAudit-AI',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
        }

        const contents = await response.json();
        let combinedContent = '';

        if (Array.isArray(contents)) {
          // Directory
          for (const item of contents) {
            if (item.type === 'file' && isCodeFile(item.name)) {
              // Fetch file content
              const fileResponse = await fetch(item.download_url, {
                headers: {
                  'Authorization': `Bearer ${githubPat}`,
                  'User-Agent': 'SmartAudit-AI',
                },
              });
              
              if (fileResponse.ok) {
                const fileContent = await fileResponse.text();
                combinedContent += `\n\n// File: ${githubRepo.owner}/${githubRepo.repo}/${item.path}\n${fileContent}`;
              }
            } else if (item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'node_modules') {
              // Recursively fetch directory contents
              const dirContent = await fetchRepoContents(item.path);
              combinedContent += dirContent;
            }
          }
        } else if (contents.type === 'file' && isCodeFile(contents.name)) {
          // Single file
          const fileResponse = await fetch(contents.download_url, {
            headers: {
              'Authorization': `Bearer ${githubPat}`,
              'User-Agent': 'SmartAudit-AI',
            },
          });
          
          if (fileResponse.ok) {
            const fileContent = await fileResponse.text();
            combinedContent = `// File: ${githubRepo.owner}/${githubRepo.repo}/${contents.path}\n${fileContent}`;
          }
        }

        return combinedContent;
      };

      // Helper function to check if file is a code file
      const isCodeFile = (filename: string): boolean => {
        const codeExtensions = ['.sol', '.vy', '.rs', '.js', '.ts', '.jsx', '.tsx', '.py', '.cairo', '.move', '.go', '.java', '.cpp', '.c', '.h'];
        return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
      };

      try {
        finalCode = await fetchRepoContents();
        codeSource = `GitHub Repository: ${githubRepo.owner}/${githubRepo.repo}`;
        
        if (!finalCode.trim()) {
          return new Response(
            JSON.stringify({ error: "No code files found in the repository" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        // Add any additional code provided
        if (code && code.trim()) {
          finalCode += `\n\n// Additional Code Provided:\n${code}`;
        }
        
      } catch (error) {
        console.error("Error fetching repository contents:", error);
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch repository contents",
            details: error instanceof Error ? error.message : "Unknown error"
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Use provided code
      finalCode = code;
      codeSource = "Direct code input";
    }

    // Validate and sanitize the final code
    const sanitizedCode = finalCode
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\t/g, '    ')   // Convert tabs to spaces
      .trim();
    if (!sanitizedCode) {
      return new Response(
        JSON.stringify({ error: "No valid code content found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate final audit cost
    const countLines = (text: string) => {
      return text.split('\n').filter(line => line.trim().length > 0).length;
    };

    const countFiles = (text: string) => {
      const fileMarkers = (text.match(/\/\/ File:/g) || []).length;
      return Math.max(fileMarkers, 1); // At least 1 file
    };

    const linesOfCode = countLines(sanitizedCode);
    const numberOfFiles = countFiles(sanitizedCode);
    const auditCost = Math.ceil(BASE_SCAN_COST + (linesOfCode * COST_PER_LINE) + (numberOfFiles * COST_PER_FILE));

    console.log(`Audit cost calculation: ${linesOfCode} lines, ${numberOfFiles} files, ${auditCost} credits`);

    // Get user credits if not already fetched (for direct code input)
    let userCredits = 0;
    if (!githubRepo) {
      // Get the authorization header to identify the user
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing authorization header" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Get Supabase environment variables
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(
          JSON.stringify({ error: "Supabase configuration missing" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify JWT and get user
      const jwtResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseServiceKey,
        },
      });

      if (!jwtResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const userData = await jwtResponse.json();
      const userId = userData.id;

      // Fetch user's credits
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=credits`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch user profile" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const profileData = await profileResponse.json();
      
      if (!profileData || profileData.length === 0) {
        return new Response(
          JSON.stringify({ error: "User profile not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      userCredits = profileData[0].credits || 0;
    }

    // Check if user has sufficient credits
    if (userCredits < auditCost) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits",
          details: `This audit requires ${auditCost} credits, but you only have ${userCredits} credits available.`,
          requiredCredits: auditCost,
          availableCredits: userCredits,
          breakdown: {
            baseCost: BASE_SCAN_COST,
            linesCost: linesOfCode * COST_PER_LINE,
            filesCost: numberOfFiles * COST_PER_FILE,
            linesOfCode,
            numberOfFiles
          }
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Deduct credits before making the API call
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (token && supabaseUrl && supabaseServiceKey) {
      try {
        // Get user ID
        const jwtResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseServiceKey,
          },
        });

        if (jwtResponse.ok) {
          const userData = await jwtResponse.json();
          const userId = userData.id;

          // Deduct credits
          const { data: currentProfile, error: fetchError } = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=credits`, {
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json',
            },
          }).then(res => res.json());

          if (fetchError || !currentProfile || currentProfile.length === 0) {
            console.error('Failed to fetch current credits:', fetchError);
          } else {
            const currentCredits = currentProfile[0].credits;
            const newCredits = Math.max(0, currentCredits - auditCost);
            
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                credits: newCredits
              })
            });

            if (!updateResponse.ok) {
              console.error('Failed to deduct credits:', await updateResponse.text());
            }
          }
        }
      } catch (error) {
        console.error('Error deducting credits:', error);
      }
    }

    // Also deduct from the userCredits variable for response
    const remainingCredits = Math.max(0, userCredits - auditCost);

    // Function to escape markdown special characters in text fields only
    const escapeMarkdown = (text: string): string => {
      if (!text) return text;
      return text
        .replace(/`/g, '\\`')           // Escape backticks
        .replace(/\*/g, '\\*')          // Escape asterisks
        .replace(/_/g, '\\_')           // Escape underscores
        .replace(/~/g, '\\~')           // Escape tildes
        .replace(/\|/g, '\\|')          // Escape pipes
        .replace(/\[/g, '\\[')          // Escape square brackets
        .replace(/\]/g, '\\]')          // Escape square brackets
        .replace(/\(/g, '\\(')          // Escape parentheses
        .replace(/\)/g, '\\)')          // Escape parentheses
        .replace(/#/g, '\\#')           // Escape hash symbols
        .replace(/>/g, '\\>')           // Escape greater than
        .replace(/</g, '\\<');          // Escape less than
    };

    // Check for API key
    const apiKey = Deno.env.get("SHIPABLE_AI_API_KEY");
    
    // Debug logging for API key availability (without exposing the key)
    console.log("API key check:", {
      hasShipableKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 8) + "..." : "none"
    });
    
    if (!apiKey) {
      console.error("SHIPABLE_AI_API_KEY not found in environment");
      return new Response(
        JSON.stringify({ 
          error: "Configuration error",
          details: "Shipable AI API key not configured. Please check Supabase Edge Function secrets."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build structured messages for better AI understanding
    const userMessage = `Please audit this smart contract (${sanitizedCode.length} characters from ${codeSource}):

${projectContext ? `**Project Context:**
- Language: ${escapeMarkdown(projectContext.contractLanguage)}
- Blockchain: ${escapeMarkdown(projectContext.targetBlockchain)}
- Project: ${escapeMarkdown(projectContext.projectName)}

` : ''}${githubRepo ? `**GitHub Repository:**
- Repository: ${escapeMarkdown(githubRepo.owner)}/${escapeMarkdown(githubRepo.repo)}
- Source: GitHub API fetch

` : ''}${description ? `**Description:**
${escapeMarkdown(description)}

` : ''}**Smart Contract Code:**

${sanitizedCode}`;

    // Calculate approximate token count (rough estimate: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(
      userMessage.length / 4
    );


    try {
      console.log(`Making request to Shipable AI API... (${estimatedTokens} estimated tokens)`);
      
      const openaiResponse = await fetch("https://api.shipable.ai/v3/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "claude-3-7-sonnet-latest",
          messages: [
            { "role": "user", "content": userMessage }
          ]
        })
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error("Shipable AI API Error:", {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          error: errorText,
          estimatedTokens,
          codeLength: sanitizedCode.length
        });
        
        // Parse error response if possible
        let errorDetails = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.message || errorJson.error || errorText;
        } catch {
          // Keep original error text if not JSON
        }
        
        return new Response(
          JSON.stringify({ 
            error: "External API error",
            details: `Shipable AI API (${openaiResponse.status}): ${errorDetails}`,
            suggestions: openaiResponse.status === 400 
              ? ["Check if code content is valid", "Reduce code size if too large", "Verify API key permissions"]
              : openaiResponse.status === 429
              ? ["API rate limit exceeded", "Please wait and try again", "Consider upgrading API plan"]
              : openaiResponse.status >= 500
              ? ["External service temporarily unavailable", "Please try again in a few minutes"]
              : ["Check API configuration", "Verify request format"]
          }),
          {
            status: openaiResponse.status >= 500 ? 503 : 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const completion = await openaiResponse.json();
      console.log("Received response from Shipable AI API", {
        hasChoices: !!completion.choices,
        choicesLength: completion.choices?.length || 0,
        usage: completion.usage
      });
      
      if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
        console.error("Invalid completion structure:", completion);
        return new Response(
          JSON.stringify({ 
            error: "Invalid response from AI service",
            details: "No completion data received"
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const auditResult = completion.choices[0].message.content;

      if (!auditResult || auditResult.trim().length === 0) {
        return new Response(
          JSON.stringify({ 
            error: "Empty response from AI service",
            details: "AI service returned empty audit result"
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          audit: auditResult,
          creditsUsed: auditCost,
          remainingCredits: userCredits - auditCost,
          timestamp: new Date().toISOString(),
          metadata: {
            codeLength: sanitizedCode.length,
            estimatedTokens,
            usage: completion.usage,
            linesOfCode,
            numberOfFiles,
            auditCost
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
      
    } catch (apiError) {
      console.error("API request error:", {
        error: apiError,
        message: apiError instanceof Error ? apiError.message : 'Unknown error',
        codeLength: sanitizedCode.length,
        estimatedTokens
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Network or API error",
          details: apiError instanceof Error ? apiError.message : "Unknown API error",
          suggestions: [
            "Check internet connection",
            "Verify API service status",
            "Try again in a few moments"
          ]
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

  } catch (error) {
    console.error("Edge function error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});