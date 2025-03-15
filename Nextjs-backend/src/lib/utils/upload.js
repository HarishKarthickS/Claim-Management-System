import supabase from './supabase';

export async function uploadFileToSupabase(file, path) {
  try {
    // Check if Supabase is properly configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.SUPABASE_STORAGE_BUCKET) {
      throw new Error('Supabase configuration is incomplete. Check environment variables.');
    }
    
    console.log(`Starting file upload: ${file.name} (${file.size} bytes) to path: ${path}`);
    
    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Create a unique file name to prevent collisions
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `${path}/${fileName}`;
    
    console.log(`Uploading to Supabase path: ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
    
    console.log(`File uploaded successfully. Getting public URL...`);
    
    // Get public URL
    const { data: urlData, error: urlError } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(filePath);
    
    if (urlError) {
      console.error('Error getting public URL:', urlError);
      throw new Error(`Failed to get file URL: ${urlError.message}`);
    }
    
    if (!urlData || !urlData.publicUrl) {
      console.error('No public URL returned from Supabase');
      throw new Error('Failed to get file URL: No URL returned');
    }
    
    console.log(`Public URL generated: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

export async function getFilePublicUrl(filePath, path) {
  try {
    // Check if Supabase is properly configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.SUPABASE_STORAGE_BUCKET) {
      throw new Error('Supabase configuration is incomplete. Check environment variables.');
    }
    
    console.log(`Getting public URL for file: ${filePath} in path: ${path}`);
    
    if (!filePath) {
      throw new Error('No file path provided');
    }
    
    // If filePath already contains the path, use it directly
    const fullPath = path ? `${path}/${filePath}` : filePath;
    console.log(`Full path for Supabase URL: ${fullPath}`);
    
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET;
    
    // Get public URL for the file
    const { data, error } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fullPath);
    
    if (error) {
      console.error('Error getting public URL:', error);
      return { error: `Failed to get public URL: ${error.message}` };
    }
    
    if (!data || !data.publicUrl) {
      console.error('No public URL returned for:', fullPath);
      return { error: 'No public URL returned' };
    }
    
    console.log(`Successfully generated public URL for ${fullPath}: ${data.publicUrl}`);
    return { 
      publicUrl: data.publicUrl
    };
  } catch (error) {
    console.error('Error getting file public URL:', error);
    return { error: `Failed to get public URL: ${error.message}` };
  }
}

// Keep the original function for backward compatibility
export async function getFileFromSupabase(filePath, path) {
  console.warn('getFileFromSupabase is deprecated. Use getFilePublicUrl instead.');
  try {
    const { publicUrl, error } = await getFilePublicUrl(filePath, path);
    
    if (error) {
      return { error };
    }
    
    // For backward compatibility, redirect to get content type from extension
    let contentType = 'application/octet-stream';
    
    if (filePath.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (filePath.toLowerCase().endsWith('.png')) {
      contentType = 'image/png';
    } else if (filePath.toLowerCase().endsWith('.doc') || filePath.toLowerCase().endsWith('.docx')) {
      contentType = 'application/msword';
    }
    
    // Return a mock object that's compatible with the old function
    // but indicates that direct download is no longer supported
    return {
      data: null,
      contentType,
      publicUrl,
      deprecated: true,
      error: 'Direct file download is deprecated. Use the publicUrl to access the file.'
    };
  } catch (error) {
    console.error('File download error:', error);
    return { error: `Failed to retrieve file: ${error.message}` };
  }
} 