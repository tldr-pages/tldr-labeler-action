import {getFileLabel, FileStatus, LabelType} from '../src/labeler';

describe('getFileLabel', () => {
  describe('when a main page is added', () => {
    it('should return new command label', () => {
      expect(getFileLabel({
        filename: 'pages/common/cat.md',
        status: FileStatus.added,
      })).toBe(LabelType.newCommand);
    });
  });

  describe('when a main page is modified', () => {
    it('should return page edit label', () => {
      expect(getFileLabel({
        filename: 'pages/windows/dir.md',
        status: FileStatus.modified,
      })).toBe(LabelType.pageEdit);
    });
  });

  describe('when a main page is removed', () => {
    it('should return page edit label', () => {
      expect(getFileLabel({
        filename: 'pages/osx/du.md',
        status: FileStatus.removed,
      })).toBe(LabelType.pageEdit);
    });
  });

  describe('when a main page is renamed', () => {
    it('should return page edit label', () => {
      expect(getFileLabel({
        previous_filename: 'pages/linux/ls.md',
        filename: 'pages/common/ls.md',
        status: FileStatus.renamed,
      })).toBe(LabelType.pageEdit);
    });
  });

  describe('returning a translation label', () => {
    it.each([
      [FileStatus.added],
      [FileStatus.modified],
      [FileStatus.removed],
    ])('should return label when page is %s', (status: FileStatus) => {
      expect(getFileLabel({
        filename: 'pages.de/common/git.md',
        status,
      })).toBe(LabelType.translation);
    });
  });

  describe('when a Markdown file is added', () => {
    it('should return documentation label', () => {
      expect(getFileLabel({
        filename: 'contributing-guides/maintainers-guide.md',
        status: FileStatus.added,
      })).toBe(LabelType.documentation);
    });
  });

  describe('when a Markdown file is modified', () => {
    it('should return documentation label', () => {
      expect(getFileLabel({
        filename: 'README.md',
        status: FileStatus.modified,
      })).toBe(LabelType.documentation);
    });
  });

  describe('when a Python file is added', () => {
    it('should return tooling label', () => {
      expect(getFileLabel({
        filename: 'scripts/set-alias-page.py',
        status: FileStatus.added,
      })).toBe(LabelType.tooling);
    });
  });

  describe('when a Python file is modified', () => {
    it('should return tooling label', () => {
      expect(getFileLabel({
        filename: 'scripts/set-more-info-link.py',
        status: FileStatus.modified,
      })).toBe(LabelType.tooling);
    });
  });

  describe('when a JavaScript file is modified', () => {
    it('should return tooling label', () => {
      expect(getFileLabel({
        filename: 'scripts/build-index.js',
        status: FileStatus.modified,
      })).toBe(LabelType.tooling);
    });
  });

  describe('when a Bash file is added', () => {
    it('should return tooling label', () => {
      expect(getFileLabel({
        filename: 'scripts/build.sh',
        status: FileStatus.added,
      })).toBe(LabelType.tooling);
    });
  });

  describe('when a Bash file is modified', () => {
    it('should return tooling label', () => {
      expect(getFileLabel({
        filename: 'scripts/test.sh',
        status: FileStatus.modified,
      })).toBe(LabelType.tooling);
    });
  });
});
