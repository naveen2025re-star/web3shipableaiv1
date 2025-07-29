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
    const messages = [
      {
        role: "system",
        content: `You are an expert smart contract security auditor. Your task is to perform comprehensive security audits of smart contracts, identifying vulnerabilities, security risks, and providing detailed remediation guidance.

Focus on:
- Common vulnerabilities (reentrancy, overflow/underflow, access control, etc.)
- Business logic flaws
- Gas optimization issues
- Best practices compliance
- Specific blockchain and language considerations

Provide detailed, actionable findings with severity ratings and clear remediation steps.`
      },
      {
        role: "user",
        content: `Please audit this smart contract:

${projectContext ? `**Project Context:**
- Language: ${projectContext.contractLanguage}
- Blockchain: ${projectContext.targetBlockchain}
- Project: ${projectContext.projectName}

` : ''}${description ? `**Description:**
${description}

` : ''}**Smart Contract Code:**
\`\`\`solidity
${code}
\`\`\``
      }
    ];

    try {
      console.log("Making request to Shipable AI API...");
      
      const openaiResponse = await fetch("https://api.shipable.ai/v3/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "o3-mini",
          messages: messages,
          temperature: 0.1,
          max_tokens: 4000
        })
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error("Shipable AI API Error:", openaiResponse.status, errorText);
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to process audit request",
            details: `API returned ${openaiResponse.status}: ${errorText}`
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
      
    } catch (apiError) {
      console.error("API request error:", apiError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to process audit request",
          details: apiError instanceof Error ? apiError.message : "Unknown API error"
        }),
        {
          status: 500,
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