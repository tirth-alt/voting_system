import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
    house: {
        type: String,
        enum: ['leo', 'phoenix', 'tusker', 'kong', 'unknown'],
        required: true
    },
    ballot: {
        type: Object,
        required: true
    },
    // Keep points_map for audit/backup purposes
    points_map: {
        type: Object,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for time-based queries
voteSchema.index({ timestamp: -1 });

export default mongoose.models.Vote || mongoose.model('Vote', voteSchema);
