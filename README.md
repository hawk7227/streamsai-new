# Agent Workforce front (owner mockup "Agent Workforce", 2026-10-01)

- `src/Workforce.jsx` — `AgentWorkforceFront` (header, nav, 10 agent cards, instructions, quick actions,
  recent jobs, specialties, system status) + `WorkspacePanel` (slide-out workspace from image 1; opens from a card,
  closes on X / Escape / backdrop, focus moves to Close).
- `src/data.js` — render fixture copied from the mockup. Replace with the `/api/v1/workforce` adapter; the screen
  reads only these shapes (AGENTS, JOBS, SYSTEM, OWNER).
- `src/assets/agents/agent-01..10.webp` — art cut from the owner mockup (label-free band of each card).
  `mh-crest.webp`, `builder-portrait.webp` — header art from the same mockup.
- Not yet integrated into PR #115 (`src/components/streams-ai/clean-chat/src/react/AgentWorkforceFront.jsx`):
  that source is not available in this sandbox.
- Build: `./build.sh` (esbuild). Audit: `python3 audit.py` (overflow, truncation, edge clipping, placeholders,
  touch targets, images, axe, workspace focus + Escape).
