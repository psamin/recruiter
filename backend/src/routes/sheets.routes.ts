import { Router } from "express";
import { addCandidate } from "../controllers/sheets.controller";

const router = Router();

// POST /api/sheets/add-candidate
router.post("/add-candidate", addCandidate);

export default router;
