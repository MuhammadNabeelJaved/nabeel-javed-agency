import jwt from "jsonwebtoken";
import AppError from "../utils/AppError";

// User authentication and token methods

export const userAuthenticated = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Unauthorized: No token provided", 401);
        }
        const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (!decoded || !decoded.id) {
            throw new AppError("Unauthorized: Invalid token", 401);
        }

        req.user = { id: decoded.id };
        next();
    } catch (error) {
        throw new AppError("Unauthorized: Invalid token", 401);
    }
};

// Middleware for role-based access control
// ========================
// Role-based Authorization
// ========================
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError("Not authorized", 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Role (${req.user.role}) is not authorized to access this resource`,
                    403
                )
            );
        }

        next();
    };
};