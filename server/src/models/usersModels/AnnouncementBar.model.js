import mongoose from "mongoose";

const announcementBarSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, default: "Main Bar" },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  bgColor: { type: String, default: "#7c3aed" },
  textColor: { type: String, default: "#ffffff" },
  scrollEnabled: { type: Boolean, default: true },
  tickerDuration: { type: Number, default: 30 },
  textAlign: { type: String, enum: ["left", "center", "right"], default: "center" },
  separatorVisible: { type: Boolean, default: true },
  separatorColor: { type: String, default: "" },
  itemSpacing: { type: Number, default: 32 },
  /**
   * Where this bar is displayed:
   *  'public'    — public website pages only (default, legacy behaviour)
   *  'dashboard' — user/team dashboards only (never shown on public pages)
   *  'both'      — shown everywhere: public pages AND dashboards
   */
  visibility: {
    type: String,
    enum: ['public', 'dashboard', 'both'],
    default: 'public',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("AnnouncementBar", announcementBarSchema);
