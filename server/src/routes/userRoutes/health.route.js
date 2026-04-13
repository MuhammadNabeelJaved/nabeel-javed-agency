import express from "express";
import mongoose from "mongoose";
import { getRedisClient } from "../../config/redis.js";

const router = express.Router();

/** GET /api/v1/health — liveness + readiness probe */
router.get("/", async (_req, res) => {
    const memMB = process.memoryUsage();

    // MongoDB status
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

    // Redis status (non-blocking ping)
    let redisStatus = "unavailable";
    try {
        const redis = getRedisClient();
        if (redis) {
            await redis.ping();
            redisStatus = "connected";
        }
    } catch {
        redisStatus = "unavailable";
    }

    const healthy = dbStatus === "connected";

    res.status(healthy ? 200 : 503).json({
        status: healthy ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: {
            heapUsedMB: Math.round(memMB.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memMB.heapTotal / 1024 / 1024),
            rssMB: Math.round(memMB.rss / 1024 / 1024),
        },
        services: {
            db: dbStatus,
            redis: redisStatus,
        },
    });
});

/** POST /api/v1/health/vitals — receives Web Vitals from the frontend */
router.post("/vitals", (req, res) => {
    const { name, value, rating, delta, id } = req.body;
    if (process.env.NODE_ENV !== "production") {
        console.log(`[WebVital] ${name} = ${value} (${rating}) delta=${delta} id=${id}`);
    }
    res.status(204).end();
});

export default router;
