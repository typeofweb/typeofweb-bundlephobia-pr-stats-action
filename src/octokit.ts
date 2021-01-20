import { promises as fsp } from 'fs';
import { unzipSync } from 'zlib';

const { readFile, writeFile, unlink } = fsp;

import {
  saveCache as actionsSaveCache,
  ValidationError,
  ReserveCacheError,
  restoreCache,
} from '@actions/cache';
import { info, warning, debug, endGroup, setFailed, startGroup } from '@actions/core';
import { context, getOctokit as githubGetOctokit } from '@actions/github';

import { HEADER } from './size-formatter';
import type { CacheItem } from './types';
import { generateMDTable } from './utils';

const CACHE_KEY_PREFIX = 'typeofweb-bundle-pr-stats-action-';

export function getOctokit() {
  if (!process.env.GITHUB_TOKEN) {
    return null;
  }

  return githubGetOctokit(process.env.GITHUB_TOKEN);
}

export async function findExistingComment(
  Octokit: ReturnType<typeof githubGetOctokit>,
  Context: typeof context,
  prNumber: number,
) {
  const { data: comments } = await Octokit.issues.listComments({
    ...Context.repo,
    issue_number: prNumber,
  });
  return comments.find((comment) => comment.body?.includes(HEADER));
}

export async function findArtifact(
  Octokit: ReturnType<typeof githubGetOctokit>,
  name: string,
  workflowRunId: number,
) {
  const list = await Octokit.actions.listWorkflowRunArtifacts({
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: workflowRunId,
  });
  debug(JSON.stringify(list, null, 2));

  const artifact = list.data.artifacts.find((artifact) => artifact.name === name);
  if (!artifact) {
    return;
  }
  debug(JSON.stringify(artifact, null, 2));

  const download = await Octokit.actions.downloadArtifact({
    owner: context.repo.owner,
    repo: context.repo.repo,
    artifact_id: artifact.id,
    archive_format: 'zip',
  });
  debug(JSON.stringify(Buffer.from(download.data as any).toString('utf-8'), null, 2));

  const result = unzipSync(Buffer.from(download.data as any));

  return result.toString('utf-8');
}

export async function saveCache({
  content,
  commit,
}: {
  readonly content: CacheItem;
  readonly commit: string;
}) {
  const key = CACHE_KEY_PREFIX + commit;

  await writeFile(key, JSON.stringify(content), { encoding: 'utf8' });
  try {
    await actionsSaveCache([key], key, { uploadConcurrency: 1 });
  } catch (err) {
    const error = err as Error | undefined;
    if (error?.name === ValidationError.name) {
      throw error;
    } else if (error?.name === ReserveCacheError.name) {
      info(error?.message);
    }
    warning(error?.message!);
  }
  await unlink(key);
  debug(`Saved cache key: ${key}`);
}

export async function readCache({
  commit,
}: {
  readonly commit: string;
}): Promise<CacheItem | undefined> {
  const key = CACHE_KEY_PREFIX + commit;

  const foundKey = await restoreCache([key], key);
  if (!foundKey) {
    return undefined;
  }
  debug(`Found cache key: ${foundKey}`);
  const maybeFile = await readFile(foundKey, 'utf8');
  return JSON.parse(maybeFile) as CacheItem;
}

export async function postComment({
  buildComparisonRows,
  speedComparisonRows,
  prNumber,
}: {
  readonly buildComparisonRows: readonly (readonly [string, string])[];
  readonly speedComparisonRows: readonly (readonly [string, string, string, string])[];
  readonly prNumber: number;
}) {
  const octokit = getOctokit();

  if (!octokit) {
    return setFailed('Missing GITHUB_TOKEN!');
  }

  startGroup('postComment');
  const body = [
    HEADER,
    '## Bundle size comparison',
    generateMDTable([{ label: '' }, { label: 'size comparison' }], buildComparisonRows),
    '\n\n',
    '## Speed comparison',
    '### PR',
    generateMDTable(
      [
        { label: 'library' },
        { label: 'relative speed' },
        { label: 'operations per second' },
        { label: 'avg. operation time' },
      ],
      speedComparisonRows,
    ),
  ].join('\n');

  const existingComment = await findExistingComment(octokit, context, prNumber);
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
