# Token Allocation Algorithm — Pseudocode

## Purpose
This document defines the deterministic, priority-driven algorithm used to allocate
patient tokens to doctor slots in the OPD Token Engine.

The algorithm guarantees:
- Strict priority enforcement
- Emergency overrides
- Transaction safety
- Auditability
- Deterministic behavior (no randomness)

---

## Domain Constraints (Non-Negotiable)

Priority order (highest → lowest):

1. EMERGENCY
2. PAID
3. FOLLOW_UP
4. ONLINE
5. WALK_IN

Slot capacity is a hard limit and cannot be exceeded,
except by EMERGENCY tokens via displacement.

---

## Definitions

- Slot: A doctor + time window with fixed capacity
- Token: A patient request for a slot
- ACTIVE token: Currently allocated and valid
- DISPLACED token: Removed due to higher-priority insertion

---

## Deterministic Ordering Rules

When ordering tokens within a slot:

1. Priority (higher first)
2. sequenceNumber (lower first)
3. createdAt (earlier first)

This ensures fairness, explainability, and repeatability.

---

## Core Allocation Algorithm

BEGIN TRANSACTION

LOCK slot row FOR UPDATE

FETCH slot by slotId
IF slot does not exist OR slot.status != SCHEDULED
    THROW "Slot unavailable"

FETCH all ACTIVE tokens for slot
ORDER BY priority ASC, sequenceNumber DESC
(lowest priority token appears first)

SET capacityReached = (activeTokens.count >= slot.capacity)

IF incomingToken.priority == EMERGENCY
    IF capacityReached
        lowestToken = activeTokens[0]
        UPDATE lowestToken.status = DISPLACED
        LOG displacement reason
    INSERT incomingToken as ACTIVE

ELSE (Non-Emergency token)
    IF NOT capacityReached
        INSERT incomingToken as ACTIVE
    ELSE
        lowestToken = activeTokens[0]
        IF incomingToken.priority > lowestToken.priority
            UPDATE lowestToken.status = DISPLACED
            INSERT incomingToken as ACTIVE
            LOG displacement reason
        ELSE
            REJECT allocation with reason "Slot full"

LOG allocation action in AuditLog

COMMIT TRANSACTION

---

## Failure Guarantees

- No double allocation
- No race conditions
- No capacity violation
- All decisions are auditable

---

## Why Database-Driven (Not In-Memory)

- Crash safe
- Horizontally scalable
- Multi-instance compatible
- Legal audit readiness

Database is the single source of truth.