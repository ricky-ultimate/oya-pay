import { Router } from "express";
import { list, getOne, create, update, remove } from "./templates.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { createTemplateSchema, updateTemplateSchema } from "./templates.schema";

const router = Router();

router.use(authenticate);

router.get("/", list);
router.post("/", validate(createTemplateSchema), create);
router.get("/:id", getOne);
router.put("/:id", validate(updateTemplateSchema), update);
router.delete("/:id", remove);

export default router;
