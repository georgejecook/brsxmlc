import { expect } from 'chai';

import File from './File';

import { FileType } from './FileType';
import Namespace from './NameSpace';

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

  describe('getAllParentImportPaths', function() {
    it('no parents', function() {
      const file = new File('/fsPath', '/source', 'test.brs', '.brs');
      file.importedFiles.push(new File('/fsPath', '/source', 'import1.brs', '.brs'));
      expect(file.getAllParentImportPaths()).to.be.empty;
    });

    it('parent with no import', function() {
      const file = new File('/fsPath', '/source', 'test.brs', '.brs');
      const parent = new File('/fsPath', '/source', 'parent.brs', '.brs');
      file.parentFile = parent;
      file.importedFiles.push(new File('/fsPath', '/source', 'import1.brs', '.brs'));
      expect(file.getAllParentImportPaths()).to.be.empty;
    });

    it('1 parent with 1 import', function() {
      const file = new File('/fsPath', '/source', 'test.brs', '.brs');
      const parent = new File('/fsPath', '/source', 'parent.brs', '.brs');
      file.parentFile = parent;
      file.importedFiles.push(new File('/fsPath', '/source', 'importA.brs', '.brs'));
      parent.importedFiles.push(new File('/fsPath', '/source', 'importB.brs', '.brs'));
      //FIXME
      // expect(file.getAllParentImportPaths().map( (ns) => ns.name)).to.include.all.members(['B']);
    });

    it('1 parent with 2 imports', function() {
      const file = new File('/fsPath', '/source', 'test.brs', '.brs');
      const parent = new File('/fsPath', '/source', 'parent.brs', '.brs');
      file.parentFile = parent;
      file.importedFiles.push(new File('/fsPath', '/source', 'importA.brs', '.brs'));
      parent.importedFiles.push(new File('/fsPath', '/source', 'importB.brs', '.brs'));
      parent.importedFiles.push(new File('/fsPath', '/source', 'importC.brs', '.brs'));
      //FIXME
      // expect(file.getAllParentImportPaths().map( (ns) => ns.name)).to.include.all.members(['B', 'C']);
    });

    it('2 parents with 1 import each', function() {
      const file = new File('/fsPath', '/source', 'test.brs', '.brs');
      const parent = new File('/fsPath', '/source', 'parent.brs', '.brs');
      const parent2 = new File('/fsPath', '/source', 'parent2.brs', '.brs');
      parent2.parentFile = parent;
      file.parentFile = parent2;
      file.importedFiles.push(new File('/fsPath', '/source', 'importA.brs', '.brs'));
      parent.importedFiles.push(new File('/fsPath', '/source', 'importB.brs', '.brs'));
      parent2.importedFiles.push(new File('/fsPath', '/source', 'importC.brs', '.brs'));
      let parentImports = file.getAllParentImportPaths();
      //FIXME
      // expect(parentImports.map( (ns) => ns.name)).to.include.all.members(['B', 'C']);
    });

    it('2 parents with 2 imports each', function() {
      const file = new File('/fsPath', '/source', 'test.brs', '.brs');
      const parent = new File('/fsPath', '/source', 'parent.brs', '.brs');
      const parent2 = new File('/fsPath', '/source', 'parent2.brs', '.brs');
      parent2.parentFile = parent;
      file.parentFile = parent2;
      file.importedFiles.push(new File('/fsPath', '/source', 'importA.brs', '.brs'));
      parent.importedFiles.push(new File('/fsPath', '/source', 'importB.brs', '.brs'));
      parent.importedFiles.push(new File('/fsPath', '/source', 'importD.brs', '.brs'));
      parent2.importedFiles.push(new File('/fsPath', '/source', 'importC.brs', '.brs'));
      parent2.importedFiles.push(new File('/fsPath', '/source', 'importE.brs', '.brs'));
      let parentImports = file.getAllParentImportPaths();
      //FIXME
      // expect(parentImports.map( (ns) => ns.name)).to.include.all.members(['B', 'C', 'D', 'E']);
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
