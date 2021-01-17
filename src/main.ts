import { debug, endGroup, getInput, setFailed, startGroup } from '@actions/core';
import { context } from '@actions/github';

import { build } from './build';
import { postComment, readCache, saveCache } from './octokit';
import { sizesComparisonToMarkdownRows, speedComparisonToMarkdownRows } from './size-formatter';
import { runSpeedtest } from './speed';
import { execAsync } from './utils';

async function run() {
  const prNumber =
    context.payload.pull_request?.number ??
    (context.payload.issue?.html_url?.includes('/pull/') ? context.issue.number : undefined);

  if (!prNumber) {
    return setFailed('Not a PR!');
  }

  const prDirectory = getInput('pr_directory_name');
  const baseDirectory = getInput('base_directory_name');
  debug(`__dirname: ${__dirname}`);
  debug(`process.cwd(): ${process.cwd()}`);
  debug(`pwd: ${await execAsync(`pwd`)}`);

  const results = await getResults({ prDirectory, baseDirectory });

  const buildComparisonRows = sizesComparisonToMarkdownRows({
    prOutput: results.prCache.size,
    baseOutput: results.baseCache.size,
  });

  const speedComparisonRows = speedComparisonToMarkdownRows({
    prOutput: results.prCache.speed,
    baseOutput: results.baseCache.speed,
  });

  await postComment({ buildComparisonRows, speedComparisonRows, prNumber });
}

run().catch((err) => {
  console.error(err);
  setFailed(err);
});

async function getResults({
  prDirectory,
  baseDirectory,
}: {
  readonly prDirectory: string;
  readonly baseDirectory: string;
}) {
  const prCommit = await execAsync(`cd ${prDirectory} && git rev-parse HEAD:`);
  const baseCommit = await execAsync(`cd ${baseDirectory} && git rev-parse HEAD:`);

  const maybePrCacheResults = await readCache({ commit: prCommit });
  const maybeBaseCacheResults = await readCache({ commit: baseCommit });

  if (
    maybePrCacheResults?.size &&
    maybePrCacheResults?.speed &&
    maybeBaseCacheResults?.size &&
    maybeBaseCacheResults?.speed
  ) {
    return { prCache: maybePrCacheResults, baseCache: maybeBaseCacheResults };
  }

  startGroup('build');
  const { prOutput, baseOutput } = await build({ prDirectory, baseDirectory });
  endGroup();

  const { prSpeed, baseSpeed } = await runSpeedtest({
    prDirectory,
    baseDirectory,
  });

  const bundleSizeResults = { prOutput, baseOutput };
  const bundleSpeedResults = { prSpeed, baseSpeed };

  const prCache = {
    size: bundleSizeResults.prOutput,
    speed: bundleSpeedResults.prSpeed,
  };
  const baseCache = {
    size: bundleSizeResults.baseOutput,
    speed: bundleSpeedResults.baseSpeed,
  };

  await saveCache({
    content: prCache,
    commit: prCommit,
  });
  await saveCache({
    content: baseCache,
    commit: baseCommit,
  });

  return { prCache, baseCache };
}
