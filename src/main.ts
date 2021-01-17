import { debug, endGroup, getInput, setFailed, startGroup } from '@actions/core';
import { context } from '@actions/github';

import { getBuildResults } from './build';
import { postComment } from './octokit';
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

  // startGroup('build');
  // const buildComparisonRows = await getBuildResults({ prDirectory, baseDirectory });
  // endGroup();

  debug(
    JSON.stringify(
      await runSpeedtest({
        prDirectory,
        baseDirectory,
      }),
      null,
      2,
    ),
  );

  // await postComment({ buildComparisonRows, prNumber });
}

run().catch((err) => {
  console.error(err);
  setFailed(err);
});
