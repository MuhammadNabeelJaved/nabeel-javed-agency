/**
 * Task model – team task management with Kanban-style status columns.
 *
 * Tasks belong to team members and can be linked to AdminProjects.
 * The Kanban board in TEAMDASH shows four columns:
 *   To Do → In Progress → In Review → Completed
 *
 * Endpoints:
 *  - POST   /api/v1/tasks              – create task (team/admin)
 *  - GET    /api/v1/tasks              – list tasks (filtered by project/assignee/status)
 *  - GET    /api/v1/tasks/my           – my assigned tasks
 *  - GET    /api/v1/tasks/:id          – get single task
 *  - PATCH  /api/v1/tasks/:id          – update task
 *  - PATCH  /api/v1/tasks/:id/status   – update Kanban status
 *  - DELETE /api/v1/tasks/:id          – delete task (admin)
 */
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },

        description: {
            type: String,
            trim: true,
            maxlength: [2000, "Description cannot exceed 2000 characters"],
        },

        // Kanban column
        status: {
            type: String,
            enum: ["todo", "in_progress", "in_review", "completed"],
            default: "todo",
            index: true,
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
            index: true,
        },

        // Which AdminProject (portfolio project) this task belongs to
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdminProject",
            index: true,
        },

        // The team member assigned to this task
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },

        // Who created the task
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        dueDate: {
            type: Date,
        },

        // Completion timestamp (set automatically when status → completed)
        completedAt: {
            type: Date,
        },

        // Optional tags/labels
        tags: [
            {
                type: String,
                trim: true,
                maxlength: 50,
            },
        ],

        // Brief checklist items
        checklist: [
            {
                text: { type: String, required: true, trim: true },
                isCompleted: { type: Boolean, default: false },
            },
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Compound index for "get tasks for a project sorted by status"
taskSchema.index({ project: 1, status: 1, priority: -1 });
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });

// Auto-set completedAt when status changes to "completed"
taskSchema.pre("save", async function () {
    if (this.isModified("status")) {
        if (this.status === "completed" && !this.completedAt) {
            this.completedAt = new Date();
        } else if (this.status !== "completed") {
            this.completedAt = undefined;
        }
    }
});

// Virtual: is overdue?
taskSchema.virtual("isOverdue").get(function () {
    if (!this.dueDate || this.status === "completed") return false;
    return new Date() > this.dueDate;
});

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

export default Task;
