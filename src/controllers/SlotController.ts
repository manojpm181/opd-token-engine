import { Request, Response } from "express";
import { PrismaClient, TokenStatus } from "@prisma/client";
import { createSlotSchema } from "../utils/validators";

const prisma = new PrismaClient();

export class SlotController {
  async create(req: Request, res: Response) {
    const data = createSlotSchema.parse(req.body);

    const slot = await prisma.slot.create({
      data: {
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime)
      }
    });

    res.status(201).json(slot);
  }

  async queue(req: Request, res: Response) {
    const slotId = req.params.id as string;


    const tokens = await prisma.token.findMany({
      where: {
        slotId,
        status: TokenStatus.ACTIVE
      },
      orderBy: [
        { priority: "desc" },
        { sequenceNumber: "asc" }
      ]
    });

    res.json(tokens);
  }
}
