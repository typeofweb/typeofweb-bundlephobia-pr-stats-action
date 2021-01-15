import * as Core from '@actions/core';
import { getPackageStats } from 'package-build-stats';

import { readCache } from './octokit';
import { execAsync } from './utils';

export async function build(path: string) {
  const prCommit = process.env.GITHUB_HEAD_REF!;
  const baseCommit = process.env.GITHUB_BASE_REF!;

  const prOutput = (await readCache({ commit: prCommit })) ?? (await buildPr());
  Core.startGroup('prOutput');
  Core.debug(JSON.stringify(prOutput, null, 2));
  Core.endGroup();

  const file = require(path) as { readonly name: string };
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
