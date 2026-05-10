import { Router } from "express";
import { create, list, getOne, update, remove } from "./projects.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { createProjectSchema, updateProjectSchema } from "./projects.schema";

const router = Router();

router.use(authenticate);

router.get("/", list);
router.post("/", validate(createProjectSchema), create);
router.get("/:id", getOne);
router.patch("/:id", validate(updateProjectSchema), update);
router.delete("/:id", remove);

export default router;
