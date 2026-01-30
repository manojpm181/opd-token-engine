import { Request, Response } from "express";
import { createTokenSchema } from "../utils/validators";
import { TokenAllocationService } from "../services/TokenAllocationService";
import { PrismaClient, TokenStatus } from "@prisma/client";

const prisma = new PrismaClient();
const service = new TokenAllocationService();

export class TokenController {

  async allocate(req: Request, res: Response) {
    const data = createTokenSchema.parse(req.body);

    const token = await service.allocateToken(data);

    res.status(201).json(token);
  }


  async cancel(req: Request, res: Response) {
    const id = req.params.id as string;

    const token = await prisma.token.update({
      where: { id },
      data: { status: TokenStatus.CANCELLED },
    });

    res.json(token);
  }


  async noShow(req: Request, res: Response) {
    const id = req.params.id as string;


  const token = await prisma.token.update({
    where: { id },
    data: { status: TokenStatus.NO_SHOW }

  });

  res.json(token);

  }
}
