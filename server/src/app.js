import dotenv from "dotenv";
import express from "express"
import path from "path";
import cors from "cors"
import cookieParser from "cookie-parser"
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";


dotenv.config();
const app = express()



app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(helmet());

// Apply rate limiting to all requests
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

app.use(cookieParser())
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "src/public/uploads")));


// Routes
import userRoutes from "./routes/userRoutes/user.route.js"
import projectRoutes from "./routes/userRoutes/project.route.js";
import contactRoutes from "./routes/userRoutes/contact.route.js"
import reviewRoutes from "./routes/userRoutes/reviews.route.js";
import homePageRoutes from "./routes/userRoutes/homePage.route.js";
import servicesRoutes from "./routes/userRoutes/services.route.js";
import jobsRoutes from "./routes/userRoutes/jobs.route.js";
import adminProjectRoutes from "./routes/userRoutes/adminProject.route.js";
import cmsRoutes from "./routes/userRoutes/cms.route.js";
import jobApplicationRoutes from "./routes/userRoutes/jobApplication.route.js";
import clientRoutes from "./routes/userRoutes/client.route.js";
import notificationRoutes from "./routes/userRoutes/notification.route.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/homepage", homePageRoutes);
app.use("/api/v1/services", servicesRoutes);
app.use("/api/v1/jobs", jobsRoutes);
app.use("/api/v1/admin/projects", adminProjectRoutes);
app.use("/api/v1/cms", cmsRoutes);
app.use("/api/v1/job-applications", jobApplicationRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/notifications", notificationRoutes);
// 404 handler
app.use(notFound);

// Global Error
app.use(errorHandler);

export default app