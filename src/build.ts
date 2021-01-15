import * as Core from '@actions/core';
import { getPackageStats } from 'package-build-stats';

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
  const baseOutput = await getPackageStats(require('./package.json').name);
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
