import type { Result } from 'benchmarkify';

export type Bundle = readonly (readonly [
  'main' | 'module' | 'browser' | 'unpkg',
  {
    readonly size: number;
    readonly gzipSize: number;
  },
])[];

export type CacheItem = {
  readonly size: Bundle;
  readonly speed: readonly Result[];
};
