import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    positionId: {
        type: String,
        required: true
    },
    house: {
        type: String,
        enum: ['leo', 'phoenix', 'tusker', 'kong', null],
        default: null
    },
    tagline: String,
    photo: String,
    isNota: {
        type: Boolean,
        default: false
    },

    // Vote counts
    pref1_count: {
        type: Number,
        default: 0
    },
    pref2_count: {
        type: Number,
        default: 0
    },
    total_points: {
        type: Number,
        default: 0
    }
});

// Indexes for efficient queries
candidateSchema.index({ positionId: 1 });
candidateSchema.index({ house: 1 });
candidateSchema.index({ total_points: -1, pref1_count: -1, pref2_count: -1 });

export default mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
