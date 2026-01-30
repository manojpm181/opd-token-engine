import { TokenPriority } from "../enums/TokenPriority";
import { TokenStatus } from "../enums/TokenStatus";

export class Token {
  constructor(
    public readonly id: string,
    public slotId: string,
    public doctorId: string,
    public patientId: string,
    public priority: TokenPriority,
    public sequenceNumber: number,
    public status: TokenStatus = TokenStatus.ACTIVE
  ) {}
}
