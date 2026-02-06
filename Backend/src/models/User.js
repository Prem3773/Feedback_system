const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
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
    enum: ['student', 'teacher', 'admin'],
    required: true
  },
  subject: {
    type: String,
    required: function() {
      return this.role === 'teacher';
    },
    trim: true
  },
  attendance: {
    type: Number,
    default: 80,
    required: function() {
      return this.role === 'student';
    },
    min: 0,
    max: 100
  },
  attendanceVerified: {
    type: Boolean,
    default: true
  },
  marks: {
    type: Number,
    default: 0,
    required: function() {
      return this.role === 'student';
    },
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
