import { SlotStatus } from "../enums/SlotStatus";

export class Slot {
  constructor(
    public readonly id: string,
    public doctorId: string,
    public startTime: Date,
    public endTime: Date,
    public capacity: number,
    public status: SlotStatus = SlotStatus.SCHEDULED,
    public delayMinutes: number = 0
  ) {}
}
