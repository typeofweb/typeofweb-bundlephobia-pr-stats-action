import { promises as fsp } from 'fs';

import { create } from '@actions/artifact';
import { endGroup, getInput, setFailed, startGroup } from '@actions/core';
const { writeFile, readFile } = fsp;

import { build } from './build';
import { postComment, readCache, saveCache } from './octokit';
import { sizesComparisonToMarkdownRows, speedComparisonToMarkdownRows } from './size-formatter';
import { runSpeedtest } from './speed';
import type { CacheItem } from './types';
import { execAsync } from './utils';

// eslint-disable-next-line require-await
async function run() {
  const prDirectory = getInput('pr_directory_name');
  const baseDirectory = getInput('base_directory_name');
  const prNumber = getInput('pr_number');

  if (!prNumber && !(prDirectory && baseDirectory)) {
    return setFailed('Either `prNumber` or `prDirectory` and `baseDirectory` must be provided.');
  }

  if (prNumber) {
    return workflowRun(Number(prNumber));
  } else {
    return prRun({ prDirectory, baseDirectory });
  }
}

run().catch((err) => {
  console.error(err);
  setFailed(err);
});

async function workflowRun(prNumber: number) {
  const artifactClient = create();
  await artifactClient.downloadArtifact('bundle-size-speed-results', './results.json');
  const json = await readFile('./results.json', 'utf-8');
  const results = JSON.parse(json) as {
    readonly prCache: CacheItem;
    readonly baseCache: CacheItem;
  };

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

async function prRun({
  prDirectory,
  baseDirectory,
}: {
  readonly prDirectory: string;
  readonly baseDirectory: string;
}) {
  const results = await getResults({ prDirectory, baseDirectory });
  const json = JSON.stringify(results);

  const artifactClient = create();
  await writeFile('./results.json', json, 'utf-8');
  await artifactClient.uploadArtifact('bundle-size-speed-results', ['results.json'], './');
}

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
