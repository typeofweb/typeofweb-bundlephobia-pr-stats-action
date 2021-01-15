import { promises as fsp } from 'fs';

import * as Core from '@actions/core';
import { getPackageStats } from 'package-build-stats';
const { readFile } = fsp;

import { readCache } from './octokit';
import { execAsync } from './utils';

export async function build() {
  const prCommit = process.env.GITHUB_HEAD_REF!;
  const baseCommit = process.env.GITHUB_BASE_REF!;

  const prOutput = (await readCache({ commit: prCommit })) ?? (await buildPr());
  Core.startGroup('prOutput');
  Core.debug(JSON.stringify(prOutput, null, 2));
  Core.endGroup();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const file = JSON.stringify(await readFile('./package.json', 'utf-8'));
  const baseOutput = await getPackageStats(file.name);
  Core.startGroup('baseOutput');
  Core.debug(JSON.stringify(baseOutput, null, 2));
  Core.endGroup();

  return { prOutput, baseOutput, prCommit, baseCommit };
}

async function buildPr() {
  Core.debug(`Building bundle…`);
  await execAsync(`yarn`);
  await execAsync(`NODE_ENV=production yarn build`);
  return getPackageStats('.');
}
