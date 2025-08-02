import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SetupStorageRequest {
  action: 'setup_policies'
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { action }: SetupStorageRequest = await req.json()

    if (action !== 'setup_policies') {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First, ensure the bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`)
    }

    const contractFilesBucket = buckets?.find(bucket => bucket.id === 'contract-files')
    
    if (!contractFilesBucket) {
      // Create the bucket
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket('contract-files', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'text/plain',
          'application/javascript',
          'text/javascript',
          'application/typescript',
          'text/x-solidity',
          'text/x-python',
          'text/x-rust',
          'application/json'
        ]
      })

      if (createBucketError) {
        throw new Error(`Failed to create bucket: ${createBucketError.message}`)
      }
    }

    // Set up storage policies using raw SQL
    const policies = [
      // Drop existing policies first
      `DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;`,
      
      // Create new policies
      `CREATE POLICY "Users can view own files"
       ON storage.objects FOR SELECT
       TO authenticated
       USING (
         bucket_id = 'contract-files' 
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,
       
      `CREATE POLICY "Users can upload own files"
       ON storage.objects FOR INSERT
       TO authenticated
       WITH CHECK (
         bucket_id = 'contract-files'
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,
       
      `CREATE POLICY "Users can update own files"
       ON storage.objects FOR UPDATE
       TO authenticated
       USING (
         bucket_id = 'contract-files'
         AND auth.uid()::text = (storage.foldername(name))[1]
       )
       WITH CHECK (
         bucket_id = 'contract-files'
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`,
       
      `CREATE POLICY "Users can delete own files"
       ON storage.objects FOR DELETE
       TO authenticated
       USING (
         bucket_id = 'contract-files'
         AND auth.uid()::text = (storage.foldername(name))[1]
       );`
    ]

    // Execute each policy
    for (const policy of policies) {
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', { sql: policy })
      if (policyError) {
        console.error(`Policy error: ${policyError.message}`)
        // Continue with other policies even if one fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Storage policies configured successfully',
        bucket_exists: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Setup storage error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to setup storage policies',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})