import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ConfigStore, DEFAULT_PET_CONFIG } from './config-store';

describe('ConfigStore', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-friend-config-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create config.json in the Electron userData directory on first launch', () => {
    const store = new ConfigStore({ getPath: () => tempDir }, DEFAULT_PET_CONFIG);

    expect(fs.existsSync(path.join(tempDir, 'config.json'))).toBe(true);
    expect(store.get('walk.speedPxPerSecond', 0)).toBe(80);
    expect(store.get('scheduler.weights.idle', 0)).toBe(60);
  });

  it('should persist set values and reload them in a new store instance', () => {
    const store = new ConfigStore({ getPath: () => tempDir }, DEFAULT_PET_CONFIG);
    store.set('walk.speedPxPerSecond', 120);

    const reloaded = new ConfigStore({ getPath: () => tempDir }, DEFAULT_PET_CONFIG);

    expect(reloaded.get('walk.speedPxPerSecond', 0)).toBe(120);
  });

  it('should notify subscribers when a key changes', () => {
    const store = new ConfigStore({ getPath: () => tempDir }, DEFAULT_PET_CONFIG);
    const listener = vi.fn();
    const unsubscribe = store.onChange('scheduler.interactionPauseMs', listener);

    store.set('scheduler.interactionPauseMs', 4500);
    unsubscribe();
    store.set('scheduler.interactionPauseMs', 5000);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(4500);
  });
});
