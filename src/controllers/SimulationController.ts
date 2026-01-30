import { Request, Response } from "express";
import { SimulationService } from "../services/SimulationService";

const simulation = new SimulationService();

export class SimulationController {
  async run(req: Request, res: Response) {
    const result = await simulation.runFullDay();
    res.json(result);
  }
}
