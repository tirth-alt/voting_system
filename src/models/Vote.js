import mongoose from 'mongoose';

// All votes are encrypted - no plain ballot storage
const voteSchema = new mongoose.Schema({
    house: {
        type: String,
        enum: ['leo', 'phoenix', 'tusker', 'kong', 'unknown'],
        required: true
    },
    // Encrypted ballot data (mandatory)
    encryptedBallot: {
        type: String,
        required: true
    },
    encryptionSalt: {
        type: String,
        required: true
    },
    encryptionIV: {
        type: String,
        required: true
    },
    encryptionAuthTag: {
        type: String,
        required: true
    },
    isEncrypted: {
        type: Boolean,
        default: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for time-based queries
voteSchema.index({ timestamp: -1 });

export default mongoose.models.Vote || mongoose.model('Vote', voteSchema);
