import prettyBytes from 'pretty-bytes';

import type { Bundle } from './types';
import { uniq } from './utils';

export const HEADER = '<!-- typeofweb/typeofweb-bundlephobia-pr-stats-action header -->';

export function formatSizeChange(is?: number, was?: number) {
  if (!is || !was) {
    return '';
  }

  return formatDiff(is - was, (is - was) / was);
}

export function formatSizes(
  {
    size,
    gzipSize,
  }: {
    readonly size: number;
    readonly gzipSize: number;
  },
  previous?: {
    readonly size?: number;
    readonly gzipSize?: number;
  },
): string {
  const sizeStr = `<tr><td>uncompressed</td> <td>${prettyBytes(size)} ${formatSizeChange(
    size,
    previous?.size,
  )}</td></tr>`;
  const gzipStr = `<tr><td>gzipped</td> <td>${prettyBytes(gzipSize)} ${formatSizeChange(
    gzipSize,
    previous?.gzipSize,
  )}</td></tr>`;
  return `<table>${sizeStr} ${gzipStr}</table>`;
}

export function addPercent(change: number, goodEmoji = '▼', badEmoji = ':small_red_triangle:') {
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

  return ` ▶️ ${prettyBytes(absoluteChange, {
    signed: true,
  })} (${addPercent(relativeChange)})`;
}

export function sizesComparisonToMarkdownRows({
  prOutput,
  baseOutput,
}: {
  readonly prOutput: Bundle;
  readonly baseOutput: Bundle;
}) {
  const bundles = uniq([...prOutput.map(([key]) => key), ...baseOutput.map(([key]) => key)])
    .slice()
    .sort();

  const prOutputByBundle = Object.fromEntries(prOutput);
  const baseOutputByBundle = Object.fromEntries(baseOutput);

  return bundles.map(
    (bundle) =>
      [
        bundle,
        prOutputByBundle[bundle]
          ? formatSizes(prOutputByBundle[bundle]!, baseOutputByBundle[bundle])
          : '-',
      ] as const,
  );
}
