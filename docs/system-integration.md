# System Integration

This document records the current Electron platform integration behavior.

## Tray Lifecycle

- The main process creates a hidden fullscreen transparent pet window on app ready.
- A system tray icon is created from an embedded 32x32 PNG buffer.
- The tray menu exposes `Show Pet`, `Hide Pet`, and `Quit`.
- Closing the pet window hides it to the tray instead of quitting the process.
- Double-clicking the tray icon toggles pet visibility.
- Choosing `Quit` marks the app as quitting, destroys the tray, and calls `app.quit()`.
- The `window-all-closed` event intentionally keeps the app alive so the tray remains the lifecycle owner.

## Implementation

- `src/platform/main.ts` wires Electron `app`, `BrowserWindow`, `Menu`, `nativeImage`, and `Tray`.
- `src/platform/tray-controller.ts` owns tray creation, window binding, visibility toggles, and quit cleanup.
- `src/platform/tray-controller.test.ts` covers tray menu creation, close-to-tray, double-click toggling, and quit cleanup.
- `src/platform/pet-context-menu-ipc.ts` owns the right-click pet menu IPC and builds the Electron menu with `Exit`, `Hide 30min`, and `Settings`.
- `src/platform/config-store.ts` persists `config.json` under Electron `app.getPath('userData')`.
- `src/platform/config-ipc.ts` exposes config read/write handlers to the preload bridge.
- `src/platform/preload.ts` exposes `setIgnoreMouseEvents`, `showPetContextMenu`, `getConfig`, and `setConfig` through `window.electronAPI`.

## Runtime Behavior

- `src/render/mouse-bridge.ts` emits `click`, `dblclick`, and `contextmenu` events in addition to drag events.
- Drag starts only after pointer movement crosses a small threshold, so a normal click does not enter drag/fall first.
- Single-click transitions into `PettingBehavior`, plays the `happy` clip, then returns to the previous behavior.
- Double-click cancels the pending single-click reaction and requests `JumpBehavior`.
- Right-click requests the Electron pet context menu at the cursor position.
- `BehaviorScheduler` is active in `PetRuntime`, uses default weights `Idle 60 / Walk 30 / Jump 10`, skips cooling-down behaviors, and pauses after click or drag interactions.
- Idle, walk, jump, and fall behavior parameters are read through the runtime config reader.

## Verification

- `npm run typecheck` passes.
- `npm test` passes with 98 tests across 19 test files.
- `npm run build` passes.
- `npm run lint` is currently blocked because the project has ESLint 9 installed but no `eslint.config.*` flat config.
