import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true,
  },
  leftPosterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poster',
    required: true,
  },
  rightPosterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poster',
    required: true,
  },
  selectedPosterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poster',
    required: true,
  }
}, { _id: false });

const surveyResponseSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  answers: {
    type: [answerSchema],
    required: true,
    validate: [
      {
        validator: function(val) {
          return val.length === 6;
        },
        message: 'Survey response must contain exactly 6 answers.'
      }
    ]
  },
  name: {
    type: String,
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

export default SurveyResponse;
