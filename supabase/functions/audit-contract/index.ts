const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AuditRequest {
  code: string;
  description?: string;
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

    const { code, description }: AuditRequest = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize OpenAI client with Shipable AI configuration
    const openaiResponse = await fetch("https://api.shipable.ai/v3/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SHIPABLE_AI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "o1",
        messages: [
          {
            role: "system",
            content: "You are a smart contract security auditor. Analyze the provided code for vulnerabilities, best practices, and potential issues."
          },
          {
            role: "user",
            content: `Please audit this smart contract:\n\n${description ? `Description: ${description}\n\n` : ''}Code:\n${code}`
          }
        ]
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("Shipable AI API Error:", errorText);
      
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
    
    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
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