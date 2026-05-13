# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

d-friend is a desktop pet application built with Electron + TypeScript. A cartoon pet lives on the user's desktop, walking, jumping, idling, and responding to mouse interaction. The architecture uses a plugin-based behavior system for extensibility.

## Tech Stack

- **Runtime**: Electron (transparent, frameless, always-on-top window)
- **Language**: TypeScript (strict mode)
- **Bundler**: Vite
- **Testing**: Vitest
- **Animation**: Lottie (lottie-web) or SVG sprite sheets
- **Package Manager**: npm

## Build & Dev Commands

```bash
npm run dev        # Start Electron in development mode
npm run build      # Production build
npm run typecheck  # Run tsc --noEmit
npm run test       # Run all tests via Vitest
npm run test -- --run src/core/state-machine.test.ts  # Single test file
```

## Architecture

```
src/
  core/           # EventBus, BehaviorStateMachine, BehaviorRegistry, ConfigStore, AutoScheduler
  behaviors/      # One folder per behavior (idle/, walk/, jump/, drag/, fall/)
  render/         # AnimationPlayer, Lottie/SVG adapter
  platform/       # Electron main process, screen bounds, tray, window setup
assets/           # Animation files organized by behavior (idle/, walk/, etc.)
```

### Key Abstractions

- **Behavior interface**: Each behavior implements `id`, `priority`, `enter(ctx)`, `update(ctx, dt)`, `exit(ctx)`, `canTransitionTo(nextId)`. Registered into `BehaviorRegistry`.
- **BehaviorStateMachine**: Manages current behavior, handles transitions respecting priority. Higher priority behaviors can preempt lower ones.
- **EventBus**: Typed pub/sub for decoupled communication (`mouse:down`, `edge:hit`, `behavior:changed`, etc.).
- **AutoScheduler**: Drives autonomous behavior switching (idle → walk → jump) based on configurable weights and cooldowns. Pauses after user interaction.
- **Screen bounds module**: Provides ground Y (taskbar top), left/right/top edges. Updates on display changes.

### Window Strategy

The app uses a full-screen transparent window with mouse click-through (`setIgnoreMouseEvents(true, { forward: true })`). Click-through is toggled off only over the pet sprite's hit area.

## Conventions

- Behaviors are self-contained: logic + animation assets + tests live together in `src/behaviors/<name>/`
- Adding a new behavior = one new folder + one `register()` call in the behavior index
- All inter-module communication goes through EventBus, not direct imports between behaviors
- Config values are read via `ConfigStore`, never hardcoded magic numbers in behavior logic
- Keep runtime dependencies minimal (target ≤ 5 beyond Electron itself)

## PRD & Task Tracking

- Product requirements: `tasks/prd-desktop-pet-system.md`
- Ralph execution format: `prd.json` (machine-readable user stories)
- Progress log: `progress.txt`
