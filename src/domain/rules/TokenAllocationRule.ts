import { TokenPriority } from "../enums/TokenPriority";

const PRIORITY_RANK: Record<TokenPriority, number> = {
  EMERGENCY: 3,
  PAID: 2,
  FOLLOW_UP: 1,
};

export class TokenAllocationRule {
  static canDisplace(
    incoming: TokenPriority,
    existing: TokenPriority
  ): boolean {
    return (
      incoming === TokenPriority.EMERGENCY ||
      PRIORITY_RANK[incoming] > PRIORITY_RANK[existing]
    );
  }
}
