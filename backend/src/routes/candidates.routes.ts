import { Router } from "express";
import { searchCandidates } from "../controllers/candidates.controller";

const router = Router();

// POST /api/candidates
router.post("/", searchCandidates);

export default router;
