// program.routes.ts
import { Router } from "express";
import { ProgramController } from "./program.controller.js";
import { upload } from "../../middleware/upload.js";

const router = Router();

const uploadFields = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "bannerImage", maxCount: 1 },
  { name: "instructorImage", maxCount: 1 },
]);

router.post("/", uploadFields, ProgramController.createProgram);
router.get("/", ProgramController.getAllPrograms);
router.get("/slug/:slug", ProgramController.getProgramBySlug);
router.get("/:id", ProgramController.getProgramById);
router.delete("/:id", ProgramController.deleteProgram);
router.patch("/:id", uploadFields, ProgramController.updateProgram);

export default router;