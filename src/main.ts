import { endGroup, getInput, setFailed, startGroup } from '@actions/core';
import { context } from '@actions/github';

import { build } from './build';
import { postComment, saveCache } from './octokit';
import { sizesComparisonToMarkdownRows } from './size-formatter';
import { runSpeedtest } from './speed';

async function run() {
  const prNumber =
    context.payload.pull_request?.number ??
    (context.payload.issue?.html_url?.includes('/pull/') ? context.issue.number : undefined);

  if (!prNumber) {
    return setFailed('Not a PR!');
  }

  const prDirectory = getInput('pr_directory_name');
  const baseDirectory = getInput('base_directory_name');

  startGroup('build');
  const { prOutput, baseOutput, prCommit, baseCommit } = await build(prDirectory, baseDirectory);
  const buildComparisonRows = sizesComparisonToMarkdownRows({ prOutput, baseOutput });
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

  await postComment({ buildComparisonRows, prNumber });
}

run().catch((err) => {
  console.error(err);
  setFailed(err);
});
