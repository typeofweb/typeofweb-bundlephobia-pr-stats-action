import { exec } from 'child_process';

import PrettyBytes from 'pretty-bytes';

export const ZERO_WIDTH_SPACE = '&#xfeff;';

export function execAsync(args: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(args, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export function uniq<T>(arr: readonly T[]): readonly T[] {
  return [...new Set(arr)];
}

export function uniqKeys<R extends object, U extends object>(
  obj1: R,
  obj2: U,
): ReadonlyArray<keyof R | keyof U> {
  return uniq([
    ...((Object.keys(obj1) as unknown) as ReadonlyArray<keyof R>),
    ...((Object.keys(obj2) as unknown) as ReadonlyArray<keyof U>),
  ]);
}

export function addPercent(change: number, goodEmoji = '', badEmoji = ':small_red_triangle:') {
  const formatted = (change * 100).toFixed(2);
  if (/^-|^0(?:\.0+)$/.test(formatted)) {
    return `${formatted}%${goodEmoji ? ' ' + goodEmoji : ''}`;
  }
  return `+${formatted}%${badEmoji ? ' ' + badEmoji : ''}`;
}

export function formatDiff(absoluteChange: number, relativeChange: number) {
  if (absoluteChange === 0) {
    return '--';
  }

  const trendIcon = absoluteChange < 0 ? '▼' : '▲';

  return `${trendIcon} ${PrettyBytes(absoluteChange, {
    signed: true,
  })} (${addPercent(relativeChange, '')})`;
}

type TupleOf<
  T,
  Length extends number,
  Acc extends readonly unknown[] = readonly []
> = number extends Length
  ? readonly T[]
  : Acc['length'] extends Length
  ? Acc
  : TupleOf<T, Length, readonly [T, ...Acc]>;

export function generateMDTable<
  H extends readonly { readonly label: string; readonly align?: 'left' | 'center' | 'right' }[]
>(headers: readonly [...H], body: readonly TupleOf<string, H['length']>[]): string {
  const headerRow = headers.map((header) => header.label || ZERO_WIDTH_SPACE);
  const alignmentRow = headers.map((header) => {
    if (header.align === 'right') {
      return ' ---:';
    }
    if (header.align === 'center') {
      return ':---:';
    }
    return ' --- ';
  });

  const bodyRows = (body as readonly (readonly string[])[]).map((row) =>
    row.map((val) => val || ZERO_WIDTH_SPACE),
  );

  return [headerRow, alignmentRow, ...bodyRows].map((row) => row.join(' | ')).join('\n');
}
