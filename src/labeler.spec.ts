import {FileStatus, getFileLabel, getMassChangesLabel, LabelType} from './labeler';

describe('getFileLabel', () => {
  describe('when a main page is changed', () => {
    describe('and the status is added', () => {
      it('should return new command label', () => {
        expect(getFileLabel({
          filename: 'pages/common/cat.md',
          status: FileStatus.added,
        })).toBe(LabelType.newCommand);
      });
    });

    describe.each([
      FileStatus.modified,
      FileStatus.removed,
      FileStatus.renamed,
    ])('and the status is %s', (status: FileStatus) => {
      it('should return page edit label', () => {
        expect(getFileLabel({
          filename: 'pages/common/cat.md',
          status,
        })).toBe(LabelType.pageEdit);
      });
    });
  });

  describe('when a translation page is changed', () => {
    describe('and the status is added', () => {
      it('should return new command label', () => {
        expect(getFileLabel({
          filename: 'pages.de/common/git.md',
          status: FileStatus.added,
        })).toBe(LabelType.newTranslation);
      });
    });

    describe.each([
      FileStatus.modified,
      FileStatus.removed,
      FileStatus.renamed,
    ])('and the status is %s', (status: FileStatus) => {
      it('should return translation edit label', () => {
        expect(getFileLabel({
          filename: 'pages.de/common/git.md',
          status,
        })).toBe(LabelType.translationEdit);
      });
    });
  });

  describe.each([
    'MAINTAINERS.md',
    '.github/CODEOWNERS'
  ])('when the %s file is changed', (filename: string) => {
    describe.each([
      FileStatus.added,
      FileStatus.modified,
      FileStatus.removed,
      FileStatus.renamed
    ])('and the status is %s', (status: FileStatus) => {
      it('should return community label', () => {
        expect(getFileLabel({
          filename,
          status,
        })).toBe(LabelType.community);
      });
    });
  });

  describe('when a Markdown file is changed', () => {
    describe.each([
      FileStatus.added,
      FileStatus.modified,
      FileStatus.removed,
      FileStatus.renamed
    ])('and the status is %s', (status: FileStatus) => {
      it('should return documentation label', () => {
        expect(getFileLabel({
          filename: 'contributing-guides/maintainers-guide.md',
          status,
        })).toBe(LabelType.documentation);
      });
    });
  });

  describe.each(
    [
      ['Bash', 'scripts/test.sh'],
      ['JavaScript', 'scripts/build-index.js'],
      ['Python', 'scripts/set-more-info-link.py'],
      ['Yaml', '.github/workflows/ci.yml'],
      ['JSON', 'package.json']
    ]
  )('when a %s file is changed', (_, filename: string) => {
    describe.each([
      FileStatus.added,
      FileStatus.modified,
      FileStatus.removed,
      FileStatus.renamed
    ])('and the status is %s', (status: FileStatus) => {
      it('should return tooling label', () => {
        expect(getFileLabel({
          filename,
          status,
        })).toBe(LabelType.tooling);
      });
    });
  });
});

describe('getMassChangesLabel', () => {
  it('should return mass changes label for more than 5 page edits', () => {
    const changedFiles = Array(6).fill({ filename: 'pages/common/cat.md', status: FileStatus.modified });
    expect(getMassChangesLabel(changedFiles)).toBe(LabelType.massChanges);
  });

  it('should return mass changes label for more than 10 translations', () => {
    const changedFiles = Array(11).fill({ filename: 'pages.de/common/git.md', status: FileStatus.modified });
    expect(getMassChangesLabel(changedFiles)).toBe(LabelType.massChanges);
  });

  it('should return null for less than 5 page edits and 10 translations', () => {
    const changedFiles = [
      ...Array(5).fill({ filename: 'pages/common/cat.md', status: FileStatus.modified }),
      ...Array(10).fill({ filename: 'pages.de/common/git.md', status: FileStatus.modified })
    ];
    expect(getMassChangesLabel(changedFiles)).toBeNull();
  });
});
