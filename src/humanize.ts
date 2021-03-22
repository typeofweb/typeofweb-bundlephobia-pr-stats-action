// @ts-nocheck
/* eslint-disable */
const units = {
  long: [
    'just now',
    'nanosecond',
    'microsecond',
    'millisecond',
    'second',
    'minute',
    'hour',
    'day',
    'week',
    'year',
  ],
  short: ['now', 'ns', 'μs', 'ms', 's', 'm', 'h', 'd', 'w', 'y'],
};

export function tinyHumanTime(t1: number | number[], t2: number | number[], u: keyof typeof units) {
  u =
    typeof arguments[arguments.length - 1] === 'string' ? arguments[arguments.length - 1] : 'long';
  t1 = Array.isArray(t1) ? t1[0]! * 1e3 + t1[1]! / 1e6 : t1;
  t2 = Array.isArray(t2) ? t2[0]! * 1e3 + t2[1]! / 1e6 : t2;
  let milli = Math.abs(isNaN(+t2) ? t1 : t2 - t1);

  if (milli === 0) return units[u][0];
  if (milli < 1e-3) return format(Math.floor(milli * 1e6), units[u][1], u);
  if (milli < 1) return format(Math.floor(milli * 1e3), units[u][2], u);
  if (milli < 1000) return format(Math.floor(milli), units[u][3], u);
  if ((milli /= 1000) < 60) return format(Math.floor(milli), units[u][4], u);
  if ((milli /= 60) < 60) return format(Math.floor(milli), units[u][5], u);
  if ((milli /= 60) < 24) return format(Math.floor(milli), units[u][6], u);
  if ((milli /= 24) < 7) return format(Math.floor(milli), units[u][7], u);
  if ((milli /= 7) < 52) return format(Math.floor(milli), units[u][8], u);
  return format(Math.floor(milli / 52), units[u][9], u);
}

export const short = function short(t1: number, t2?: number): string {
  return tinyHumanTime(t1, t2, 'short');
};

export function format(n: number, unit: string, mode: keyof typeof units) {
  return `${n + (mode === 'short' ? '' : ' ')}${unit}${mode === 'short' || n === 1 ? '' : 's'}`;
}
