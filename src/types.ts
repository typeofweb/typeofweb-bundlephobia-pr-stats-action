export type Bundle = readonly (readonly [
  'main' | 'module' | 'browser' | 'unpkg',
  {
    readonly size: number;
    readonly gzipSize: number;
  },
])[];
