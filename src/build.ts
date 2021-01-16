/* eslint-disable @typescript-eslint/consistent-type-imports */
import { promises as fsp } from 'fs';
import { join } from 'path';
const { stat } = fsp;

import * as Core from '@actions/core';
import gzipSize from 'gzip-size';

import { readCache } from './octokit';
import { execAsync } from './utils';

export async function build(prDirectory: string, baseDirectory: string) {
  Core.debug(`__dirname: ${__dirname}`);
  Core.debug(`process.cwd(): ${process.cwd()}`);

  const prCommit = await execAsync(`cd ${prDirectory} && git rev-parse HEAD:`);
  const baseCommit = await execAsync(`cd ${baseDirectory} && git rev-parse HEAD:`);

  const prOutput =
    ((await readCache({ commit: prCommit })) as Bundle | undefined) ??
    (await buildBundle(prDirectory));
  Core.startGroup('prOutput');
  Core.debug(JSON.stringify(prOutput, null, 2));
  Core.endGroup();

  const baseOutput =
    ((await readCache({ commit: baseCommit })) as Bundle | undefined) ??
    (await buildBundle(baseDirectory));
  Core.startGroup('prOutput');
  Core.debug(JSON.stringify(baseOutput, null, 2));
  Core.endGroup();

  return { prOutput, baseOutput, prCommit, baseCommit };
}

type Bundle = ReturnType<typeof buildBundle> extends Promise<infer R> ? R : never;

async function buildBundle(basePath: string) {
  Core.debug(`Building Next.js for ${basePath}`);
  await execAsync(`cd ${basePath} && yarn`);
  await execAsync(`cd ${basePath} && NODE_ENV=production yarn build`);

  const { main, module, browser, unpkg } = require(join(basePath, 'package.json')) as {
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
          gzipSize: await gzipSize(filePath),
        },
      ] as const;
    }),
  );

  return bundleToSize.sort(([pathA], [pathB]) => pathA.localeCompare(pathB));
}
