export type ConfigPrimitive = string | number | boolean | null;
export type ConfigValue = ConfigPrimitive | ConfigValue[] | { [key: string]: ConfigValue };

export interface ConfigReader {
  get<T extends ConfigValue>(key: string, defaultValue: T): T;
}

export const DEFAULT_PET_CONFIG = {
  idle: {
    minDurationMs: 8000,
    maxDurationMs: 18000,
  },
  walk: {
    speedPxPerSecond: 80,
    minDurationMs: 2000,
    maxDurationMs: 6000,
  },
  jump: {
    velocityYPxPerSecond: -400,
    gravityPxPerSecondSquared: 800,
  },
  fall: {
    gravityPxPerSecondSquared: 800,
    bounceDamping: 0.4,
    bounceThresholdPxPerSecond: 50,
  },
  scheduler: {
    intervalMs: 5000,
    interactionPauseMs: 3000,
    weights: {
      idle: 60,
      walk: 30,
      jump: 10,
    },
    cooldowns: {
      jump: 20000,
    },
  },
  petting: {
    clickDelayMs: 220,
    durationMs: 900,
  },
} as const;

export type PetConfig = typeof DEFAULT_PET_CONFIG;

export function getConfigValue<T extends ConfigValue>(
  source: Record<string, unknown>,
  key: string,
  defaultValue: T,
): T {
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);

  return value === undefined ? defaultValue : value as T;
}

export function createObjectConfigReader(source: Record<string, unknown>): ConfigReader {
  return {
    get<T extends ConfigValue>(key: string, defaultValue: T): T {
      return getConfigValue(source, key, defaultValue);
    },
  };
}
