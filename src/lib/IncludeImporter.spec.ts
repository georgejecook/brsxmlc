import { expect } from 'chai';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as path from 'path';

import FileDescriptor from './FileDescriptor';
import IncludeImporter from './IncludeImporter';
import ProjectFileMap from './ProjectFileMap';
import { ProjectProcessor } from './ProjectProcessor';

const chaiSubset = require('chai-subset');
chai.use(chaiSubset);

let config = require('../test/testProcessorConfig.json');
let processor: ProjectProcessor;
let fileMap: ProjectFileMap;
let importFilesPath: string = path.join('components', 'screens', 'imports');
let projectPath: string = path.join(path.resolve(config.outputPath), importFilesPath);

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
    it('initializes with valid processor', function() {
      const importer = new IncludeImporter(processor);
      expect(importer).to.not.be.null;
    });

    it('fails with xml file', function() {
      const file = createFile(importFilesPath, 'xml');
      expect(() => new IncludeImporter(processor).identifyImports(file)).to.throw(Error);
    });

    it('fails with brs file', function() {
      const file = createFile(importFilesPath, 'brs');
      expect(() => new IncludeImporter(processor).identifyImports(file)).to.throw(Error);
    });

    it('fails with other file', function() {
      const file = createFile(importFilesPath, 'png');
      expect(() => new IncludeImporter(processor).identifyImports(file)).to.throw(Error);
    });

  });

  describe('identify imports', function() {

    it('identifies 1 import', function() {
      const codeBehind = createCodeBehind(importFilesPath, 'test');
      const importer = new IncludeImporter(processor);
      expect(importer).to.not.be.null;
      importer.identifyImports(codeBehind);
      expect(codeBehind.requiredImports).to.have.lengthOf(1);
      expect(codeBehind.requiredImports).containSubset([{ filename: 'FocusMixin.brs' }]);
    });

    it('identifies 2 imports', function() {
      const codeBehind = createCodeBehind(importFilesPath, 'test2Imports');
      const importer = new IncludeImporter(processor);
      expect(importer).to.not.be.null;
      importer.identifyImports(codeBehind);

      expect(codeBehind.requiredImports).to.have.lengthOf(2);
      expect(codeBehind.requiredImports).containSubset([{ filename: 'FocusMixin.brs' }]);
    });

    it('fails on missing import', function() {
      const codeBehind = createCodeBehind(importFilesPath, 'testMissingImport');
      const importer = new IncludeImporter(processor);
      expect(importer).to.not.be.null;
      //expect error
      expect(() => importer.identifyImports(codeBehind)).to.throw(Error);

    });

    it('identifies cascading imports', function() {
      const codeBehind = new FileDescriptor(projectPath, importFilesPath, `testCascadingImports.brs`, '.brs');
      const importer = new IncludeImporter(processor);
      expect(importer).to.not.be.null;
      importer.identifyImports(codeBehind);

      expect(codeBehind.requiredImports).to.have.lengthOf(3);
      expect(codeBehind.requiredImports).containSubset([{ filename: 'NetMixin.brs' }, { filename: 'LogMixin.brs' }, { filename: 'Utils.brs' }]);
    });

    it('fails on cascading missing imports', function() {
      const codeBehind = new FileDescriptor(config.projectPath, importFilesPath,  `testCascadingMissingImport.brs`, '.brs');
      const importer = new IncludeImporter(processor);
      expect(importer).to.not.be.null;
      //expect error
      expect(() => importer.identifyImports(codeBehind)).to.throw(Error);
    });
  });

});

function createCodeBehind(path, name) {
  const codeBehind = new FileDescriptor(projectPath, path, `${name}.brs`, '.brs');
  const view = new FileDescriptor(projectPath, path, `${name}.xml`, '.xml');
  codeBehind.associatedFile = view;
  view.associatedFile = codeBehind;
  return codeBehind;
}

function createFile(path, extension) {
  return new FileDescriptor(config.projectPath, path, `test${extension}`, '.extension');
}
