import {getInput, error, setFailed} from '@actions/core';
import {context, getOctokit} from '@actions/github';
import {uniq} from './util';

type Octokit = ReturnType<typeof getOctokit>;

export enum FileStatus {
  added = 'added',
  modified = 'modified',
  removed = 'removed',
  renamed = 'renamed',
}

export enum LabelType {
  community = 'community',
  documentation = 'documentation',
  massChanges = 'mass changes',
  newCommand = 'new command',
  pageEdit = 'page edit',
  tooling = 'tooling',
  newTranslation = 'new translation',
  translationEdit = 'translation edit',
  waiting = 'waiting',
  reviewNeeded  = 'review needed',
}

export interface PrFile {
  filename: string;
  /**
   * The previous filename of the file exists only if status is renamed.
   */
  previous_filename?: string;
  status: FileStatus;
}

export interface PrLabel {
  name: string
}

export interface PrMetadata {
  labels: PrLabel[]
}

export interface PrReviewer {
  login: string
}

export interface PrReviewers {
  users: PrReviewer[]
}

const communityRegex = /^MAINTAINERS\.md$|^\.github\/CODEOWNERS$/;
const documentationRegex = /\.md$/i;
const mainPageRegex = /^pages\//;
const toolingRegex = /\.([jt]s|py|sh|yml|json)$/;
const translationPageRegex = /^pages\.[a-z_]+\//i;

const getPrDraftStatus = async (octokit: Octokit, prNumber: number): Promise<boolean> => {
  const response = await octokit.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  return response.data.draft || false;
};

const getChangedFiles = async (octokit: Octokit, prNumber: number) => {
  const listFilesOptions = octokit.rest.pulls.listFiles.endpoint.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });
  return octokit.paginate<PrFile>(listFilesOptions);
};

const getPrLabels = async (octokit: Octokit, prNumber: number): Promise<string[]> => {
  const getPrOptions = octokit.rest.pulls.get.endpoint.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  const prResponse = await octokit.request<PrMetadata>(getPrOptions);
  return uniq(prResponse.data.labels.map((label) => label.name));
};

const getPrReviewers = async (octokit: Octokit, prNumber: number): Promise<string[]> => {
  const getPrOptions = octokit.rest.pulls.listRequestedReviewers.endpoint.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  const prResponse = await octokit.request<PrReviewers>(getPrOptions);
  return uniq(prResponse.data.users.map((user) => user.login));
};

const addLabels = async (
  octokit: Octokit,
  prNumber: number,
  labels: string[],
): Promise<void> => {
  await octokit.rest.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    labels,
  });
};

const removeLabels = async (
  octokit: Octokit,
  prNumber: number,
  labels: string[],
): Promise<void> => {
  await Promise.all(
    labels.map((name) =>
      octokit.rest.issues.removeLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
        name,
      })
    )
  );
};

export const getFileLabel = (file: PrFile): string|null => {
  if (mainPageRegex.test(file.filename) || (file.previous_filename && mainPageRegex.test(file.previous_filename))) {
    if (file.status === FileStatus.added) {
      return LabelType.newCommand;
    }
    if ([FileStatus.modified, FileStatus.removed, FileStatus.renamed].includes(file.status)) {
      return LabelType.pageEdit;
    }
  }
  if (translationPageRegex.test(file.filename) || (file.previous_filename && translationPageRegex.test(file.previous_filename))) {
    if (file.status === FileStatus.added) {
      return LabelType.newTranslation;
    }
    if ([FileStatus.modified, FileStatus.removed, FileStatus.renamed].includes(file.status)) {
      return LabelType.translationEdit;
    }
  }
  if (communityRegex.test(file.filename) || (file.previous_filename && communityRegex.test(file.previous_filename))) {
    return LabelType.community;
  }
  if (documentationRegex.test(file.filename) || (file.previous_filename && documentationRegex.test(file.previous_filename))) {
    return LabelType.documentation;
  }
  if (toolingRegex.test(file.filename) || (file.previous_filename && toolingRegex.test(file.previous_filename))) {
    return LabelType.tooling;
  }
  return null;
};

export const getMassChangesLabel = (changedFiles: PrFile[]): string | null => {
  const pageEdits = changedFiles.filter(file => mainPageRegex.test(file.filename)).length;
  const translations = changedFiles.filter(file => translationPageRegex.test(file.filename)).length;

  if (pageEdits > 5 || translations > 10) {
    return LabelType.massChanges;
  }

  return null;
};

export const getReviewNeededLabel = async (octokit: Octokit, prNumber: number): Promise<string | null> => {
  const reviewers = await getPrReviewers(octokit, prNumber);

  if (reviewers.length === 0) {
    return LabelType.reviewNeeded;
  }

  return null;
};

export const main = async (): Promise<void> => {
  const token = getInput('token', { required: true });

  const prNumber = context.payload.pull_request?.number;
  if (!prNumber) {
    console.log('Could not determine PR number, skipping');
    return;
  }

  const octokit: Octokit = getOctokit(token);

  const isDraft = await getPrDraftStatus(octokit, prNumber);
  if (isDraft) {
    console.log('PR is in draft mode, skipping');
    return;
  }

  const changedFiles = await getChangedFiles(octokit, prNumber);

  const labels = uniq(
    changedFiles.map(file => getFileLabel(file)).filter((label) => label !== null) as string[]
  );

  const massChangesLabel = getMassChangesLabel(changedFiles);
  if (massChangesLabel) {
    labels.push(massChangesLabel);
  }

  const reviewNeededLabel = await getReviewNeededLabel(octokit, prNumber);
  if (reviewNeededLabel) {
    labels.push(reviewNeededLabel);
  }

  const prLabels = await getPrLabels(octokit, prNumber);
  const labelsToAdd = labels.filter((label) => !prLabels.includes(label));
  const extraPrLabels = prLabels.filter((label) => !labels.includes(label));

  if (labelsToAdd.length) {
    console.log(`Labels to add: ${labelsToAdd.join(', ')}`)
    await addLabels(octokit, prNumber, labelsToAdd);
  }
  if (extraPrLabels.includes(LabelType.waiting)) {
    console.log(`Labels to remove: ${LabelType.waiting}`)
    await removeLabels(octokit, prNumber, [LabelType.waiting]);
  }
};

export const run = async (): Promise<void> => {
  try {
    await main();
  } catch (err) {
    error(err as Error);
    setFailed((err as Error).message);
  }
};
