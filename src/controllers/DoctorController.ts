import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createDoctorSchema } from "../utils/validators";

const prisma = new PrismaClient();

export class DoctorController {
  async create(req: Request, res: Response) {
    const data = createDoctorSchema.parse(req.body);

    const doctor = await prisma.doctor.create({ data });

    res.status(201).json(doctor);
  }
}
