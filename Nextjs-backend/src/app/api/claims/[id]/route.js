import { NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import { auth, checkRole } from '@/lib/middleware/auth';
import Claim from '@/lib/models/Claim';
import mongoose from 'mongoose';
import { emitToAll } from '../../../../socketServer';

// GET a specific claim
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const authResult = await auth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: authResult.status }
      );
    }
    
    // Get ID from params and await it
    const id = params.id;
    
    console.log(`Fetching claim with ID: ${id}`);
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid claim ID format' },
        { status: 400 }
      );
    }
    
    const claim = await Claim.findById(id);
    
    if (!claim) {
      return NextResponse.json(
        { message: 'Claim not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to view this claim
    if (authResult.user.role === 'patient' && 
        claim.patient.toString() !== authResult.user._id.toString()) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(claim);
  } catch (error) {
    console.error('Get claim error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch claim' },
      { status: 500 }
    );
  }
}

// PUT/UPDATE a claim
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const authResult = await auth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: authResult.status }
      );
    }
    
    // Get ID from params and await it
    const id = params.id;
    
    console.log(`Updating claim with ID: ${id}`);
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid claim ID format' },
        { status: 400 }
      );
    }
    
    const claim = await Claim.findById(id);
    
    if (!claim) {
      return NextResponse.json(
        { message: 'Claim not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Different update logic based on user role
    if (authResult.user.role === 'insurer') {
      // Insurers can update status, approvedAmount, and insurerComments
      const { status, approvedAmount, insurerComments } = body;
      
      if (status && !['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json(
          { message: 'Invalid status value' },
          { status: 400 }
        );
      }
      
      if (status) claim.status = status;
      if (approvedAmount !== undefined) claim.approvedAmount = approvedAmount;
      if (insurerComments) claim.insurerComments = insurerComments;
      
    } else if (authResult.user.role === 'patient') {
      // Patients can only update their own claims and only if status is pending
      if (claim.patient.toString() !== authResult.user._id.toString()) {
        return NextResponse.json(
          { message: 'Access denied' },
          { status: 403 }
        );
      }
      
      if (claim.status !== 'pending') {
        return NextResponse.json(
          { message: 'Cannot update claim that is not pending' },
          { status: 400 }
        );
      }
      
      // Patients can update description and claimAmount
      const { description, claimAmount } = body;
      
      if (description) claim.description = description;
      if (claimAmount) claim.claimAmount = claimAmount;
    }
    
    claim.lastUpdated = new Date();
    const updatedClaim = await claim.save();
    
    // Emit real-time update event via Socket.IO
    try {
      console.log('Emitting claimUpdated event:', updatedClaim._id);
      emitToAll('claimUpdated', updatedClaim);
    } catch (socketError) {
      console.error('Failed to emit socket event:', socketError);
      // Don't fail the request if socket emission fails
    }
    
    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error('Update claim error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update claim' },
      { status: 500 }
    );
  }
}

// DELETE a claim
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const authResult = await auth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: authResult.status }
      );
    }
    
    // Get ID from params and await it
    const id = params.id;
    
    console.log(`Deleting claim with ID: ${id}`);
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid claim ID format' },
        { status: 400 }
      );
    }
    
    const claim = await Claim.findById(id);
    
    if (!claim) {
      return NextResponse.json(
        { message: 'Claim not found' },
        { status: 404 }
      );
    }
    
    // Only patients can delete their own claims and only if status is pending
    if (authResult.user.role !== 'patient' || 
        claim.patient.toString() !== authResult.user._id.toString()) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }
    
    if (claim.status !== 'pending') {
      return NextResponse.json(
        { message: 'Cannot delete claim that is not pending' },
        { status: 400 }
      );
    }
    
    await Claim.findByIdAndDelete(id);
    
    // Emit real-time delete event via Socket.IO
    try {
      console.log('Emitting claimDeleted event:', id);
      emitToAll('claimDeleted', id);
    } catch (socketError) {
      console.error('Failed to emit socket event:', socketError);
      // Don't fail the request if socket emission fails
    }
    
    return NextResponse.json(
      { message: 'Claim deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete claim error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete claim' },
      { status: 500 }
    );
  }
} 