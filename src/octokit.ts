import { promises as fsp } from 'fs';
const { readFile, writeFile, unlink } = fsp;

import {
  saveCache as actionsSaveCache,
  ValidationError,
  ReserveCacheError,
  restoreCache,
} from '@actions/cache';
import { info, warning, debug } from '@actions/core';
import type { context } from '@actions/github';
import { getOctokit as githubGetOctokit } from '@actions/github';

import { HEADER } from './size-formatter';

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

export async function saveCache({
  content,
  commit,
}: {
  readonly content: object;
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
}): Promise<unknown | undefined> {
  const key = CACHE_KEY_PREFIX + commit;

  const foundKey = await restoreCache([key], key);
  if (!foundKey) {
    return undefined;
  }
  debug(`Found cache key: ${foundKey}`);
  const maybeFile = await readFile(foundKey, 'utf8');
  return JSON.parse(maybeFile) as unknown;
}
