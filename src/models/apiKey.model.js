import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
      tenantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Tenant',
          required: [true, 'Tenant ID is required'],
          index: true,
      },
      chatWidgetId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ChatWidget',
          required: [true, 'Chat Widget ID is required'],
      },
      key: {
          type: String,
          required: [true, 'API Key is required'],
          unique: true,
          select: false, // Don't return by default
      },
      name: {
          type: String,
          required: [true, 'Key name is required'],
          trim: true,
          maxlength: [100, 'Key name cannot exceed 100 characters'],
      },
      description: {
          type: String,
          trim: true,
          maxlength: [500, 'Description cannot exceed 500 characters'],
      },
      // Usage Tracking
      requestCount: {
          type: Number,
          default: 0,
      },
      lastUsed: {
          type: Date,
          default: null,
      },
      // Status
      isActive: {
          type: Boolean,
          default: true,
      },
      // Expiration (optional)
      expiresAt: {
          type: Date,
          default: null, // null means never expires
      },
      // Rate Limiting
      rateLimit: {
          type: Number,
          default: 1000, // requests per day
      },
    },
    { timestamps: true }
);

// Index for efficient querying
apiKeySchema.index({ tenantId: 1, isActive: 1 });
apiKeySchema.index({ key: 1, isActive: 1 });
apiKeySchema.index({ chatWidgetId: 1 });

export default mongoose.model('ApiKey', apiKeySchema);
