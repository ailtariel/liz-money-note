# Historical Plan Reconciliation

## Goal

Remove ambiguity from historical implementation plans whose unchecked task lists no longer represent the current project backlog.

## Scope

- Audit every Markdown file under `docs/implementation logs` for unchecked tasks and final-status markers.
- Archive obsolete plans without rewriting historical checklists as if every original requirement had been implemented.
- Keep the current roadmap, device verification, and product decision gates active.
- Update the current to-do and roadmap status.

## Findings and Decisions

- `basic-implementation-plan.md` describes the initial MVP. Its introduction records that the MVP was implemented, while 52 original task boxes remain unchecked. Several original requirements were intentionally superseded, including raw `.db` export in favor of JSON data transfer, so bulk-checking the list would be inaccurate.
- `2026-06-07 global-ui-style-refactor-plan.md` records a completed first slice and later continuation notes but never converted its original 11-item plan into final tracking. Current style design documents and the 2026-08-01 roadmap now own future work.
- Add explicit archive notices and final statuses to both documents. Preserve their original checkboxes as historical intent.
- Do not archive `2026-08-01 project-iteration-roadmap.md`; its unchecked items are the active backlog and include legitimate product/device gates.

## Task Checklist

- [x] Add archive status to the initial MVP plan.
- [x] Add archive status to the global UI refactor plan.
- [x] Re-run the status audit and confirm only the active roadmap remains in progress.
- [x] Update roadmap and to-do status.

## Verification Plan

- Recount checked and unchecked boxes for every implementation log.
- Confirm every non-active document has a final status or an explicit archive marker.
- Run `git diff --check`.

## Final Status

Complete. All historical implementation logs now either have no unchecked tasks, explicitly preserve an archived checklist, or are the current roadmap. The partially completed Android launcher log remains explicit because device verification is still pending.
