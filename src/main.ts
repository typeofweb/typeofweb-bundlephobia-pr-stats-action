import { debug, endGroup, getInput, setFailed, startGroup } from '@actions/core';
import { context } from '@actions/github';

import { build } from './build';
import { findExistingComment, getOctokit, saveCache } from './octokit';

async function run() {
  debug(
    JSON.stringify(
      {
        ...context,
        issue: context.issue,
        repo: context.repo,
      },
      null,
      2,
    ),
  );

  startGroup('build');

  const prDirectory = getInput('pr_directory_name');
  const baseDirectory = getInput('base_directory_name');

  const { prOutput, baseOutput, prCommit, baseCommit } = await build(prDirectory, baseDirectory);

  await saveCache({
    content: prOutput,
    commit: prCommit,
  });
  await saveCache({
    content: baseOutput,
    commit: baseCommit,
  });
  endGroup();

  startGroup('calculateSizes');
  // const [prResult, baseResult] = await Promise.all([
  //   getNextPagesSize(prOutput),
  //   getNextPagesSize(baseOutput),
  // ]);
  endGroup();

  startGroup('postComment');
  // const comparison = generateComparison({
  //   currentResult: prResult,
  //   previousResult: baseResult,
  // });

  // const markdown = getComparisonMarkdown({
  //   ...comparison,
  //   commitRange: `${baseCommit}...${prCommit}`,
  // });
  // debug(markdown);

  const prNumber =
    context.payload.pull_request?.number ??
    (context.payload.issue?.html_url?.includes('/pull/') ? context.issue.number : undefined);

  if (!prNumber) {
    return setFailed('Not a PR!');
  }

  const octokit = getOctokit();

  if (!octokit) {
    return setFailed('Missing GITHUB_TOKEN!');
  }

  const existingComment = await findExistingComment(octokit, context, prNumber);
  debug(JSON.stringify({ existingComment }));

  if (existingComment) {
    await octokit.issues.updateComment({
      ...context.repo,
      comment_id: existingComment.id,
      body: 'siema 2',
    });
  } else {
    await octokit.issues.createComment({
      ...context.repo,
      issue_number: prNumber,
      body: 'siema',
    });
  }

  endGroup();
}

run().catch((err) => {
  console.error(err);
  setFailed(err);
});
