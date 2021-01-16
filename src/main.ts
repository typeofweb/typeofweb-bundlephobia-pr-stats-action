import { debug, endGroup, getInput, setFailed, startGroup } from '@actions/core';
import { context } from '@actions/github';
import prettyBytes from 'pretty-bytes';

import { build } from './build';
import { findExistingComment, getOctokit, saveCache } from './octokit';
import { HEADER } from './size-formatter';
import { formatDiff, generateMDTable, uniq } from './utils';

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

  const bundles = uniq([...prOutput.map(([key]) => key), ...baseOutput.map(([key]) => key)])
    .slice()
    .sort();

  const prOutputByBundle = Object.fromEntries(prOutput);
  const baseOutputByBundle = Object.fromEntries(baseOutput);

  const rows = bundles.map(
    (bundle) =>
      [
        bundle,
        prOutputByBundle[bundle]
          ? formatSizes(prOutputByBundle[bundle]!, baseOutputByBundle[bundle])
          : '-',
      ] as const,
  );

  const body =
    HEADER + '\n\n' + generateMDTable([{ label: '' }, { label: 'size comparison' }], rows);

  if (existingComment) {
    await octokit.issues.updateComment({
      ...context.repo,
      comment_id: existingComment.id,
      body,
    });
  } else {
    await octokit.issues.createComment({
      ...context.repo,
      issue_number: prNumber,
      body,
    });
  }

  endGroup();
}

run().catch((err) => {
  console.error(err);
  setFailed(err);
});

function formatSizeChange(is?: number, was?: number) {
  if (!is || !was) {
    return '';
  }

  return formatDiff(is - was, (is - was) / was);
}

function formatSizes(
  {
    size,
    gzipSize,
  }: {
    readonly size: number;
    readonly gzipSize: number;
  },
  previous?: {
    readonly size?: number;
    readonly gzipSize?: number;
  },
): string {
  const sizeStr = `<tr><td>uncompressed</td> <td>${prettyBytes(size)} ${formatSizeChange(
    size,
    previous?.size,
  )}</td></tr>`;
  const gzipStr = `<tr><td>gzipped</td> <td>${prettyBytes(gzipSize)} ${formatSizeChange(
    gzipSize,
    previous?.gzipSize,
  )}</td></tr>`;
  return `<table>${sizeStr} ${gzipStr}</table>`;
}
