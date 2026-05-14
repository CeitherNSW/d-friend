import fs from 'fs';
import path from 'path';
import {
  ConfigReader,
  ConfigValue,
  DEFAULT_PET_CONFIG,
  getConfigValue,
  PetConfig,
} from '../core/config';

export { DEFAULT_PET_CONFIG };

export interface UserDataPathProvider {
  getPath(name: 'userData'): string;
}

type ChangeHandler<T extends ConfigValue> = (value: T) => void;

export class ConfigStore implements ConfigReader {
  private filePath: string;
  private data: Record<string, unknown>;
  private listeners = new Map<string, Set<ChangeHandler<ConfigValue>>>();

  constructor(app: UserDataPathProvider, defaults: PetConfig = DEFAULT_PET_CONFIG) {
    const userDataPath = app.getPath('userData');
    fs.mkdirSync(userDataPath, { recursive: true });
    this.filePath = path.join(userDataPath, 'config.json');
    this.data = this.load(defaults);
    this.save();
  }

  get<T extends ConfigValue>(key: string, defaultValue: T): T {
    return getConfigValue(this.data, key, defaultValue);
  }

  getAll(): Record<string, unknown> {
    return structuredClone(this.data);
  }

  set<T extends ConfigValue>(key: string, value: T): void {
    const parts = key.split('.');
    let target = this.data;
    for (const part of parts.slice(0, -1)) {
      if (!target[part] || typeof target[part] !== 'object' || Array.isArray(target[part])) {
        target[part] = {};
      }
      target = target[part] as Record<string, unknown>;
    }
    target[parts[parts.length - 1]] = value;
    this.save();
    this.listeners.get(key)?.forEach((handler) => handler(value));
  }

  onChange<T extends ConfigValue>(key: string, callback: ChangeHandler<T>): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const handlers = this.listeners.get(key)!;
    const wrapped = callback as ChangeHandler<ConfigValue>;
    handlers.add(wrapped);
    return () => {
      handlers.delete(wrapped);
    };
  }

  private load(defaults: PetConfig): Record<string, unknown> {
    if (!fs.existsSync(this.filePath)) {
      return structuredClone(defaults) as Record<string, unknown>;
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as Record<string, unknown>;
      return mergeDeep(structuredClone(defaults) as Record<string, unknown>, parsed);
    } catch {
      return structuredClone(defaults) as Record<string, unknown>;
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, `${JSON.stringify(this.data, null, 2)}\n`, 'utf-8');
  }
}

function mergeDeep(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  for (const [key, value] of Object.entries(override)) {
    const baseValue = base[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue)
    ) {
      base[key] = mergeDeep(baseValue as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      base[key] = value;
    }
  }
  return base;
}
