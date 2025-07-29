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
  };
}

// Helper function to validate and sanitize input
function validateAndSanitizeInput(code: string, description?: string): { isValid: boolean; error?: string; sanitizedCode: string; sanitizedDescription?: string } {
  // Check code length (limit to 50KB to prevent API overload)
  if (code.length > 50000) {
    return { 
      isValid: false, 
      error: "Code is too large. Please limit to 50,000 characters or less.",
      sanitizedCode: code
    };
  }

  // Remove potentially problematic characters and normalize whitespace
  const sanitizedCode = code
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\r\n/g, '\n') // Normalize line endings
    .trim();

  const sanitizedDescription = description
    ? description
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim()
        .substring(0, 1000) // Limit description length
    : undefined;

  // Basic validation for empty or invalid code
  if (!sanitizedCode || sanitizedCode.length < 10) {
    return { 
      isValid: false, 
      error: "Code appears to be empty or too short for analysis.",
      sanitizedCode
    };
  }

  return { 
    isValid: true, 
    sanitizedCode, 
    sanitizedDescription 
  };
}

// Helper function to retry API calls with exponential backoff
async function retryApiCall(apiCall: () => Promise<Response>, maxRetries: number = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API call attempt ${attempt}/${maxRetries}`);
      const response = await apiCall();
      
      // If we get a 500 error, retry (unless it's the last attempt)
      if (response.status === 500 && attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed with 500, retrying...`);
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
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
    const validation = validateAndSanitizeInput(code, description);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for API key
    const apiKey = Deno.env.get("SHIPABLE_AI_API_KEY");
    if (!apiKey) {
      console.error("SHIPABLE_AI_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ 
          error: "Configuration error",
          details: "API key not configured. Please set SHIPABLE_AI_API_KEY in your Supabase project settings."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build context-aware prompt
    let contextualPrompt = '';
    if (projectContext) {
      contextualPrompt = `You are auditing a ${projectContext.contractLanguage} smart contract for the ${projectContext.targetBlockchain} blockchain. Project: "${projectContext.projectName}". Please provide analysis specific to ${projectContext.contractLanguage} and ${projectContext.targetBlockchain} best practices, common vulnerabilities, and security patterns.\n\n`;
    }

    const fullPrompt = `${contextualPrompt}${validation.sanitizedDescription ? `${validation.sanitizedDescription}\n\n` : ''}${validation.sanitizedCode}`;

    console.log("Making request to Shipable AI API...");
    
    // Use retry logic for the API call
    const openaiResponse = await retryApiCall(async () => {
      return await fetch("https://api.shipable.ai/v3/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "o3-mini",
          messages: [
            {
              role: "user",
              content: fullPrompt
            }
          ]
        })
      });
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`Shipable AI API Error (${openaiResponse.status}):`, errorText);
      
      // Handle specific error cases
      if (openaiResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: "Authentication failed",
            details: "Invalid API key. Please check your SHIPABLE_AI_API_KEY configuration."
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (openaiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded",
            details: "Too many requests. Please try again later."
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (openaiResponse.status === 500) {
        return new Response(
          JSON.stringify({ 
            error: "External service temporarily unavailable",
            details: "The AI service is experiencing issues. This has been automatically retried. Please try again in a few minutes."
          }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to process audit request",
          details: `External AI service returned ${openaiResponse.status}. Please try again or contact support if the problem continues.`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const completion = await openaiResponse.json();
    console.log("Received response from Shipable AI API");
    
    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error("Invalid response structure:", completion);
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
    console.log("Audit completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        audit: auditResult,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred. Please try again."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});