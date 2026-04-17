import mongoose from 'mongoose';

const cannedResponseSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    shortcut:  { type: String, trim: true, default: '' },
    content:   { type: String, required: true, trim: true },
    category:  { type: String, trim: true, default: 'General' },
    isActive:  { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, versionKey: false }
);

cannedResponseSchema.index({ isActive: 1 });
cannedResponseSchema.index({ shortcut: 1 });

const CannedResponse =
  mongoose.models.CannedResponse ||
  mongoose.model('CannedResponse', cannedResponseSchema);

export default CannedResponse;
