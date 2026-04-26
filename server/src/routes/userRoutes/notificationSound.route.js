import express from "express";
import { authorizeRoles, userAuthenticated } from "../../middlewares/Auth.js";
import uploadAudio from "../../middlewares/multerAudio.js";
import {
    createNotificationSound,
    createNotificationSoundRule,
    deleteNotificationSound,
    deleteNotificationSoundRule,
    getAdminNotificationSoundData,
    getMyNotificationSoundConfig,
    updateNotificationSound,
    updateNotificationSoundRule,
} from "../../controllers/usersControllers/notificationSound.controller.js";

const router = express.Router();

router.use(userAuthenticated);

router.get("/config", getMyNotificationSoundConfig);
router.get("/admin", authorizeRoles("admin"), getAdminNotificationSoundData);

router.post("/admin/sounds", authorizeRoles("admin"), uploadAudio.single("audio"), createNotificationSound);
router.put("/admin/sounds/:id", authorizeRoles("admin"), uploadAudio.single("audio"), updateNotificationSound);
router.delete("/admin/sounds/:id", authorizeRoles("admin"), deleteNotificationSound);

router.post("/admin/rules", authorizeRoles("admin"), createNotificationSoundRule);
router.put("/admin/rules/:id", authorizeRoles("admin"), updateNotificationSoundRule);
router.delete("/admin/rules/:id", authorizeRoles("admin"), deleteNotificationSoundRule);

export default router;
