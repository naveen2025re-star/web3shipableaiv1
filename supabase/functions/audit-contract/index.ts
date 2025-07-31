const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AuditRequest {
  code: string;
  description?: string;
  projectContext?: {
    contractLanguage: string;
    targetBlockchain: string;
    projectName: string;
    codeMetadata?: {
      originalLength: number;
      cleanedLength: number;
      linesOfCode: number;
      complexity: 'Low' | 'Medium' | 'High';
      processingTime: number;
    };
  };
}

// Enhanced prompt engineering for better AI responses
const buildAuditPrompt = (code: string, description: string, projectContext: any): string => {
  const complexity = projectContext?.codeMetadata?.complexity || 'Medium';
  const linesOfCode = projectContext?.codeMetadata?.linesOfCode || 'unknown';
  
  return `You are an expert smart contract security auditor. Please perform a comprehensive security audit of this ${projectContext?.contractLanguage || 'Solidity'} smart contract for ${projectContext?.targetBlockchain || 'Ethereum'}.

**Contract Analysis Context:**
- Project: ${projectContext?.projectName || 'Smart Contract'}
- Language: ${projectContext?.contractLanguage || 'Solidity'}
- Target Blockchain: ${projectContext?.targetBlockchain || 'Ethereum'}
- Code Complexity: ${complexity}
- Lines of Code: ${linesOfCode}
${description ? `- Description: ${description}` : ''}

**Audit Requirements:**
1. Identify ALL security vulnerabilities with precise severity ratings
2. Provide detailed technical explanations for each finding
3. Include proof-of-concept exploits where applicable
4. Suggest specific remediation steps with code examples
5. Assess gas optimization opportunities
6. Rate your confidence level for each finding (0-100%)

**Response Format:**
Please structure your response with clear sections using markdown headers (###) for each vulnerability found. For each vulnerability, include:
- **Severity**: Critical/High/Medium/Low/Informational
- **Detailed Explanation**: Technical analysis of the vulnerability
- **Impact**: Potential consequences and risk assessment
- **Proof of Concept**: Attack scenario or exploit demonstration
- **Recommended Remediation**: Specific fixes with code examples
- **Confidence**: Your confidence level (0-100%)
- **Gas Impact**: High/Medium/Low/Minimal (if applicable)
- **References**: Relevant security resources or standards

**Smart Contract Code:**
\`\`\`${projectContext?.contractLanguage?.toLowerCase() || 'solidity'}
${code}
\`\`\`

Please provide a thorough, professional audit report with actionable insights.`;
};

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

    const { code, description, projectContext }: AuditRequest = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate and sanitize input
    // Clean and sanitize the code
    const sanitizedCode = code
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
    
    // Debug logging for API key availability
    console.log("Environment variables check:", {
      hasShipableKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      allEnvKeys: Object.keys(Deno.env.toObject()).filter(key => key.includes('SHIPABLE') || key.includes('API'))
    });
    
    if (!apiKey) {
      console.error("SHIPABLE_AI_API_KEY not found in environment");
      console.error("Available environment variables:", Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ 
          error: "Configuration error",
          details: "API key not configured - check Supabase Edge Function secrets"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build structured messages for better AI understanding
    const userMessage = buildAuditPrompt(sanitizedCode, description || '', projectContext);

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
          ],
          temperature: 0.1, // Lower temperature for more consistent, focused analysis
          max_tokens: 4000 // Ensure comprehensive responses
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
          timestamp: new Date().toISOString(),
          metadata: {
            codeLength: sanitizedCode.length,
            estimatedTokens,
            usage: completion.usage,
            model: "claude-3-7-sonnet-latest",
            projectContext: projectContext?.projectName || 'Unknown'
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