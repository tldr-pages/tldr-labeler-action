import {getInput, error, setFailed} from '@actions/core';
import {context, getOctokit} from '@actions/github';

type ClientType = ReturnType<typeof getOctokit>;

export enum FileStatus {
  added = 'added',
  modified = 'modified',
  removed = 'removed',
  renamed = 'renamed',
}

export enum LabelType {
  documentation = 'documentation',
  massChanges = 'mass changes',
  newCommand = 'new command',
  pageEdit = 'page edit',
  tooling = 'tooling',
  translation = 'translation',
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

const documentationRegex = /\.md$/i;
const mainPageRegex = /^pages\//;
const toolingRegex = /\.([jt]s|py|sh|yml)$/;
const translationPageRegex = /^pages\.[a-z_]+\//i;

const getChangedFiles = async (client: ClientType, prNumber: number) => {
  const listFilesOptions = client.rest.pulls.listFiles.endpoint.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });
  return client.paginate<PrFile>(listFilesOptions);
};

const getPrLabels = async (client: ClientType, prNumber: number): Promise<Set<string>> => {
  const getPrOptions = client.rest.pulls.get.endpoint.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  const prResponse = await client.request<PrMetadata>(getPrOptions);
  return new Set(prResponse.data.labels.map((label) => label.name));
};

const addLabels = async (
  client: ClientType,
  prNumber: number,
  labels: Set<string>,
): Promise<void> => {
  await client.rest.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    labels: [...labels],
  });
};

const removeLabels = async (
  client: ClientType,
  prNumber: number,
  labels: Set<string>,
): Promise<void> => {
  await Promise.all(
    [...labels].map((label) =>
      client.rest.issues.removeLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
        name: label,
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
    return LabelType.translation;
  }
  if (documentationRegex.test(file.filename)) {
    return LabelType.documentation;
  }
  if (toolingRegex.test(file.filename)) {
    return LabelType.tooling;
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

  const client: ClientType = getOctokit(token);
  const changedFiles = await getChangedFiles(client, prNumber);

  const labels = new Set<string>(
    changedFiles.map(file => getFileLabel(file)).filter((label) => label) as string[]
  );

  const prLabels = await getPrLabels(client, prNumber);
  const labelsToAdd = new Set([...labels].filter((label) => !prLabels.has(label)));
  const labelsToRemove = new Set([...prLabels].filter((label) => !labels.has(label)));

  if (labelsToAdd.size) {
    console.log(`Labels to add: ${[...labelsToAdd].join(', ')}`)
    await addLabels(client, prNumber, labelsToAdd);
  }
  if (labelsToRemove.size) {
    console.log(`Labels not added from this action: ${[...labelsToRemove].join(', ')}`)
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
