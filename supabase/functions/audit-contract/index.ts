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
    if (code.length > 50000) {
      return new Response(
        JSON.stringify({ 
          error: "Code too large",
          details: "Smart contract code exceeds maximum size limit (50,000 characters)"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // Check for API key
    const apiKey = Deno.env.get("SHIPABLE_AI_API_KEY");
    if (!apiKey) {
      console.error("SHIPABLE_AI_API_KEY not found in environment");
      return new Response(
        JSON.stringify({ 
          error: "Configuration error",
          details: "API key not configured"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build structured messages for better AI understanding
    const userMessage = `Please audit this smart contract (${sanitizedCode.length} characters):

${projectContext ? `**Project Context:**
- Language: ${projectContext.contractLanguage}
- Blockchain: ${projectContext.targetBlockchain}
- Project: ${projectContext.projectName}

` : ''}${description ? `**Description:**
${description}

` : ''}**Smart Contract Code:**
\`\`\`solidity
${sanitizedCode}
\`\`\``;

    // Calculate approximate token count (rough estimate: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(
      userMessage.length / 4
    );

    if (estimatedTokens > 190000) {
      return new Response(
        JSON.stringify({ 
          error: "Request too large",
          details: `Estimated token count (${estimatedTokens}) exceeds model limit (190,000 tokens). Please reduce code size or description length.`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      console.log(`Making request to Shipable AI API... (${estimatedTokens} estimated tokens)`);
      
      const openaiResponse = await fetch("https://api.shipable.ai/v3/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "o3-mini",
          messages: [
            { "role": "user", "content": userMessage }
          ],
          max_tokens: Math.min(200000 - estimatedTokens, 100000)
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
            usage: completion.usage
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