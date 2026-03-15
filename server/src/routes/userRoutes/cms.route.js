import express from "express";
import {
    getCMS,
    updateLogo,
    updateTechStack,
    addTechCategory,
    updateTechCategory,
    deleteTechCategory,
    updateConceptToReality,
    addProcessStep,
    updateProcessStep,
    deleteProcessStep,
    updateWhyChooseUs,
    addScrollingCard,
    updateScrollingCard,
    deleteScrollingCard,
} from "../../controllers/usersControllers/cms.controller.js";
import { userAuthenticated, authorizeRoles } from "../../middlewares/Auth.js";

const router = express.Router();

// Public – frontend reads all CMS content
router.get("/", getCMS);

// Admin-only writes
router.use(userAuthenticated, authorizeRoles("admin"));

// Global Logo
router.patch("/logo", updateLogo);

// Tech Stack
router.put("/tech-stack", updateTechStack);
router.post("/tech-stack/category", addTechCategory);
router.put("/tech-stack/category/:categoryId", updateTechCategory);
router.delete("/tech-stack/category/:categoryId", deleteTechCategory);

// Concept to Reality
router.put("/concept-to-reality", updateConceptToReality);
router.post("/concept-to-reality/step", addProcessStep);
router.put("/concept-to-reality/step/:stepId", updateProcessStep);
router.delete("/concept-to-reality/step/:stepId", deleteProcessStep);

// Why Choose Us
router.put("/why-choose-us", updateWhyChooseUs);
router.post("/why-choose-us/card", addScrollingCard);
router.put("/why-choose-us/card/:cardId", updateScrollingCard);
router.delete("/why-choose-us/card/:cardId", deleteScrollingCard);

export default router;
