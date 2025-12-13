import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
    isConfig: {
        type: Boolean,
        default: true
    },
    currentPin: {
        type: String,
        default: null
    },
    pinUsed: {
        type: Boolean,
        default: false
    },
    pinGeneratedAt: {
        type: Date,
        default: null
    },
    votingOpen: {
        type: Boolean,
        default: true
    }
});

// Ensure singleton pattern
configSchema.index({ isConfig: 1 }, { unique: true });

export default mongoose.models.Config || mongoose.model('Config', configSchema);
