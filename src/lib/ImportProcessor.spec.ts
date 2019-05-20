import { expect } from 'chai';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as path from 'path';

import { getFeedbackErrors } from './Feedback';
import { resetFeedback } from './Feedback';
import File from './File';
import ImportProcessor from './ImportProcessor';
import ProjectFileMap from './ProjectFileMap';
import { ProjectProcessor } from './ProjectProcessor';
import { getRegexMatchesValues } from './Utils';

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
    resetFeedback();
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
      importProcessor.identifyImports(file);
      expect(file.requiredNamespaces).to.have.lengthOf(1);
      expect(file.requiredNamespaces.map( (ns) => ns.name)).to.have.all.members(['FocusMixin']);
      expect(getFeedbackErrors()).to.be.empty;
    });

    it('identifies 2 imports', function() {
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/test2Imports.xml');
      importProcessor.identifyImports(file);
      expect(file.requiredNamespaces).to.have.lengthOf(2);
      expect(file.requiredNamespaces.map( (ns) => ns.name)).to.have.all.members([
        'FocusMixin', 'TextMixin']);
      expect(getFeedbackErrors()).to.be.empty;
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
      expect(() => importProcessor.identifyImports(file)).to.throw(Error);
      expect(getFeedbackErrors()).to.not.be.empty;
    });

    it('identifies cascading imports', function() {
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/testCascadingImports.xml');
      importProcessor.identifyImports(file);
      expect(file.requiredNamespaces).to.have.lengthOf(3);
      expect(file.requiredNamespaces.map( (ns) => ns.name)).to.have.all.members([
        'Utils', 'LogMixin', 'NetMixin']);
      expect(getFeedbackErrors()).to.be.empty;
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
      expect(() => importProcessor.identifyImports(file)).to.throw(Error);
      expect(getFeedbackErrors()).to.not.be.empty;
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
      expect(() => importProcessor.identifyImports(file)).to.throw(Error);
      expect(getFeedbackErrors()).to.not.be.empty;
    });

    it('parent class includes imports', function() {
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/testExtension.xml');
      importProcessor.identifyImports(file);
      expect(file.requiredNamespaces).to.have.lengthOf(1);
      expect(file.requiredNamespaces.map( (ns) => ns.name)).to.have.all.members(['FocusMixin']);
      expect(getFeedbackErrors()).to.be.empty;
    });

    it('include subclass imports', function() {
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/testExtension2.xml');
      importProcessor.identifyImports(file);
      expect(file.requiredNamespaces).to.have.lengthOf(3);
      expect(file.requiredNamespaces.map( (ns) => ns.name)).to.have.all.members([
        'Utils', 'LogMixin', 'NetMixin']);
      expect(getFeedbackErrors()).to.be.empty;
    });

    it('include parent imports in second subclass', function() {
      //make sure we process the parents in order, so they have their namespaces set

      const fileRoot = processor.fileMap.getFileByPkgPath('components/screens/imports/testExtension.xml');
      importProcessor.identifyImports(fileRoot);
      const fileParent = processor.fileMap.getFileByPkgPath('components/screens/imports/testExtension2.xml');
      importProcessor.identifyImports(fileParent);
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/testExtension3.xml');
      importProcessor.identifyImports(file);
      expect(file.requiredNamespaces).to.have.lengthOf(2);
      expect(file.requiredNamespaces.map( (ns) => ns.name)).to.have.all.members(
        ['TextMixin', 'FocusMixin']);
      expect(file.importedNamespaces).to.have.lengthOf(1);
      expect(file.importedNamespaces.map( (ns) => ns.name)).to.have.all.members(
        ['TextMixin']);

      const topFile = processor.fileMap.getFileByPkgPath('components/screens/imports/testExtension4.xml');
      importProcessor.identifyImports(topFile);
      expect(topFile.requiredNamespaces).to.have.lengthOf(6);
      expect(topFile.requiredNamespaces.map( (ns) => ns.name)).to.have.all.members(
        ['TextMixin', 'FocusMixin', 'NetMixin', 'LogMixin', 'AuthMixin', 'Utils']);
      expect(topFile.importedNamespaces.map( (ns) => ns.name)).to.have.all.members(
        ['AuthMixin']);

      expect(getFeedbackErrors()).to.be.empty;
    });
  });

  describe('addImportIncludesToXML', function() {
    it('adds script tags for 1 import', function() {
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/test.xml');
      importProcessor.addImportsToXmlFile(file);
      expect(getFeedbackErrors()).to.be.empty;
    });

    it('adds script tags for cascading imports', function() {
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/testCascadingImports.xml');
      importProcessor.addImportsToXmlFile(file);
      expect(getFeedbackErrors()).to.be.empty;
    });

    it('adds script tags for extended imports', function() {
      const fileRoot = processor.fileMap.getFileByPkgPath('components/screens/imports/testExtension.xml');
      const fileParent = processor.fileMap.getFileByPkgPath('components/screens/imports/testExtension2.xml');
      const file = processor.fileMap.getFileByPkgPath('components/screens/imports/testExtension3.xml');
      const topFile = processor.fileMap.getFileByPkgPath('components/screens/imports/testExtension4.xml');

      importProcessor.addImportsToXmlFile(topFile);
      expect(getFeedbackErrors()).to.be.empty;

      const fileRootScriptTags = getXMLScriptImportNamesFromFile(fileRoot);
      const fileParentScriptTags = getXMLScriptImportNamesFromFile(fileParent);
      const fileScriptTags = getXMLScriptImportNamesFromFile(file);
      const topFileScriptTags = getXMLScriptImportNamesFromFile(topFile);
      expect(fileRootScriptTags).to.have.all.members(['FocusMixin.brs', 'testExtension.brs']);
      expect(fileParentScriptTags).to.have.all.members(['Utils.brs', 'LogMixin.brs', 'NetMixin.brs', 'testExtension2.brs']);
      expect(fileScriptTags).to.have.all.members(['TextMixin.brs', 'testExtension3.brs']);
      expect(topFileScriptTags).to.have.all.members(['AuthMixin.brs', 'testExtension4.brs']);
    });
  });
});

function createFile(path, extension) {
  return new File(config.outputPath, path, `test${extension}`, '.extension');
}

function getXMLScriptImportNamesFromFile(file): string[] {
  const regex = new RegExp('<.*?script.*uri=\\"(.*)\\".*\\/?>', 'gi');
  return getRegexMatchesValues(file.getFileContents(), regex, 1)
    .map( (t) => path.basename(t));
}
