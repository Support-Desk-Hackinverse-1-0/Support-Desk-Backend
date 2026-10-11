import mongoose from 'mongoose';
import crypto from 'crypto';

const chatWidgetSchema = new mongoose.Schema({
      tenantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Tenant',
          required: [true, 'Tenant ID is required'],
      },
      name: {
          type: String,
          required: [true, 'Widget name is required'],
          trim: true,
          maxlength: [100, 'Widget name cannot exceed 100 characters'],
      },
      description: {
          type: String,
          trim: true,
          maxlength: [500, 'Description cannot exceed 500 characters'],
      },
      // Styling Configuration
      primaryColor: {
          type: String,
          default: '#007bff',
          match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
      },
      secondaryColor: {
          type: String,
          default: '#6c757d',
          match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
      },
      textColor: {
          type: String,
          default: '#212529',
          match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
      },
      backgroundColor: {
          type: String,
          default: '#ffffff',
          match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
      },
      borderRadius: {
          type: Number,
          default: 8,
          min: [0, 'Border radius must be >= 0'],
          max: [50, 'Border radius must be <= 50'],
      },
      // Widget Position & Behavior
      position: {
          type: String,
          enum: {
              values: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
              message: 'Position must be one of: bottom-right, bottom-left, top-right, top-left',
          },
          default: 'bottom-right',
      },
      width: {
          type: Number,
          default: 350,
          min: [200, 'Width must be >= 200px'],
          max: [600, 'Width must be <= 600px'],
      },
      height: {
          type: Number,
          default: 500,
          min: [300, 'Height must be >= 300px'],
          max: [800, 'Height must be <= 800px'],
      },
      // Widget Settings
      title: {
          type: String,
          default: 'Chat with us',
          maxlength: [50, 'Title cannot exceed 50 characters'],
      },
      subtitle: {
          type: String,
          default: 'We are here to help',
          maxlength: [100, 'Subtitle cannot exceed 100 characters'],
      },
      welcomeMessage: {
          type: String,
          default: 'Hello! How can we help you today?',
          maxlength: [300, 'Welcome message cannot exceed 300 characters'],
      },
      showAvatar: {
          type: Boolean,
          default: true,
      },
      showTimestamps: {
          type: Boolean,
          default: true,
      },
      // API Key
      apiKey: {
          type: String,
          unique: true,
          required: true,
          select: false, // Don't return by default
      },
      // Status
      isActive: {
          type: Boolean,
          default: true,
      },
      // Domain Whitelist (optional security)
      allowedDomains: {
          type: [String],
          default: [],
      },
    },
    { timestamps: true }
);

// Index for efficient querying
chatWidgetSchema.index({ tenantId: 1 });
chatWidgetSchema.index({ isActive: 1 });

export default mongoose.model('ChatWidget', chatWidgetSchema);
