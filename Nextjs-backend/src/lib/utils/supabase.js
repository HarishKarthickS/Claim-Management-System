import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with error checking
let supabase;

try {
  // Check if environment variables are set
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('⚠️ Missing Supabase environment variables');
    console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
    console.error('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Missing');
  }
  
  // Initialize Supabase client
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  console.log('Supabase client initialized with URL:', process.env.SUPABASE_URL);
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a mock client that throws errors when methods are called
  supabase = {
    storage: {
      getBucket: () => Promise.reject(new Error('Supabase not properly initialized')),
      createBucket: () => Promise.reject(new Error('Supabase not properly initialized')),
      from: () => ({
        upload: () => Promise.reject(new Error('Supabase not properly initialized')),
        download: () => Promise.reject(new Error('Supabase not properly initialized')),
        getPublicUrl: () => ({ data: null, error: new Error('Supabase not properly initialized') })
      })
    }
  };
}

// Function to initialize Supabase and ensure bucket exists
export async function initSupabase() {
  console.log('Initializing Supabase connection...');
  console.log('Supabase configuration:');
  console.log('- URL:', process.env.SUPABASE_URL);
  console.log('- Bucket:', process.env.SUPABASE_STORAGE_BUCKET);
  console.log('- Service Key present:', !!process.env.SUPABASE_SERVICE_KEY);
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.SUPABASE_STORAGE_BUCKET) {
    console.error('❌ Missing required Supabase environment variables');
    return { error: 'Missing environment variables' };
  }
  
  try {
    // Check if bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(process.env.SUPABASE_STORAGE_BUCKET);
    
    if (bucketError) {
      console.error('❌ Bucket check failed:', bucketError.message);
      
      // Try to create the bucket if it doesn't exist
      if (bucketError.message.includes('not found')) {
        console.log(`🔨 Attempting to create bucket '${process.env.SUPABASE_STORAGE_BUCKET}'...`);
        
        const { data: createData, error: createError } = await supabase.storage.createBucket(
          process.env.SUPABASE_STORAGE_BUCKET, 
          { public: true }
        );
        
        if (createError) {
          console.error('❌ Failed to create bucket:', createError.message);
          return { error: `Failed to create bucket: ${createError.message}` };
        } else {
          console.log(`✅ Successfully created bucket '${process.env.SUPABASE_STORAGE_BUCKET}'`);
          return { success: true, message: 'Bucket created successfully' };
        }
      }
      
      return { error: `Bucket check failed: ${bucketError.message}` };
    } else {
      console.log(`✅ Bucket '${process.env.SUPABASE_STORAGE_BUCKET}' exists`);
      return { success: true, message: 'Bucket exists' };
    }
  } catch (error) {
    console.error('❌ Supabase initialization error:', error);
    return { error: `Initialization error: ${error.message}` };
  }
}

export default supabase; 