import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
        ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ticket',
            required: [true, 'Ticket ID is required'],
        },
        sender: {
            type: String,
            enum: {
                values: ['customer', 'agent', 'ai'],
                message: 'Sender must be one of: customer, agent, ai',
            },
            required: [true, 'Sender type is required'],
        },
        message: {
            type: String,
            required: [true, 'Message content is required'],
            maxlength: [5000, 'Message cannot exceed 5000 characters'],
        },
    },
    { timestamps: true }
);

// Index for efficient querying
messageSchema.index({ ticketId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
