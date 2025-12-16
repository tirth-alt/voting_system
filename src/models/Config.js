import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
    isConfig: {
        type: Boolean,
        default: true,
        unique: true
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
        default: false  // Voting closed by default, Dean must enable encryption first
    },
    // Encryption configuration
    encryptionEnabled: {
        type: Boolean,
        default: false
    },
    // Encrypted password data (Dean's password encrypted with system key)
    encryptedPassword: {
        type: String,
        default: null
    },
    encryptionPasswordSalt: {
        type: String,
        default: null
    },
    encryptionPasswordIV: {
        type: String,
        default: null
    },
    encryptionPasswordAuthTag: {
        type: String,
        default: null
    },
    encryptionEnabledAt: {
        type: Date,
        default: null
    }
});

// Ensure singleton pattern
configSchema.index({ isConfig: 1 }, { unique: true });

export default mongoose.models.Config || mongoose.model('Config', configSchema);

