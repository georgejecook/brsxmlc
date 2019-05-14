import { expect } from 'chai';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as path from 'path';

import File from './File';
import ImportProcessor from './ImportProcessor';
import ProjectFileMap from './ProjectFileMap';
import { ProjectProcessor } from './ProjectProcessor';

const chaiSubset = require('chai-subset');
chai.use(chaiSubset);

let config = require('../test/testProcessorConfig.json');
let processor: ProjectProcessor;
let fileMap: ProjectFileMap;
let importFilesPath: string = path.join('components', 'screens', 'imports');
let projectPath: string = path.join(path.resolve(config.outputPath), importFilesPath);
let importProcessor: ImportProcessor;

describe('Include importProcessor', function() {
  beforeEach( async () => {
    fileMap = new ProjectFileMap();
    config = _.clone(config);
    processor = new ProjectProcessor(config, fileMap);
    processor.clearFiles();
    processor.copyFiles();
    await processor.createFiles();
    importProcessor = new ImportProcessor(processor);
  });

  describe('Initialization', function() {
    it('initializes with valid processor', function() {
      expect(importProcessor).to.not.be.null;
    });
  });

  describe('addImportsToXmlFile file failures', function() {
    it('fails with brs file', function() {
      const file = createFile(importFilesPath, '.brs');
      expect(() => new ImportProcessor(processor).addImportsToXmlFile(file)).to.throw(Error);
    });

    it('fails with other file', function() {
      const file = createFile(importFilesPath, '.png');
      expect(() => new ImportProcessor(processor).addImportsToXmlFile(file)).to.throw(Error);
    });

  });

  describe('identifyImports', function() {

    it('identifies 1 import', function() {
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/test.xml');
      const namespaces = importProcessor.getImportedNamespaces(file);
      expect(namespaces).to.have.lengthOf(1);
      expect(namespaces).containSubset([{ _name: 'FocusMixin' }]);
      expect(processor.errors).to.be.empty;
    });

    it('identifies 2 imports', function() {
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/test2Imports.xml');
      const namespaces = importProcessor.getImportedNamespaces(file);
      expect(namespaces).to.have.lengthOf(2);
      expect(namespaces).containSubset([
        { _name: 'FocusMixin' },
        { _name: 'TextMixin' }]);
      expect(processor.errors).to.be.empty;
    });

    it('fails on missing import', async () => {
      fileMap = new ProjectFileMap();
      config = _.clone(config);
      config.filePattern = [
        '**/*.brs',
        '**/*.xml',
        '!**/excluded/**/*'
      ];
      processor = new ProjectProcessor(config, fileMap);
      processor.clearFiles();
      processor.copyFiles();
      await processor.createFiles();
      importProcessor = new ImportProcessor(processor);
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/testMissingImport.xml');
      expect(() => importProcessor.getImportedNamespaces(file)).to.throw(Error);
      expect(processor.errors).to.not.be.empty;
    });

    it('identifies cascading imports', function() {
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/testCascadingImports.xml');
      const namespaces = importProcessor.getImportedNamespaces(file);
      expect(namespaces).to.have.lengthOf(3);
      expect(namespaces).containSubset([
        { _name: 'Utils' },
        { _name: 'LogMixin' },
        { _name: 'NetMixin' }]);
      expect(processor.errors).to.be.empty;
    });

    it('fails on cascading missing import', async () => {
      fileMap = new ProjectFileMap();
      config = _.clone(config);
      config.filePattern = [
        '**/*.brs',
        '**/*.xml',
        '!**/excluded/**/*'
      ];
      processor = new ProjectProcessor(config, fileMap);
      processor.clearFiles();
      processor.copyFiles();
      await processor.createFiles();
      importProcessor = new ImportProcessor(processor);
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/testMissingImport.xml');
      expect(() => importProcessor.getImportedNamespaces(file)).to.throw(Error);
      expect(processor.errors).to.not.be.empty;
    });

    it('fails on cyclical import', async () => {
      fileMap = new ProjectFileMap();
      config = _.clone(config);
      config.filePattern = [
        '**/*.brs',
        '**/*.xml',
        '!**/excluded/**/*'
      ];
      processor = new ProjectProcessor(config, fileMap);
      processor.clearFiles();
      processor.copyFiles();
      await processor.createFiles();
      importProcessor = new ImportProcessor(processor);
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/testCyclicalImport.xml');
      expect(() => importProcessor.getImportedNamespaces(file)).to.throw(Error);
      expect(processor.errors).to.not.be.empty;
    });
  });

});

function createFile(path, extension) {
  return new File(config.outputPath, path, `test${extension}`, '.extension');
}
