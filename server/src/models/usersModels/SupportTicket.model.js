/**
 * SupportTicket model – client-submitted support requests.
 *
 * Users can create tickets from their dashboard.
 * Admin can view, respond to, update status, and delete tickets.
 */
import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema(
  {
    message:       { type: String, required: true, trim: true, maxlength: 5000 },
    isAdmin:       { type: Boolean, default: false },
    respondedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type:   String,
      unique: true,
    },
    subject: {
      type:      String,
      required:  [true, 'Subject is required'],
      trim:      true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    category: {
      type:    String,
      enum:    ['General', 'Project Status', 'Billing', 'Technical', 'Account', 'Other'],
      default: 'General',
    },
    priority: {
      type:    String,
      enum:    ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type:    String,
      enum:    ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    message: {
      type:      String,
      required:  [true, 'Message is required'],
      trim:      true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    submittedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    adminNotes: {
      type:    String,
      default: '',
      trim:    true,
    },
    responses: [responseSchema],
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Auto-generate a human-readable ticket ID before first save
supportTicketSchema.pre('save', async function () {
  if (!this.ticketId) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketId = `TCK-${String(count + 1001).padStart(4, '0')}`;
  }
});

// Indexes
supportTicketSchema.index({ submittedBy: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ createdAt: -1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
