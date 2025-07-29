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

    const fullPrompt = `${contextualPrompt}${description ? `${description}\n\n` : ''}${code}`;

    console.log("Making request to Shipable AI API...");
    
    const openaiResponse = await fetch("https://api.shipable.ai/v3/chat/completions", {
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
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to process audit request",
          details: `Shipable AI API returned ${openaiResponse.status}. Please try again or contact support if the problem continues.`
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
        details: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});