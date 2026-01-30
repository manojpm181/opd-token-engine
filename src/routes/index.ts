import { Router } from "express";
import { DoctorController } from "../controllers/DoctorController";
import { SlotController } from "../controllers/SlotController";
import { TokenController } from "../controllers/TokenController";
import { SimulationController } from "../controllers/SimulationController";


const router = Router();

const doctor = new DoctorController();
const slot = new SlotController();
const token = new TokenController();
const simulation = new SimulationController();


router.post("/doctors", doctor.create);
router.post("/slots", slot.create);
router.get("/slots/:id/queue", slot.queue);

router.post("/tokens", token.allocate);
router.post("/tokens/:id/cancel", token.cancel);
router.post("/tokens/:id/no-show", token.noShow);
router.post("/simulate/opd-day", simulation.run);




export default router;
