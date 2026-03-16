/**
 * Event model – calendar events for the TEAMDASH Calendar page.
 *
 * Events can be meetings, deadlines, milestones, or general reminders.
 * Attendees reference User documents.
 *
 * Endpoints:
 *  - POST   /api/v1/events              – create event (team/admin)
 *  - GET    /api/v1/events              – list events (date range filter)
 *  - GET    /api/v1/events/my           – my events (as attendee or creator)
 *  - GET    /api/v1/events/:id          – get single event
 *  - PATCH  /api/v1/events/:id          – update event (creator/admin)
 *  - DELETE /api/v1/events/:id          – delete event (creator/admin)
 */
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Event title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },

        description: {
            type: String,
            trim: true,
            maxlength: [1000, "Description cannot exceed 1000 characters"],
        },

        type: {
            type: String,
            enum: ["meeting", "deadline", "milestone", "reminder", "other"],
            default: "meeting",
            index: true,
        },

        startDate: {
            type: Date,
            required: [true, "Start date is required"],
            index: true,
        },

        endDate: {
            type: Date,
        },

        // All-day event flag — times are ignored when true
        allDay: {
            type: Boolean,
            default: false,
        },

        // Location (physical address or video call link)
        location: {
            type: String,
            trim: true,
            maxlength: [300, "Location cannot exceed 300 characters"],
        },

        // Display colour for the calendar (Tailwind class or hex)
        color: {
            type: String,
            trim: true,
            default: "purple",
        },

        // Invited attendees
        attendees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Optional link to a project
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdminProject",
        },

        // Recurring event support (simple weekly/monthly)
        recurrence: {
            type: String,
            enum: ["none", "daily", "weekly", "monthly"],
            default: "none",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ attendees: 1, startDate: 1 });

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

export default Event;
