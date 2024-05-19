import {FileStatus, getFileLabel, LabelType} from './labeler';

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
    describe.each([
      FileStatus.added,
      FileStatus.modified,
      FileStatus.removed,
      FileStatus.renamed
    ])('and the status is %s', (status: FileStatus) => {
      it('should return translation label', () => {
        expect(getFileLabel({
          filename: 'pages.de/common/git.md',
          status,
        })).toBe(LabelType.translation);
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
