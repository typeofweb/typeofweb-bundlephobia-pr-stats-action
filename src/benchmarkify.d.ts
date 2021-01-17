declare module 'benchmarkify' {
  interface Options {
    readonly name?: string;
    readonly time?: number;
    readonly minSamples?: number;
  }
  // eslint-disable-next-line
  export default class Benchmarkify {
    constructor(
      title: string,
      options?: {
        readonly logger?: typeof console.log;
        readonly spinner?: boolean;
      },
    );
    printHeader(): this;

    createSuite(name: string, options?: Options): Suite;
  }

  class Suite {
    add(name: string, fn: () => void, opts?: Options): void;
    skip(name: string, fn: () => void, opts?: Options): void;
    only(name: string, fn: () => void, opts?: Options): void;
    ref(name: string, fn: () => void, opts?: Options): void;

    run(): Promise<readonly Result[]>;
  }

  interface Result {
    readonly name: string;
    readonly fastest?: boolean;
    readonly reference?: boolean;
    readonly stat: {
      readonly duration: number;
      readonly cycle: number;
      readonly count: number;
      readonly avg: number;
      readonly rps: number;
      readonly percent: number;
    };
  }
}
