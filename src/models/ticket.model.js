import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
      tenantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Tenant',
          required: [true, 'Company/Tenant ID is required'],
      },
      customerEmail: {
          type: String,
          required: [true, 'Customer email is required'],
          lowercase: true,
          match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
      },
      subject: {
          type: String,
          required: [true, 'Ticket subject is required'],
          trim: true,
          maxlength: [200, 'Subject cannot exceed 200 characters'],
      },
      status: {
          type: String,
          enum: {
            values: ['open', 'assigned', 'resolved'],
            message: 'Status must be one of: open, assigned, resolved',
          },
          default: 'open',
      },
      assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
      },
      createdAt: {
          type: Date,
          default: Date.now,
      },
      updatedAt: {
          type: Date,
          default: Date.now,
      },
    },
    { timestamps: true }
);

// Index for efficient querying
ticketSchema.index({ tenantId: 1 });
ticketSchema.index({ customerEmail: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ assignedTo: 1 });

export default mongoose.model('Ticket', ticketSchema);
