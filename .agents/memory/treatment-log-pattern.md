---
name: Treatment log mark-done deduplication
description: How the calendar "Mark Done" feature matches a log entry to a calendar event for dedup.
---

The MarkDoneButton checks whether a `TreatmentLog` row already exists for a given calendar event using three fields:
- `planId` equality
- `stepTitle` equality
- `isSameDay(new Date(log.scheduledDate ?? log.completedAt), event.date)` — falls back to completedAt if scheduledDate is null

**Why:** String equality on ISO timestamps fails due to timezone and precision differences. Day-level granularity is correct for this domain.

**How to apply:** Any UI that needs to show "already done" state for a treatment event must use this same triple-match.
