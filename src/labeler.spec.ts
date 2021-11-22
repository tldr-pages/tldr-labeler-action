const {getFileLabel, fileStatus, labelType} = require('./labeler')

describe('getFileLabel', () => {
  describe('when a main page is added', () => {
    it('should return new command label', () => {
      expect(getFileLabel({
        filename: 'pages/common/cat.md',
        status: fileStatus.added,
      })).toBe(labelType.newCommand);
    });
  });

  describe('when a main page is modified', () => {
    it('should return page edit label', () => {
      expect(getFileLabel({
        filename: 'pages/windows/dir.md',
        status: fileStatus.modified,
      })).toBe(labelType.pageEdit);
    });
  });

  describe('when a main page is removed', () => {
    it('should return page edit label', () => {
      expect(getFileLabel({
        filename: 'pages/osx/du.md',
        status: fileStatus.removed,
      })).toBe(labelType.pageEdit);
    });
  });

  describe('when a main page is renamed', () => {
    it('should return page edit label', () => {
      expect(getFileLabel({
        previous_filename: 'pages/linux/ls.md',
        filename: 'pages/common/ls.md',
        status: fileStatus.renamed,
      })).toBe(labelType.pageEdit);
    });
  });

  describe('returning a translation label', () => {
    it.each([
      [fileStatus.added],
      [fileStatus.modified],
      [fileStatus.removed],
    ])('should return label when page is %s', (status) => {
      expect(getFileLabel({
        fileName: 'pages.de/common/git.md',
        status,
      })).toBe(labelType.translation);
    });
  });

  describe('when a Markdown file is added', () => {
    it('should return documentation label', () => {
      expect(getFileLabel({
        filename: 'contributing-guides/maintainers-guide.md',
        status: fileStatus.added,
      })).toBe(labelType.documentation);
    });
  });

  describe('when a Markdown file is modified', () => {
    it('should return documentation label', () => {
      expect(getFileLabel({
        filename: 'README.md',
        status: fileStatus.modified,
      })).toBe(labelType.documentation);
    });
  });

  describe('when a Python file is added', () => {
    it('should return tooling label', () => {
      expect(getFileLabel({
        filename: 'scripts/set-alias-page.py',
        status: fileStatus.added,
      })).toBe(labelType.tooling);
    });
  });

  describe('when a Python file is modified', () => {
    it('should return tooling label', () => {
      expect(getFileLabel({
        filename: 'scripts/set-more-info-link.py',
        status: fileStatus.modified,
      })).toBe(labelType.tooling);
    });
  });

  describe('when a JavaScript file is modified', () => {
    it('should return tooling label', () => {
      expect(getFileLabel({
        filename: 'scripts/build-index.js',
        status: fileStatus.modified,
      })).toBe(labelType.tooling);
    });
  });

  describe('when a Bash file is added', () => {
    it('should return tooling label', () => {
      expect(getFileLabel({
        filename: 'scripts/build.sh',
        status: fileStatus.added,
      })).toBe(labelType.tooling);
    });
  });

  describe('when a Bash file is modified', () => {
    it('should return tooling label', () => {
      expect(getFileLabel({
        filename: 'scripts/test.sh',
        status: fileStatus.modified,
      })).toBe(labelType.tooling);
    });
  });
});
