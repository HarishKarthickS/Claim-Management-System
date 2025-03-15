import { NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import { auth, checkRole } from '@/lib/middleware/auth';
import Claim from '@/lib/models/Claim';
import { uploadFileToSupabase } from '@/lib/utils/upload';
import { initSupabase } from '@/lib/utils/supabase';
import { emitToAll } from '../../../socketServer';

// Initialize Supabase on startup
initSupabase().catch(console.error);

// GET all claims (with role-based filtering)
export async function GET(request) {
  try {
    await connectDB();
    
    const authResult = await auth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: authResult.status }
      );
    }
    
    const user = authResult.user;
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    let query = {};
    
    // Role-based filtering
    if (user.role === 'patient') {
      // Patients can only see their own claims
      query.patient = user._id;
    }
    
    // Status filtering (if provided)
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    const claims = await Claim.find(query).sort({ submissionDate: -1 });
    
    return NextResponse.json(claims);
  } catch (error) {
    console.error('Get claims error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}

// POST a new claim
export async function POST(request) {
  try {
    await connectDB();
    
    const authResult = await auth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: authResult.status }
      );
    }
    
    // Check if user is a patient
    const roleCheck = checkRole(authResult.user, ['patient']);
    if (!roleCheck.success) {
      return NextResponse.json(
        { message: roleCheck.message },
        { status: roleCheck.status }
      );
    }
    
    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const claimAmount = formData.get('claimAmount');
    const description = formData.get('description');
    const document = formData.get('document');
    
    if (!name || !email || !claimAmount || !description || !document) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Upload document to Supabase
    const documentUrl = await uploadFileToSupabase(document, 'claims');
    
    // Create new claim
    const claim = new Claim({
      patient: authResult.user._id,
      name,
      email,
      claimAmount: parseFloat(claimAmount),
      description,
      documentUrl
    });
    
    const savedClaim = await claim.save();
    
    // Emit real-time event via Socket.IO
    try {
      console.log('Emitting claimCreated event:', savedClaim._id);
      emitToAll('claimCreated', savedClaim);
    } catch (socketError) {
      console.error('Failed to emit socket event:', socketError);
      // Don't fail the request if socket emission fails
    }
    
    return NextResponse.json(savedClaim, { status: 201 });
  } catch (error) {
    console.error('Create claim error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create claim' },
      { status: 500 }
    );
  }
} 