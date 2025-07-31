const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  description: string | null;
  language: string | null;
  private: boolean;
  updated_at: string;
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

    // Get the authorization header
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

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
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

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unable to identify user" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch user's GitHub PAT from database
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
        JSON.stringify({ error: "GitHub PAT not found. Please add your GitHub Personal Access Token in your profile." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const githubPat = profileData[0].github_pat;

    // Fetch repositories from GitHub API
    console.log("Fetching repositories from GitHub API...");
    
    const githubResponse = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SmartAudit-AI',
      },
    });

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error("GitHub API Error:", {
        status: githubResponse.status,
        statusText: githubResponse.statusText,
        error: errorText,
      });
      
      let errorMessage = "Failed to fetch repositories from GitHub";
      
      if (githubResponse.status === 401) {
        errorMessage = "Invalid GitHub PAT. Please check your token and ensure it has the necessary permissions.";
      } else if (githubResponse.status === 403) {
        errorMessage = "GitHub API rate limit exceeded or insufficient permissions.";
      } else if (githubResponse.status === 404) {
        errorMessage = "GitHub API endpoint not found.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: `GitHub API returned ${githubResponse.status}: ${githubResponse.statusText}`
        }),
        {
          status: githubResponse.status === 401 ? 400 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const repositories: Repository[] = await githubResponse.json();
    
    console.log(`Successfully fetched ${repositories.length} repositories`);

    // Filter and format repositories
    const formattedRepos = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: {
        login: repo.owner.login,
      },
      description: repo.description,
      language: repo.language,
      private: repo.private,
      updated_at: repo.updated_at,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        repositories: formattedRepos,
        count: formattedRepos.length,
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