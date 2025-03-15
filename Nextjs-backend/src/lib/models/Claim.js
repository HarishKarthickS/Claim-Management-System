import mongoose from 'mongoose';

// Check if the model already exists to prevent recompilation in development
const ClaimModel = mongoose.models.Claim || mongoose.model('Claim', new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  claimAmount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  documentUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAmount: {
    type: Number,
    min: 0
  },
  insurerComments: {
    type: String,
    trim: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}));

// Add a pre-save hook to update the lastUpdated timestamp
if (!mongoose.models.Claim) {
  ClaimModel.schema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
  });
}

export default ClaimModel; 