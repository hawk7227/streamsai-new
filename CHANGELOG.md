# StreamsAI v3 Update — New Video Tools + Missing Features

## NEW TOOL TYPES (4 added, total 8)
- **image_to_video**: Kling 2.5 Turbo Pro via fal.ai — reference image → cinematic video
- **video_to_video**: Kling O1 via fal.ai — reference video → transform/restyle
- **avatar**: Kling Avatar v2 Pro via fal.ai — photo + audio → talking head video
- **edit**: Shotstack — post-production overlays, text, branding on any video

## FEATURES COMPLETED

### ✅ Copilot as Overlay (was separate /copilot page)
- 360px slide-in panel from right, triggered by 🤖 button in sidebar
- Chat interface with real API dispatch (not random simulation)
- Suggestion chips for common tasks
- Tool calls: generate, check_credits, pipeline, automations

### ✅ 4-Step Flow Bar (was missing)
- Configure → Preview → Compare → Finalize stepper on Generate page
- Visual progress with icons, done states, clickable navigation

### ✅ Tool-Specific Preview Renderers (was generic "Preview ready")
- Voice: 30 animated waveform bars + audio player
- Video/I2V/V2V/Avatar/Edit: play button + timeline scrubber + duration
- Image: blur on preview → sharp on final
- Script: numbered line placeholders with syntax highlights

### ✅ Automatic Mode Page (was nothing)
- /automations route with 4 pre-built automations
- Toggle on/off per automation
- Weekly Social Batch (cron), Shopify webhook, Auto-Finalize 85%+, Credit Guard
- Create new automation form (name, trigger type, cron, tool, tier, prompt)
- Recent Auto Runs table with status/cost

### ✅ Real-Time Credit Meter (was hardcoded)
- Supabase Realtime subscription on workspace_limits
- 15s polling fallback via /api/workspace/credits
- Live credit bar in left sidebar with percentage, low balance warning

### ✅ Pipeline {{variable}} Templates (was partial)
- Custom variables: {{topic}}, {{channel}}, {{tone}} with input fields
- Variable type support: text, number, select (dropdown)
- Add/remove variables dynamically
- Auto-replacement in prompt templates during execution
- {{prev_output}} for chaining step results

### ✅ Pipeline Execution API (was setTimeout animation)
- POST /api/pipelines/[id]/execute — real sequential step execution
- Creates pipeline_run + pipeline_step_results records
- Calls /api/generations for each step
- Variable substitution in prompts
- Error handling per step with status tracking

### ✅ Copilot Tool Execution (was simulated)
- Intent detection: generate, credits, pipeline, automations
- Real Supabase queries for credit checks
- Tool dispatch to actual API endpoints
- Context-aware responses

## FILES CHANGED/ADDED (23 files)

### New Components
- src/components/copilot/CopilotOverlay.tsx (139 lines)
- src/components/generate/StepFlowBar.tsx (55 lines)
- src/components/generate/PreviewRenderers.tsx (119 lines)

### Updated Components
- src/components/layout/Sidebar.tsx — Split sidebar (82px left nav + 76px right tools)
- src/components/layout/AppShell.tsx — Wrapper with copilot overlay integration

### New Pages
- src/app/automations/page.tsx (186 lines)
- src/app/automations/layout.tsx

### Updated Pages
- src/app/generate/page.tsx — 8 tools, StepFlowBar, PreviewRenderers
- src/app/pipelines/[id]/page.tsx — 9 step types, variable templates, config panel

### New API Routes
- src/app/api/pipelines/[id]/execute/route.ts — Pipeline execution engine
- src/app/api/workspace/credits/route.ts — Credit balance endpoint
- src/app/api/automations/route.ts — Automation CRUD

### Updated API Routes
- src/app/api/automations/[id]/route.ts — PATCH/DELETE individual automation
- src/app/api/automations/runs/route.ts — List automation run history
- src/app/api/copilot/route.ts — Real tool dispatch

### New Provider Adapters
- src/lib/providers/image-to-video/kling-i2v.ts
- src/lib/providers/video-to-video/kling-v2v.ts
- src/lib/providers/avatar/kling-avatar.ts
- src/lib/providers/edit/shotstack-edit.ts

### Updated Core
- src/lib/types/index.ts — 8 tool types, automation types, pipeline variables
- src/lib/providers/registry.ts — 16 providers (was 12)
- src/lib/hooks/useWorkspace.ts — Realtime credit subscription

### Database
- supabase/migrations/004_new_tools_automations.sql — New tables + columns + seed data

## ENV VARS NEEDED
- ANTHROPIC_API_KEY — Anthropic API key (for Copilot AI via Claude Sonnet)
- FAL_KEY — fal.ai API key (for Kling I2V, V2V, Avatar)
- SHOTSTACK_API_KEY — Shotstack API key (for edit/overlay)
