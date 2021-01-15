import { promises as fsp } from 'fs';

import * as Core from '@actions/core';
import { getPackageStats } from 'package-build-stats';
const { readFile } = fsp;

import { readCache } from './octokit';
import { execAsync } from './utils';

export async function build(path: string) {
  const prCommit = process.env.GITHUB_HEAD_REF!;
  const baseCommit = process.env.GITHUB_BASE_REF!;

  const prOutput = (await readCache({ commit: prCommit })) ?? (await buildPr(path));
  Core.startGroup('prOutput');
  Core.debug(JSON.stringify(prOutput, null, 2));
  Core.endGroup();

  const file = JSON.parse(await readFile(path + '/package.json', 'utf-8')) as {
    readonly name: string;
  };
  Core.debug(JSON.stringify(file));
  const baseOutput = await getPackageStats(file.name);
  Core.startGroup('baseOutput');
  Core.debug(JSON.stringify(baseOutput, null, 2));
  Core.endGroup();

  return { prOutput, baseOutput, prCommit, baseCommit };
}

async function buildPr(path: string) {
  Core.debug(`Building bundle…`);
  await execAsync(`cd ${path} && yarn`);
  await execAsync(`cd ${path} && NODE_ENV=production yarn build`);
  return getPackageStats('.');
}
