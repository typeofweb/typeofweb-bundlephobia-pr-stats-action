import { endGroup, getInput, setFailed, startGroup } from '@actions/core';
import { context } from '@actions/github';

import { getBuildResults } from './build';
import { postComment } from './octokit';

async function run() {
  const prNumber =
    context.payload.pull_request?.number ??
    (context.payload.issue?.html_url?.includes('/pull/') ? context.issue.number : undefined);

  if (!prNumber) {
    return setFailed('Not a PR!');
  }

  startGroup('build');
  const prDirectory = getInput('pr_directory_name');
  const baseDirectory = getInput('base_directory_name');

  const buildComparisonRows = await getBuildResults({ prDirectory, baseDirectory });
  endGroup();

  await postComment({ buildComparisonRows, prNumber });
}

run().catch((err) => {
  console.error(err);
  setFailed(err);
});
