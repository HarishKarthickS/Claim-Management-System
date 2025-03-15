import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Check if the model already exists to prevent recompilation in development
const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'insurer'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  methods: {
    // Method to compare password
    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }
  }
}));

// Add a pre-save hook to hash the password
if (!mongoose.models.User) {
  UserModel.schema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });
}

export default UserModel; 