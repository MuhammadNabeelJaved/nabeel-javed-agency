/**
 * Task controller – Kanban task management for the TEAMDASH.
 *
 * Tasks belong to team members and can be linked to AdminProjects.
 * Supports full Kanban workflow: todo → in_progress → in_review → completed.
 */
import asyncHandler from "../../middlewares/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import Task from "../../models/usersModels/Task.model.js";
// ─── Create Task ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/tasks
 * Create a new task.
 * Body: { title, description?, status?, priority?, project?, assignedTo?, dueDate?, tags?, checklist? }
 */
export const createTask = asyncHandler(async (req, res) => {
    const { title, description, status, priority, project, assignedTo, dueDate, tags, checklist } =
        req.body;

    if (!title?.trim()) throw new AppError("Task title is required", 400);

    const task = await Task.create({
        title: title.trim(),
        description: description?.trim(),
        status: status || "todo",
        priority: priority || "medium",
        project: project || undefined,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
        tags: tags || [],
        checklist: checklist || [],
        createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id)
        .populate("assignedTo", "name photo teamProfile.position")
        .populate("createdBy", "name photo")
        .populate("project", "projectTitle category");

    return successResponse(res, "Task created", populatedTask, 201);
});

// ─── Get All Tasks ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/tasks
 * List tasks with optional filters.
 * Query: status, priority, project, assignedTo, search, page, limit
 * Admin/team see all; regular users only see assigned tasks.
 */
export const getAllTasks = asyncHandler(async (req, res) => {
    const { status, priority, project, assignedTo, search, page = 1, limit = 50 } = req.query;

    const filter = {};

    // Non-admin/team users only see their own tasks
    if (req.user.role === "user") {
        filter.assignedTo = req.user._id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (project) filter.project = project;
    if (assignedTo && req.user.role !== "user") filter.assignedTo = assignedTo;

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
        Task.find(filter)
            .populate("assignedTo", "name photo teamProfile.position")
            .populate("createdBy", "name photo")
            .populate("project", "projectTitle category")
            .sort({ priority: -1, dueDate: 1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Task.countDocuments(filter),
    ]);

    return successResponse(res, "Tasks fetched", {
        tasks,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    });
});

// ─── Get My Tasks ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/tasks/my
 * Get tasks assigned to the current user, grouped by Kanban status.
 */
export const getMyTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find({ assignedTo: req.user._id })
        .populate("project", "projectTitle category")
        .populate("createdBy", "name photo")
        .sort({ dueDate: 1, priority: -1 })
        .lean();

    // Group by status for Kanban board
    const grouped = {
        todo: tasks.filter((t) => t.status === "todo"),
        in_progress: tasks.filter((t) => t.status === "in_progress"),
        in_review: tasks.filter((t) => t.status === "in_review"),
        completed: tasks.filter((t) => t.status === "completed"),
    };

    return successResponse(res, "My tasks fetched", grouped);
});

// ─── Get Single Task ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/tasks/:id
 */
export const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id)
        .populate("assignedTo", "name photo teamProfile.position role")
        .populate("createdBy", "name photo")
        .populate("project", "projectTitle category status");

    if (!task) throw new AppError("Task not found", 404);

    // Users can only view their own tasks
    if (
        req.user.role === "user" &&
        task.assignedTo?._id?.toString() !== req.user._id.toString() &&
        task.createdBy?._id?.toString() !== req.user._id.toString()
    ) {
        throw new AppError("Not authorized to view this task", 403);
    }

    return successResponse(res, "Task fetched", task);
});

// ─── Update Task ──────────────────────────────────────────────────────────────

/**
 * PATCH /api/v1/tasks/:id
 * Update task details (admin, task creator, or assignee).
 */
export const updateTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) throw new AppError("Task not found", 404);

    const isAdmin = req.user.role === "admin";
    const isCreator = task.createdBy?.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator && !isAssignee) {
        throw new AppError("Not authorized to update this task", 403);
    }

    const allowed = [
        "title", "description", "priority", "project", "assignedTo",
        "dueDate", "tags", "checklist",
    ];

    for (const key of allowed) {
        if (req.body[key] !== undefined) {
            task[key] = req.body[key];
        }
    }

    await task.save();

    await task.populate([
        { path: "assignedTo", select: "name photo teamProfile.position" },
        { path: "createdBy", select: "name photo" },
        { path: "project", select: "projectTitle category" },
    ]);

    return successResponse(res, "Task updated", task);
});

// ─── Update Task Status ───────────────────────────────────────────────────────

/**
 * PATCH /api/v1/tasks/:id/status
 * Move a task to a different Kanban column.
 * Body: { status: "todo" | "in_progress" | "in_review" | "completed" }
 */
export const updateTaskStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["todo", "in_progress", "in_review", "completed"];
    if (!status || !validStatuses.includes(status)) {
        throw new AppError(`status must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const task = await Task.findById(req.params.id);
    if (!task) throw new AppError("Task not found", 404);

    const isAdmin = req.user.role === "admin";
    const isCreator = task.createdBy?.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator && !isAssignee) {
        throw new AppError("Not authorized to update this task", 403);
    }

    task.status = status;
    await task.save(); // pre-save hook auto-sets completedAt

    return successResponse(res, "Task status updated", { status: task.status, completedAt: task.completedAt });
});

// ─── Delete Task ──────────────────────────────────────────────────────────────

/**
 * DELETE /api/v1/tasks/:id
 * Delete a task (admin or creator).
 */
export const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) throw new AppError("Task not found", 404);

    const isAdmin = req.user.role === "admin";
    const isCreator = task.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) {
        throw new AppError("Not authorized to delete this task", 403);
    }

    await task.deleteOne();
    return successResponse(res, "Task deleted");
});

// ─── Task Statistics ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/tasks/stats
 * Aggregated task statistics for admin/team dashboard.
 */
export const getTaskStats = asyncHandler(async (req, res) => {
    const [statusBreakdown, priorityBreakdown, overdueTasks] = await Promise.all([
        Task.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Task.aggregate([
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]),
        Task.countDocuments({
            status: { $ne: "completed" },
            dueDate: { $lt: new Date() },
        }),
    ]);

    const total = await Task.countDocuments();

    return successResponse(res, "Task stats fetched", {
        total,
        overdue: overdueTasks,
        byStatus: statusBreakdown,
        byPriority: priorityBreakdown,
    });
});
