import { expect } from 'chai';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as path from 'path';

import FileDescriptor from './FileDescriptor';
import IncludeImporter from './IncludeImporter';
import ProjectFileMap from './ProjectFileMap';
import ProjectProcessor from './ProjectProcessor';

const chaiSubset = require('chai-subset');
chai.use(chaiSubset);

let config = require('../test/testProcessorConfig.json');
let processor: ProjectProcessor;
let fileMap: ProjectFileMap;
let importFilesPath: string = path.join(config.sourcePath, 'components', 'screens', 'imports');

describe('Include importer', function() {
  beforeEach(function() {
    fileMap = new ProjectFileMap(config);
    config = _.clone(config);
    processor = new ProjectProcessor(config, fileMap);
    processor.clearFiles();
    processor.copyFiles();
    processor.createFileDescriptors();
  });

  describe('Initialization', function() {
    it('initializes with codebehind file', function() {
      const file = createCodeBehind(importFilesPath, 'test');
      const importer = new IncludeImporter(config, file, processor);
      expect(importer).to.not.be.null;
    });

    it('fails with xml file', function() {
      const file = createFile(importFilesPath, 'xml');
      expect(() => new IncludeImporter(config, file, fileMap)).to.throw(Error);
    });

    it('fails with brs file', function() {
      const file = createFile(importFilesPath, 'brs');
      expect(() => new IncludeImporter(config, file, fileMap)).to.throw(Error);
    });

    it('fails with other file', function() {
      const file = createFile(importFilesPath, 'png');
      expect(() => new IncludeImporter(config, file, fileMap)).to.throw(Error);
    });

  });

  describe('identify imports', function() {

    it('identifies 1 import', function() {
      const codeBehind = createCodeBehind(importFilesPath, 'test');
      const importer = new IncludeImporter(config, codeBehind, processor);
      expect(importer).to.not.be.null;
      importer.identifyImports();
      expect(importer.requiredImports).to.have.lengthOf(1);
      expect(importer.requiredImports).containSubset([{ filename: 'FocusMixin.brs' }]);
    });

    it('identifies 2 imports', function() {
      const codeBehind = createCodeBehind(importFilesPath, 'test2Imports');
      const importer = new IncludeImporter(config, codeBehind, processor);
      expect(importer).to.not.be.null;
      importer.identifyImports();

      expect(importer.requiredImports).to.have.lengthOf(2);
      expect(importer.requiredImports).containSubset([{ filename: 'FocusMixin.brs' }]);
    });

    it('fails on missing import', function() {
      const codeBehind = createCodeBehind(importFilesPath, 'testMissingImport');
      const importer = new IncludeImporter(config, codeBehind, processor);
      expect(importer).to.not.be.null;
      //expect error
      expect(() => importer.identifyImports()).to.throw(Error);

    });

    it('identifies cascading imports', function() {
      const codeBehind = new FileDescriptor(importFilesPath, `testCascadingImports.brs`, '.brs');
      const importer = new IncludeImporter(config, codeBehind, processor);
      expect(importer).to.not.be.null;
      importer.identifyImports();

      expect(importer.requiredImports).to.have.lengthOf(3);
      expect(importer.requiredImports).containSubset([{ filename: 'NetMixin.brs' }, { filename: 'LogMixin.brs' }, { filename: 'Utils.brs' }]);
    });

    it('fails on cascading missing imports', function() {
      const codeBehind = new FileDescriptor(importFilesPath, `testCascadingMissingImport.brs`, '.brs');
      const importer = new IncludeImporter(config, codeBehind, processor);
      expect(importer).to.not.be.null;
      //expect error
      expect(() => importer.identifyImports()).to.throw(Error);
    });
  });

});

function createCodeBehind(path, name) {
  const codeBehind = new FileDescriptor(path, `${name}.brs`, '.brs');
  const view = new FileDescriptor(path, `${name}.xml`, '.xml');
  codeBehind.associatedFile = view;
  view.associatedFile = codeBehind;
  return codeBehind;
}

function createFile(path, extension) {
  return new FileDescriptor(path, `test${extension}`, '.extension');
}
