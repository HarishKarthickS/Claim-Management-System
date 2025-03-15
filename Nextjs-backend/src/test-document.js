/**
 * Test script for Supabase document retrieval
 * Usage: node test-document.js claims/document-name.pdf
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check if the document path is provided as an argument
const documentPath = process.argv[2];
if (!documentPath) {
  console.error('❌ No document path provided. Usage: node test-document.js claims/document-name.pdf');
  process.exit(1);
}

// Check for required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_STORAGE_BUCKET'];
const missingEnvVars = requiredEnvVars.filter(variable => !process.env[variable]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all Supabase configuration is set.');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET;

console.log(`🔍 Testing Supabase document retrieval from ${bucketName} bucket...`);
console.log(`📄 Document path: ${documentPath}`);

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to test document retrieval
async function testDocumentRetrieval() {
  try {
    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    if (!bucketExists) {
      console.error(`❌ Bucket '${bucketName}' does not exist. Available buckets:`, buckets.map(b => b.name).join(', '));
      return;
    }
    
    console.log(`✅ Bucket '${bucketName}' exists`);
    
    // Try to get the document
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(documentPath);
      
    if (error) {
      console.error('❌ Error retrieving document:', error.message);
      
      // List files in the bucket to help troubleshoot
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list('claims');
        
      if (listError) {
        console.error('❌ Error listing files in claims folder:', listError.message);
      } else if (files.length === 0) {
        console.log('ℹ️ No files found in the claims folder');
      } else {
        console.log('📁 Available files in claims folder:');
        files.forEach(file => console.log(`- ${file.name}`));
      }
      
      return;
    }
    
    // Success - save the file locally for verification
    const saveDir = './temp';
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    
    const fileName = path.basename(documentPath);
    const savePath = path.join(saveDir, fileName);
    
    const blob = await data.arrayBuffer();
    fs.writeFileSync(savePath, Buffer.from(blob));
    
    console.log(`✅ Document retrieved successfully!`);
    console.log(`💾 Saved to: ${savePath}`);
    
    // Get file size
    const stats = fs.statSync(savePath);
    console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// Run the test
testDocumentRetrieval(); 