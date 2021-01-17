/* eslint-disable @typescript-eslint/consistent-type-imports */
import { promises as fsp } from 'fs';
import { join } from 'path';
const { stat } = fsp;

import { debug, startGroup, endGroup } from '@actions/core';
import gzipSize from 'gzip-size';

import { Bundle } from './types';
import { execAsync } from './utils';

const { readFile } = fsp;

export async function build({
  prDirectory,
  baseDirectory,
}: {
  readonly prDirectory: string;
  readonly baseDirectory: string;
}) {
  const cwd = process.cwd();

  const prOutput = await buildBundle(join(cwd, prDirectory));
  startGroup('prOutput');
  debug(JSON.stringify(prOutput, null, 2));
  endGroup();

  const baseOutput = await buildBundle(join(cwd, baseDirectory));
  startGroup('prOutput');
  debug(JSON.stringify(baseOutput, null, 2));
  endGroup();

  return { prOutput, baseOutput };
}

async function buildBundle(basePath: string): Promise<Bundle> {
  debug(`Building Next.js for ${basePath}`);
  await execAsync(`cd ${basePath} && yarn`);
  await execAsync(`cd ${basePath} && NODE_ENV=production yarn build`);

  const { main, module, browser, unpkg } = JSON.parse(
    await readFile(join(basePath, 'package.json'), 'utf-8'),
  ) as {
    readonly main?: string;
    readonly module?: string;
    readonly browser?: string;
    readonly unpkg?: string;
  };
  const bundles = { main, module, browser, unpkg };

  const uniqueBundles = Object.entries({ main, module, browser, unpkg }).filter(
    ([_key, path], index, arr) =>
      path && arr.findIndex(([_key2, path2]) => path2 === path) === index,
  ) as readonly (readonly [keyof typeof bundles, string])[];

  const bundleToSize = await Promise.all(
    uniqueBundles.map(async ([bundle, path]) => {
      const filePath = join(basePath, path);
      return [
        bundle,
        {
          size: (await stat(filePath)).size,
          gzipSize: await gzipSize(await readFile(filePath)),
        },
      ] as const;
    }),
  );

  return bundleToSize.sort(([pathA], [pathB]) => pathA.localeCompare(pathB));
}
