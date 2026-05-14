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

## Verification

- `npm run typecheck` passes.
- `npm test` passes with 80 tests across 16 test files.
- `npm run build` passes.
- `npm run lint` is currently blocked because the project has ESLint 9 installed but no `eslint.config.*` flat config.
