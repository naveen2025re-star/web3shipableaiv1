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
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (req.method === "GET" && action === "list-files") {
      return await handleListFiles(req, url);
    } else if (req.method === "GET" && action === "get-file-content") {
      return await handleGetFileContent(req, url);
    } else if (req.method !== "POST") {
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

async function handleListFiles(req: Request, url: URL) {
  const owner = url.searchParams.get('owner');
  const repo = url.searchParams.get('repo');
  const path = url.searchParams.get('path') || '';
  
  if (!owner || !repo) {
    return new Response(
      JSON.stringify({ error: "Owner and repo parameters are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
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

    const token = authHeader.replace('Bearer ', '');
    
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
        JSON.stringify({ error: "GitHub PAT not found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const githubPat = profileData[0].github_pat;

    // Fetch repository contents
    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const githubResponse = await fetch(githubUrl, {
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SmartAudit-AI',
      },
    });

    if (!githubResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch repository contents: ${githubResponse.status}` }),
        {
          status: githubResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const contents = await githubResponse.json();
    
    // Format the response
    const files = Array.isArray(contents) ? contents.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      download_url: item.download_url,
      isCodeFile: item.type === 'file' ? isCodeFile(item.name) : false
    })) : [{
      name: contents.name,
      path: contents.path,
      type: contents.type,
      size: contents.size,
      download_url: contents.download_url,
      isCodeFile: contents.type === 'file' ? isCodeFile(contents.name) : false
    }];

    return new Response(
      JSON.stringify({
        success: true,
        files: files,
        path: path
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error listing files:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

async function handleGetFileContent(req: Request, url: URL) {
  const owner = url.searchParams.get('owner');
  const repo = url.searchParams.get('repo');
  const path = url.searchParams.get('path');
  
  if (!owner || !repo || !path) {
    return new Response(
      JSON.stringify({ error: "Owner, repo, and path parameters are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
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

    const token = authHeader.replace('Bearer ', '');
    
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
        JSON.stringify({ error: "GitHub PAT not found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const githubPat = profileData[0].github_pat;

    // Fetch file content
    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const githubResponse = await fetch(githubUrl, {
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SmartAudit-AI',
      },
    });

    if (!githubResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch file content: ${githubResponse.status}` }),
        {
          status: githubResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fileData = await githubResponse.json();
    
    if (fileData.type !== 'file') {
      return new Response(
        JSON.stringify({ error: "Path does not point to a file" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Decode base64 content
    const content = atob(fileData.content.replace(/\s/g, ''));

    return new Response(
      JSON.stringify({
        success: true,
        content: content,
        path: path,
        size: fileData.size
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error fetching file content:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
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
// Helper function to check if file is a code file
function isCodeFile(filename: string): boolean {
  const codeExtensions = ['.sol', '.vy', '.rs', '.js', '.ts', '.jsx', '.tsx', '.py', '.cairo', '.move', '.go', '.java', '.cpp', '.c', '.h', '.json', '.md'];
  return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}
