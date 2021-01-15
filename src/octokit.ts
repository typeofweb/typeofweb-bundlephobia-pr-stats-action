import { readFile, writeFile, unlink } from 'fs/promises';

import * as Cache from '@actions/cache';
import * as Core from '@actions/core';
import * as GitHub from '@actions/github';

import { HEADER } from './size-formatter';

const CACHE_KEY_PREFIX = 'typeofweb-bundlephobia-pr-stats-action-';

export function getOctokit() {
  if (!process.env.GITHUB_TOKEN) {
    return null;
  }

  return GitHub.getOctokit(process.env.GITHUB_TOKEN);
}

export async function findExistingComment(
  Octokit: ReturnType<typeof GitHub.getOctokit>,
  Context: typeof GitHub.context,
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
    await Cache.saveCache([key], key, { uploadConcurrency: 1 });
  } catch (err) {
    const error = err as Error | undefined;
    if (error?.name === Cache.ValidationError.name) {
      throw error;
    } else if (error?.name === Cache.ReserveCacheError.name) {
      Core.info(error?.message);
    }
    Core.warning(error?.message!);
  }
  await unlink(key);
  Core.debug(`Saved cache key: ${key}`);
}

export async function readCache({
  commit,
}: {
  readonly commit: string;
}): Promise<object | undefined> {
  const key = CACHE_KEY_PREFIX + commit;

  const foundKey = await Cache.restoreCache([key], key);
  if (!foundKey) {
    return undefined;
  }
  Core.debug(`Found cache key: ${foundKey}`);
  const maybeFile = await readFile(foundKey, 'utf8');
  return JSON.parse(maybeFile) as object;
}
