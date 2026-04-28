import { Router } from "express";
import { create, list, getOne, update, remove } from "./clients.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { createClientSchema, updateClientSchema } from "./clients.schema";

const router = Router();

router.use(authenticate);

router.get("/", list);
router.post("/", validate(createClientSchema), create);
router.get("/:id", getOne);
router.patch("/:id", validate(updateClientSchema), update);
router.delete("/:id", remove);

export default router;
