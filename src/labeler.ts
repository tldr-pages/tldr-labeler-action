import * as core from '@actions/core';
import * as github from '@actions/github';

type ClientType = ReturnType<typeof github.getOctokit>;

interface PrFile {
  sha: string;
  filename: string;
  // exists if status is 'renamed'
  previous_filename?: string;
  status: 'added' | 'renamed' | 'modified' | 'removed';
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch: string;
}

interface PrLabel {
  name: string
}

interface PrMetadata {
  labels: PrLabel[]
}

const documentationRegex = /\.md$/i;
const mainPageRegex = /^pages\//;
const toolingRegex = /\.([jt]s|py|sh|yml)$/;
const translationPageRegex = /^pages\.[a-z_]+\//i;

export const fileStatus = {
  added: 'added',
  modified: 'modified',
  removed: 'removed',
  renamed: 'renamed',
}

export const labelType = {
  documentation: 'documentation',
  massChanges: 'mass changes',
  newCommand: 'new command',
  pageEdit: 'page edit',
  tooling: 'tooling',
  translation: 'translation',
}

const getChangedFiles = async (client: ClientType, prNumber: number) => {
  const listFilesOptions = client.rest.pulls.listFiles.endpoint.merge({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });
  return client.paginate<PrFile>(listFilesOptions);
};

const getPrLabels = async (client: ClientType, prNumber: number): Promise<Set<string>> => {
  const getPrOptions = client.rest.pulls.get.endpoint.merge({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
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
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
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
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
        name: label,
      })
    )
  );
};

export const getFileLabel = (file: PrFile): string|null => {
  if (mainPageRegex.test(file.filename) || (file.previous_filename && mainPageRegex.test(file.previous_filename))) {
    if (file.status === fileStatus.added) {
      return labelType.newCommand;
    }
    if ([fileStatus.modified, fileStatus.removed, fileStatus.renamed].includes(file.status)) {
      return labelType.pageEdit;
    }
  }
  if (translationPageRegex.test(file.filename) || (file.previous_filename && translationPageRegex.test(file.previous_filename))) {
    return labelType.translation;
  }
  if (documentationRegex.test(file.filename)) {
    return labelType.documentation;
  }
  if (toolingRegex.test(file.filename)) {
    return labelType.tooling;
  }
  return null;
};

export const main = async (): Promise<void> => {
  const token = core.getInput('token', { required: true });

  const prNumber = github.context.payload.pull_request?.number;
  if (!prNumber) {
    console.log('Could not determine PR number, skipping');
    return;
  }

  const client: ClientType = github.getOctokit(token);
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
    console.log(`Labels to remove: ${[...labelsToRemove].join(', ')}`)
    await removeLabels(client, prNumber, labelsToRemove);
  }
};

export const run = async (): Promise<void> => {
  try {
    await main();
  } catch (err) {
    core.error(err as Error);
    core.setFailed((err as Error).message);
  }
};
