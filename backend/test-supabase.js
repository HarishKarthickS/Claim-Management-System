// Test script for Supabase storage connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Log environment variables (without sensitive values)
console.log('Environment variables check:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Defined' : '✗ Missing');
console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✓ Defined' : '✗ Missing');
console.log('- SUPABASE_STORAGE_BUCKET:', process.env.SUPABASE_STORAGE_BUCKET);

// Create Supabase client with debug options
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test function - run this as main
async function testSupabaseConnection() {
  console.log('🔄 Starting Supabase connection test...');
  
  try {
    // 1. Basic connection test
    console.log('\n📡 Testing basic Supabase connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Basic connection test failed:', authError.message);
      return;
    }
    
    console.log('✅ Basic connection test successful');
    
    // 2. List all buckets
    console.log('\n📁 Listing all storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError.message);
    } else {
      console.log(`✅ Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
    
    // 3. Test specified bucket access
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET;
    console.log(`\n🧪 Testing access to bucket '${bucketName}'...`);
    
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName);
    
    if (bucketError) {
      console.error(`❌ Bucket '${bucketName}' access failed:`, bucketError.message);
      
      // 3a. Try to create bucket if it doesn't exist
      if (bucketError.message.includes('not found')) {
        console.log(`🔨 Attempting to create bucket '${bucketName}'...`);
        
        const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (createError) {
          console.error(`❌ Failed to create bucket:`, createError.message);
        } else {
          console.log(`✅ Successfully created bucket '${bucketName}'`);
        }
      }
    } else {
      console.log(`✅ Successfully accessed bucket '${bucketName}'`, bucketData);
      
      // 4. List files in the bucket
      console.log(`\n📋 Listing files in bucket '${bucketName}'...`);
      const { data: files, error: filesError } = await supabase.storage.from(bucketName).list();
      
      if (filesError) {
        console.error('❌ Failed to list files:', filesError.message);
      } else {
        console.log(`✅ Found ${files.length} files/folders in the bucket`);
        files.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata ? file.metadata.size + ' bytes' : 'folder'})`);
        });
      }
      
      // 5. Test file upload
      console.log('\n📤 Testing file upload...');
      
      // Create a small test file
      const testFilePath = path.join(__dirname, 'test-upload.txt');
      fs.writeFileSync(testFilePath, 'This is a test file for Supabase storage upload.');
      
      const testFileBuffer = fs.readFileSync(testFilePath);
      const testFileName = `test-upload-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(testFileName, testFileBuffer, {
          contentType: 'text/plain'
        });
        
      if (uploadError) {
        console.error('❌ File upload test failed:', uploadError.message);
      } else {
        console.log('✅ File upload test successful:', uploadData);
        
        // 6. Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(testFileName);
          
        console.log('🔗 Public URL:', urlData.publicUrl);
        
        // 7. Clean up - delete test file
        console.log('\n🧹 Cleaning up test file...');
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove([testFileName]);
          
        if (deleteError) {
          console.error('❌ Failed to delete test file:', deleteError.message);
        } else {
          console.log('✅ Test file deleted successfully');
        }
      }
      
      // Clean up local test file
      fs.unlinkSync(testFilePath);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during tests:', error.message);
  }
  
  console.log('\n🏁 Supabase connection test completed!');
}

// Run the test
testSupabaseConnection().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
}); 