/**
 * ChatbotSession — stores public chatbot conversation history.
 *
 * Each session groups the full back-and-forth between one visitor (or logged-in
 * user) and the AI.  Authenticated users get their userId stored; anonymous
 * visitors are tracked by a client-generated UUID.
 */
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const chatbotSessionSchema = new mongoose.Schema({
  /** Client-generated UUID — present for every session (anonymous or auth). */
  sessionId: { type: String, required: true, unique: true, index: true },

  /** Set when the visitor is logged in. */
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  /** Captured from request headers / IP for analytics (last octet stripped). */
  metadata: {
    userAgent: { type: String, default: '', maxlength: 300 },
    ip:        { type: String, default: '' },
  },

  /** The full conversation, in order. */
  messages: { type: [messageSchema], default: [] },

  /** Cached message count so admins can sort without $size pipeline. */
  totalMessages: { type: Number, default: 0 },

  /** Admin can mark a conversation as resolved. */
  isResolved: { type: Boolean, default: false },

  lastActivity: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Keep lastActivity and totalMessages in sync on every save.
chatbotSessionSchema.pre('save', function (next) {
  this.totalMessages = this.messages.length;
  this.lastActivity  = new Date();
  next();
});

export default mongoose.model('ChatbotSession', chatbotSessionSchema);
