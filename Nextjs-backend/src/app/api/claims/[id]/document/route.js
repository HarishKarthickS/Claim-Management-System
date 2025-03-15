import { NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import { auth } from '@/lib/middleware/auth';
import Claim from '@/lib/models/Claim';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import supabase from '@/lib/utils/supabase';

// GET document for a specific claim
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // Get the URL to extract the token from query params
    const url = new URL(request.url);
    const tokenFromQuery = url.searchParams.get('token');
    
    const id = params.id;
    
    console.log(`Document request received for claim ID: ${id}`);
    console.log(`Request URL: ${request.url}`);
    console.log(`Token provided in query params: ${tokenFromQuery ? 'Yes' : 'No'}`);
    
    let authResult;
    
    if (tokenFromQuery) {
      // Manual verification of token from query params
      try {
        const decoded = jwt.verify(tokenFromQuery, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        console.log(`Token verified successfully for user ID: ${userId}`);
        
        // Find the user
        const user = await User.findById(userId);
        
        if (!user) {
          console.error(`User not found with ID: ${userId}`);
          return NextResponse.json(
            { message: "User not found" },
            { status: 404 }
          );
        }
        
        console.log(`User authenticated: ${user.name} (${user.role})`);
        
        // Set successful auth result
        authResult = {
          success: true,
          user: user
        };
      } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        return NextResponse.json(
          { message: "Invalid or expired token", error: tokenError.message },
          { status: 401 }
        );
      }
    } else {
      // Try standard auth method with headers
      authResult = await auth(request);
      if (!authResult.success) {
        console.error(`Auth failed: ${authResult.message}`);
        return NextResponse.json(
          { message: authResult.message },
          { status: authResult.status }
        );
      }
      console.log(`User authenticated via headers: ${authResult.user.name} (${authResult.user.role})`);
    }
    
    console.log(`Processing document request for claim ID: ${id}`);
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error(`Invalid claim ID format: ${id}`);
      return NextResponse.json(
        { message: 'Invalid claim ID format' },
        { status: 400 }
      );
    }
    
    const claim = await Claim.findById(id);
    
    if (!claim) {
      console.error(`Claim not found for ID: ${id}`);
      return NextResponse.json(
        { message: 'Claim not found' },
        { status: 404 }
      );
    }
    
    console.log(`Claim found: ID=${claim._id}, Status=${claim.status}, Document=${claim.documentUrl || 'none'}`);
    
    // Check if user has permission to view this claim
    if (authResult.user.role === 'patient' && 
        claim.patient.toString() !== authResult.user._id.toString()) {
      console.error(`Access denied for user ${authResult.user._id} to claim ${id}`);
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Check if claim has a document
    if (!claim.documentUrl) {
      console.error(`No document attached to claim ${id}`);
      return NextResponse.json(
        { message: 'No document attached to this claim' },
        { status: 404 }
      );
    }
    
    try {
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET;
      const fileUrl = claim.documentUrl;
      
      // Extract just the filename portion
      const urlParts = fileUrl.split('/');
      const originalFileName = urlParts[urlParts.length - 1];
      
      console.log(`Original document filename from URL: ${originalFileName}`);
      
      // Try to find the file, checking both in 'claims' folder and root bucket
      let filesToCheck = [];
      let foundFiles = [];
      
      // First, check the 'claims' folder
      console.log('Checking files in claims folder...');
      const { data: claimFiles, error: claimError } = await supabase.storage
        .from(bucketName)
        .list('claims');
        
      if (claimError) {
        console.error('Error listing claims folder:', claimError);
      } else if (claimFiles && claimFiles.length > 0) {
        console.log(`Found ${claimFiles.length} files in claims folder:`);
        claimFiles.forEach(file => console.log(`- ${file.name}`));
        
        // Add files to check list with 'claims/' prefix
        claimFiles.forEach(file => {
          filesToCheck.push({
            path: `claims/${file.name}`,
            name: file.name
          });
        });
      }
      
      // Next, check files in the root of the bucket
      console.log('Checking files in bucket root...');
      const { data: rootFiles, error: rootError } = await supabase.storage
        .from(bucketName)
        .list();
        
      if (rootError) {
        console.error('Error listing bucket root:', rootError);
      } else if (rootFiles && rootFiles.length > 0) {
        // Add files to check list (if they're not folders)
        rootFiles.forEach(item => {
          if (item.id) { // It's a file, not a folder
            filesToCheck.push({
              path: item.name,
              name: item.name
            });
          }
        });
      }
      
      console.log(`Total files to check: ${filesToCheck.length}`);
      
      // Find files that match the pattern of our document
      // We need to be flexible because of timestamp prefixes
      if (originalFileName.includes('.pdf')) {
        // Get the meaningful part of the filename (after the timestamp)
        const filenameParts = originalFileName.split('-');
        if (filenameParts.length > 1) {
          const importantPart = filenameParts.slice(1).join('-');
          console.log(`Looking for files containing: ${importantPart}`);
          
          // Find matching files
          foundFiles = filesToCheck.filter(file => 
            file.name.endsWith('.pdf') && 
            (file.name.includes(importantPart) || file.path.includes(importantPart))
          );
        } else {
          // Just try PDF files if we can't parse the name properly
          foundFiles = filesToCheck.filter(file => file.name.endsWith('.pdf'));
        }
      } else {
        // If not a PDF, just find files with similar names
        foundFiles = filesToCheck.filter(file => 
          file.name.includes(originalFileName) || 
          file.path.includes(originalFileName)
        );
      }
      
      console.log(`Found ${foundFiles.length} potential matching files:`, 
        foundFiles.map(f => f.path).join(', '));
      
      if (foundFiles.length === 0) {
        console.error('No matching document files found');
        return NextResponse.json(
          { message: 'Document not found in storage', details: { originalFileName } },
          { status: 404 }
        );
      }
      
      // Try to use the file in claims folder first, otherwise use most recent one
      let fileToUse;
      const claimsFile = foundFiles.find(file => file.path.startsWith('claims/'));
      
      if (claimsFile) {
        fileToUse = claimsFile.path;
        console.log(`Using file from claims folder: ${fileToUse}`);
      } else {
        // Sort by timestamp (newer first) and use the first one
        foundFiles.sort((a, b) => {
          const timeA = parseInt(a.name.split('-')[0]) || 0;
          const timeB = parseInt(b.name.split('-')[0]) || 0;
          return timeB - timeA;
        });
        
        fileToUse = foundFiles[0].path;
        console.log(`Using most recent file: ${fileToUse}`);
      }
      
      // Get public URL from Supabase instead of downloading the file
      console.log(`Getting public URL for document: ${fileToUse}`);
      
      // Get the public URL using Supabase getPublicUrl
      const { data: urlData, error: urlError } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileToUse);
        
      if (urlError) {
        console.error('Error getting public URL:', urlError);
        return NextResponse.json(
          { message: `Error getting public URL: ${urlError.message}` },
          { status: 500 }
        );
      }
      
      if (!urlData || !urlData.publicUrl) {
        console.error('No public URL returned from Supabase');
        return NextResponse.json(
          { message: 'Failed to get file URL' },
          { status: 500 }
        );
      }
      
      console.log(`Public URL generated: ${urlData.publicUrl}`);
      
      // Redirect the user to the public URL
      return NextResponse.redirect(urlData.publicUrl);
    } catch (fileError) {
      console.error('File retrieval error:', fileError);
      return NextResponse.json(
        { message: `Error retrieving document: ${fileError.message}`, stack: fileError.stack },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch document', stack: error.stack },
      { status: 500 }
    );
  }
} 