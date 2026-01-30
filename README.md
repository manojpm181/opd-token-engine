# OPD Token Engine

## Executive Summary

The OPD Token Engine is a **deterministic, priority‑aware outpatient queue management system** designed to model and validate real‑world hospital OPD workflows under constrained capacity. The system focuses on **correctness, explainability, and transactional safety**, rather than UI or superficial features.

This repository represents how an Industry or Passionate backend engineer  would approach a **mission‑critical scheduling problem**: isolate domain rules, enforce invariants at the data layer, and verify behavior via controlled simulation instead of assumptions.

---

## Problem Statement (Real‑World Framing)

Outpatient departments face unavoidable constraints:

* Limited slot capacity per doctor
* Multiple priority classes (Emergency > Paid > Follow‑up)
* Walk‑ins that disrupt pre‑planned schedules
* Regulatory and operational need for explainable decisions

Most systems fail silently under these conditions, producing unfair queues or inconsistent state.

**This engine exists to guarantee predictable behavior under pressure.**

---

## Core Design Principles

### 1. Deterministic Allocation

Token allocation is **rule‑based**, not heuristic:

* Priority ranking is explicit and immutable
* Sequence numbers are monotonically increasing
* Displacement rules are transparent and auditable

No randomness. No hidden magic.

### 2. Transactional Integrity

All allocations occur inside **Prisma transactions**:

* Capacity checks
* Displacement
* Token creation
* Audit logging

Either the entire operation succeeds, or nothing changes.

### 3. Explainability Over Convenience

Every non‑trivial action produces an **AuditLog** entry. This is intentional:

* Hospitals require post‑fact reasoning
* Queue decisions must be defensible
* Simulation must be inspectable

### 4. Verification via Simulation

Instead of relying on unit tests alone, the system includes a **full‑day OPD simulation** that:

* Creates doctors, slots, and patients
* Applies realistic allocation sequences
* Forces emergency displacement
* Exercises cancellation and no‑show flows

This validates **system invariants**, not just code paths.

---
### Technology Stack
| Layer             | Technology           | Reason                                                       |
| ----------------- | -------------------- | ------------------------------------------------------------ |
| **Language**      | TypeScript           | Compile-time safety, clarity, and self-documenting APIs      |
| **API**           | Express              | Predictable, minimal, and battle-tested — boring is good     |
| **Database**      | PostgreSQL           | Strong transactions, row-level locks, and concurrency safety |
| **ORM**           | Prisma               | Type-safe queries and explicit transactional workflows       |
| **Validation**    | Zod                  | Runtime validation aligned with TypeScript types             |
| **Time Handling** | UTC only             | Eliminates timezone-related bugs                             |
| **Logging**       | Structured JSON logs | Auditable, searchable, and production-ready                  |

---
## Architecture Overview

```
Client / Script
      │
      ▼
Express Router
      │
      ▼
Controller Layer
      │
      ▼
Service Layer
(Transactional Rules)
      │
      ▼
Prisma ORM
      │
      ▼
PostgreSQL
```


### Why This Structure?

* Clear separation between HTTP, domain logic, and persistence
* Business rules live in services, not controllers
* Database enforces correctness alongside code

---

## FOLDER STRUCTURE

      opd-token-engine/
      │
      ├── src/
      │   ├── config/
      │   │   ├── env.ts
      │   │   └── database.ts
      │   │
      │   ├── domain/
      │   │   ├── enums/
      │   │   │   ├── TokenPriority.ts
      │   │   │   ├── TokenStatus.ts
      │   │   │   └── SlotStatus.ts
      │   │   │
      │   │   ├── entities/
      │   │   │   ├── Doctor.ts
      │   │   │   ├── Slot.ts
      │   │   │   ├── Token.ts
      │   │   │   └── Patient.ts
      │   │   │
      │   │   └── rules/
      │   │       └── TokenAllocationRule.ts
      │   │
      │   ├── repositories/
      │   │   ├── DoctorRepository.ts
      │   │   ├── SlotRepository.ts
      │   │   └── TokenRepository.ts
      │   │
      │   ├── services/
      │   │   ├── TokenAllocationService.ts
      │   │   ├── ReallocationService.ts
      │   │   └── SimulationService.ts
      │   │
      │   ├── controllers/
      │   │   ├── DoctorController.ts
      │   │   ├── SlotController.ts
      │   │   └── TokenController.ts
      │   │
      │   ├── routes/
      │   │   └── index.ts
      │   │
      │   ├── utils/
      │   │   ├── time.ts
      │   │   └── logger.ts
      │   │   └── 
      
      │   ├── app.ts
      │   └── server.ts
      │
      ├── prisma/
      │   ├── schema.prisma
      │   └── migrations/
      │
      ├── .env.example
      ├── package.json
      └── README.md


---

## Domain Model (Key Concepts)

### TokenPriority

* EMERGENCY
* PAID
* FOLLOW_UP

### TokenSource

* WALK_IN
* ONLINE
* STAFF
* APP

### TokenStatus

* ACTIVE
* DISPLACED
* CANCELLED
* NO_SHOW
* COMPLETED

### SlotStatus

* SCHEDULED
* DELAYED
* CANCELLED
* COMPLETED

Each enum exists to **remove ambiguity** from decision‑making.

---

## Allocation Rules (Non‑Negotiable)

1. A slot cannot exceed its capacity
2. Higher priority tokens may displace lower ones
3. Emergency tokens always preempt
4. Displaced tokens are never deleted — only reclassified
5. Sequence numbers preserve arrival order within priority

These rules are enforced **inside a single transaction**.

---

## ALGORITHM

      BEGIN TRANSACTION
      
      LOCK slot row
      
      activeTokens = fetch ACTIVE tokens for slot
      if EMERGENCY:
          if activeTokens.count >= capacity:
              lowest = find lowest priority token
              DISPLACE lowest
          INSERT emergency token
      else:
          if activeTokens.count < capacity:
              INSERT token
          else:
              lowest = find lowest priority token
              if new.priority > lowest.priority:
                  DISPLACE lowest
                  INSERT token
              else:
                  REJECT allocation
      
      LOG all actions
      
      COMMIT

---
## Simulation Flow (Verified Behavior)

### Step 1: Doctor Creation

Multiple doctors with independent queues

### Step 2: Slot Generation

Fixed‑time slots with strict capacity

### Step 3: Patient Intake

Unique patients enforced by phone number

### Step 4: Initial Allocation

Follow‑up and paid tokens fill the slot

### Step 5: Emergency Injection

* Slot is already full
* Lowest priority token is displaced
* Audit log records the decision

### Step 6: Cancellation & No‑Show

Active tokens are updated without breaking queue integrity

### Step 7: Final Queue Inspection

Only ACTIVE tokens remain, ordered by:

1. Priority (descending)
2. Sequence number (ascending)

---

## How to Verify Everything (Step‑by‑Step)

### 1. Start Infrastructure

```bash
docker compose up -d
```

### 2. Apply Schema

```bash
npx prisma migrate dev
```

### 3. Run Server

```bash
npm run dev
```

### 4. Run Simulation

```powershell
Invoke-RestMethod \
  -Method POST \
  -Uri "http://localhost:3000/simulate/opd-day" \
  -ContentType "application/json" \
  -Body "{}"
```

### 5. Inspect Results

Open Prisma Studio:

```bash
npx prisma studio
```

Verify:

* Token displacement
* Audit logs
* Final queue ordering

---

## Intentional Non‑Goals

This project **intentionally does not include**:

* UI / frontend
* Authentication
* Notification systems
* Real‑time scheduling optimizations

Those belong downstream.

This repository focuses on **correct core behavior** — the hardest part to get right.

---

## Engineering Takeaways

* Determinism beats cleverness
* Transactions are business rules, not just DB features
* Simulation is a first‑class validation tool
* Explainability is a feature, not overhead

---

## Final Note
This is not a toy project.
It is a **correctness-first engine**, built to model real hospital workflows, enforce strict domain rules, and behave predictably under real-world constraints.
