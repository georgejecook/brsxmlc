import { expect } from 'chai';

import File from './File';

import { FileType } from './FileType';

describe('File File', function() {
  describe('Initialization', function() {
    it('correctly sets directory', function() {
      const file = new File('/fsPath', '/source', 'test.xml', '.xml');
      expect(file.filename).to.equal('test.xml');
    });

    it('correctly sets directory', function() {
      const file = new File('/fsPath', '/source', 'test.xml', '.xml');
      expect(file.projectPath).to.equal('/source');

    });

    it('correctly sets extension', function() {
      const file = new File('/fsPath', '/source', 'test.xml', '.xml');
      expect(file.extension).to.equal('.xml');

    });

    it('correctly gets fullpath', function() {
      const file = new File('/fsPath', '/source', 'test.xml', '.xml');
      expect(file.fullPath).to.equal('/fsPath/test.xml');

    });
  });

  describe('file types', function() {
    it('correctly identifies type other', function() {
      const file = new File('/fsPath', '/source', 'test.json', '.json');
      expect(file.fileType).to.equal(FileType.Other);

    });

    it('correctly identifies type xml', function() {
      const file = new File('/fsPath', '/source', 'test.xml', '.xml');
      expect(file.fileType).to.equal(FileType.Xml);

    });

    it('correctly identifies type brs', function() {
      const file = new File('/fsPath', '/source', 'test.brs', '.brs');
      expect(file.fileType).to.equal(FileType.Brs);

    });

    it('correctly identifies type viewxml', function() {
      const file = new File('/fsPath', '/source', 'test.xml', '.xml');
      file.associatedFile = new File('/fsPath', '/source', 'test.brs', '.brs');
      expect(file.fileType).to.equal(FileType.ViewXml);

    });

    it('correctly  identifies type codebehind', function() {
      const file = new File('/fsPath', '/sourcehttps://github.com/georgejecook/brsxmlc', 'test.brs', '.brs');
      file.associatedFile = new File('/fsPath', '/source', 'test.xml', '.xml');
      expect(file.fileType).to.equal(FileType.CodeBehind);
    });

    it('correctly identifies type other - no extension', function() {
      const file = new File('/fsPath', '/source', 'test', '');
      expect(file.fileType).to.equal(FileType.Other);
    });
  });
});
