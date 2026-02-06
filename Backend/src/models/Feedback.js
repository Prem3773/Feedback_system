const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['hostel', 'teacher', 'campus'],
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.category === 'teacher';
    }
  },
  responses: {
    type: Object,
    required: true
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  aiAnalysis: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
