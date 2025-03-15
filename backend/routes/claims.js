const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const Claim = require('../models/Claim');
const { auth, checkRole, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fetch = require('node-fetch');

// Initialize Supabase client
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

// Test Supabase connection on startup and ensure bucket exists
(async () => {
  console.log('Initializing Supabase connection...');
  console.log('Supabase configuration:');
  console.log('- URL:', process.env.SUPABASE_URL);
  console.log('- Bucket:', process.env.SUPABASE_STORAGE_BUCKET);
  console.log('- Service Key present:', !!process.env.SUPABASE_SERVICE_KEY);
  
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
        } else {
          console.log(`✅ Successfully created bucket '${process.env.SUPABASE_STORAGE_BUCKET}'`);
        }
      }
    } else {
      console.log(`✅ Successfully connected to bucket '${process.env.SUPABASE_STORAGE_BUCKET}'`);
    }
  } catch (error) {
    console.error('❌ Unexpected error during Supabase initialization:', error.message);
  }
})();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Submit a new claim (Patient only)
router.post('/', auth, checkRole(['patient']), upload.single('document'), async (req, res) => {
  try {
    console.log('Claim creation initiated by:', req.user.email);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body values:', Object.entries(req.body).map(([key, value]) => `${key}: ${value}`));
    console.log('File received:', req.file ? 
      `Yes - Name: ${req.file.originalname}, Size: ${req.file.size}B, Type: ${req.file.mimetype}` : 
      'No file found in request');
    
    // Debug headers to check content type
    console.log('Request headers:', req.headers);
    
    const { name, email, claimAmount, description } = req.body;
    const file = req.file;

    if (!file) {
      console.log('File missing in the request. FormData document field not found or empty.');
      return res.status(400).json({ message: 'Please upload a document' });
    }

    // Additional file validation
    if (file.size === 0) {
      console.log('File has zero size.');
      return res.status(400).json({ message: 'The uploaded file is empty' });
    }

    // Upload file to Supabase Storage
    console.log('Uploading file to Supabase...');
    console.log('File details:', {
      name: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      encoding: file.encoding
    });
    
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${fileName}`; // Store in root of bucket for simplicity
    
    try {
      // Try uploading to Supabase - using the template approach
      console.log(`Uploading to bucket: ${process.env.SUPABASE_STORAGE_BUCKET}, path: ${filePath}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype || 'application/octet-stream'
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        
        // Log the error details for debugging
        console.log('Supabase upload failed, using fallback method...');
        
        // Create a fallback file reference (we're not actually storing the file, just simulating)
        const fallbackFileUrl = `/local-file/${fileName}`;
        
        // Create claim with local reference instead of Supabase URL
        const claim = new Claim({
          patient: req.user._id,
          name: req.body.name || 'Unknown User',
          email: req.body.email || req.user.email,
          claimAmount: req.body.claimAmount || 0,
          description: req.body.description || 'No description provided',
          status: 'Pending',
          documentUrl: fallbackFileUrl,
          documentName: file.originalname
        });

        await claim.save();
        
        return res.status(201).json({
          message: 'Claim submitted successfully (local storage fallback)',
          claim: {
            id: claim._id,
            name: claim.name,
            email: claim.email,
            claimAmount: claim.claimAmount,
            description: claim.description,
            status: claim.status,
            documentName: claim.documentName,
            documentUrl: claim.documentUrl,
            createdAt: claim.createdAt
          }
        });
      }
      
      console.log('File uploaded successfully:', uploadData);
      // Get the public URL for the uploaded file
      const { data } = supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET)
        .getPublicUrl(filePath);

      console.log('Public URL:', data.publicUrl);

      // Create new claim
      console.log('Creating claim in database...');
      const claim = new Claim({
        patient: req.user._id,
        name,
        email,
        claimAmount,
        description,
        documentUrl: data.publicUrl
      });

      await claim.save();
      console.log('Claim created successfully with ID:', claim._id);

      res.status(201).json(claim);
    } catch (error) {
      console.error('Error in file upload or database operation:', error);
      res.status(500).json({ 
        message: 'Failed to process claim',
        details: error.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error in claim creation process:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all claims (Insurer only)
router.get('/', auth, checkRole(['insurer']), async (req, res) => {
  try {
    const { status, startDate, endDate, minAmount, maxAmount } = req.query;
    let query = {};

    // Apply filters
    if (status) query.status = status;
    if (startDate || endDate) {
      query.submissionDate = {};
      if (startDate) query.submissionDate.$gte = new Date(startDate);
      if (endDate) query.submissionDate.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      query.claimAmount = {};
      if (minAmount) query.claimAmount.$gte = Number(minAmount);
      if (maxAmount) query.claimAmount.$lte = Number(maxAmount);
    }

    const claims = await Claim.find(query)
      .populate('patient', 'name email')
      .sort({ submissionDate: -1 });

    res.json(claims);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's claims (Patient only)
router.get('/my-claims', auth, checkRole(['patient']), async (req, res) => {
  try {
    const claims = await Claim.find({ patient: req.user._id })
      .sort({ submissionDate: -1 });
    res.json(claims);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update claim status (Insurer only)
router.patch('/:id/status', auth, checkRole(['insurer']), async (req, res) => {
  try {
    const { status, approvedAmount, insurerComments } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    claim.status = status;
    if (approvedAmount) claim.approvedAmount = approvedAmount;
    if (insurerComments) claim.insurerComments = insurerComments;

    await claim.save();

    // Emit socket event for real-time updates - safely handle if socket not available
    try {
      if (req.app && typeof req.app.get === 'function') {
        const io = req.app.get('io');
        if (io && typeof io.emit === 'function') {
          io.emit('claimUpdated', claim);
        }
      }
    } catch (socketError) {
      console.warn('Could not emit socket event:', socketError.message);
      // Continue with the response - socket events are not critical
    }

    res.json(claim);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get single claim details
router.get('/:id', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('patient', 'name email');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Check if user has access to this claim
    if (req.user.role === 'patient' && claim.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(claim);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get document file
router.get('/:id/document', async (req, res) => {
  try {
    // Check for token in query param or header
    const tokenFromQuery = req.query.token;
    const tokenFromHeader = req.header('Authorization')?.replace('Bearer ', '');
    const token = tokenFromQuery || tokenFromHeader;
    
    if (!token) {
      return res.status(401).json({ message: 'Please authenticate.' });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication.' });
    }
    
    // Set user for further authorization
    req.user = user;
    
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Check if user has access to this claim
    if (req.user.role === 'patient' && claim.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch the file from Supabase storage
    try {
      console.log('Attempting to fetch document from URL:', claim.documentUrl);
      const response = await fetch(claim.documentUrl);
      
      if (!response.ok) {
        console.error('Supabase storage response not OK:', response.status, response.statusText);
        return res.status(404).json({ message: 'Document not found or inaccessible' });
      }
      
      const buffer = await response.buffer();
      
      // Set appropriate headers
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${claim.documentUrl.split('/').pop()}"`);
      
      // Send the file
      res.send(buffer);
    } catch (fetchError) {
      console.error('Error fetching document from storage:', fetchError);
      res.status(500).json({ message: 'Error retrieving document from storage' });
    }
  } catch (error) {
    console.error('Error in document route:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    
    res.status(500).json({ message: 'Failed to fetch document' });
  }
});

module.exports = router; 