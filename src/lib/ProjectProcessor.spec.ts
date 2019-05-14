import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as _ from 'lodash';

import { expect } from 'chai';

import File from './File';
import { FileType } from './FileType';
import Namespace from './NameSpace';
import { ProcessorConfig } from './ProcessorConfig';
import ProjectFileMap from './ProjectFileMap';
import { ProjectProcessor } from './ProjectProcessor';

const chaiSubset = require('chai-subset');
let dircompare = require('dir-compare');

chai.use(chaiSubset);
let config: ProcessorConfig = require('../test/testProcessorConfig.json');
let processor: ProjectProcessor;

describe('Project Processor', function() {
  beforeEach(() => {
    config = _.clone(config);
    processor = new ProjectProcessor(config);
    fs.removeSync(config.outputPath);
  });

  describe('Initialization', function() {
    it('correctly sets source paths and config', function() {
      expect(processor.config).to.equal(config);
      expect(processor.fileMap).to.not.be.null;

      //TODO look into correct babel compatible way to do this
      //expect(processor.fileMap instanceof ProjectFileMap).is.true; // this fails, and so does every other instance checking
    });

    it('allows overriding of filemap', function() {
      const filemap = new ProjectFileMap();
      processor = new ProjectProcessor(config, filemap);

      expect(processor.config).to.equal(config);
      expect(processor.fileMap).to.equal(filemap);
    });
  });

  describe('Copy files', function() {
    it('correctly copies files to target folder', () => {
      console.debug('copying files');
      processor.copyFiles();
      const options = { compareSize: true };
      const res = dircompare.compareSync(config.sourcePath, config.outputPath, options);
      expect(res.same).to.be.true;
      //console.debug(`finished ${res}`);
    });
  });

  describe('Clear files', function() {
    it('correctly clears target folder', () => {
      console.debug('copying files');
      processor.copyFiles();
      const options = { compareSize: true };
      const res = dircompare.compareSync(config.sourcePath, config.outputPath, options);
      expect(res.same).to.be.true;
      processor.clearFiles();
      expect(fs.pathExistsSync(config.outputPath)).to.be.false;
    });
  });

  describe('createFiles', function() {
    beforeEach(async () => {
      processor.clearFiles();
      processor.copyFiles();
      await processor.createFiles();
    });

    it('populates files', () => {
      //TODO test warnings and errors!
      console.debug('finished processing map');
      console.debug('warnings');
      console.debug(processor.warnings);
      console.debug('errors');
      console.debug(processor.errors);
      processor.fileMap.allFiles.forEach((v: File) => console.debug(v.toString()));
    });

    it('does not include excluded folders', () => {
      expect(processor.fileMap.allFiles).not.contain.keys([
        'test2.xml',
        'test2importsExcluded.xml',
        'test2importsExcluded.brs',
        'testExcluded.brs'
      ]);

      console.debug('finished processing map - it contains');
      _.forOwn(processor.fileMap.allFiles, (v, k) => console.debug(v.toString()));

    });

    it('does not include other filetypes', () => {
      expect(_.some(processor.fileMap.allFiles, { fileType: FileType.Other })).to.be.false;
    });

    it('correctly identifies brs files', () => {
      expect(processor.fileMap.getAllFiles().map( (file) => {
        return { filename: file.filename, fileType: file.fileType };
      })).containSubset([
        { filename: 'Utils.brs', fileType: FileType.Brs },
        { filename: 'BadImport.brs', fileType: FileType.Brs },
        { filename: 'FocusMixin.brs', fileType: FileType.Brs },
        { filename: 'LogMixin.brs', fileType: FileType.Brs },
        { filename: 'MultipleMixin.brs', fileType: FileType.Brs },
        { filename: 'NetMixin.brs', fileType: FileType.Brs },
        { filename: 'TextMixin.brs', fileType: FileType.Brs },
      ]);

    });

    it('correctly identifies xml files', () => {
      expect(processor.fileMap.getAllFiles().map( (file) => {
        return { filename: file.filename, fileType: file.fileType };
      })).containSubset([
        { filename: 'testXMLOnly.xml', fileType: FileType.Xml },
      ]);
    });

    it('correctly identifies ViewXml files', () => {
      expect(processor.fileMap.getAllFiles().map( (file) => {
        return { filename: file.filename, fileType: file.fileType };
      })).containSubset([
        { filename: 'test.xml', fileType: FileType.ViewXml },
        { filename: 'test2imports.xml', fileType: FileType.ViewXml },
        { filename: 'testCascadingImports.xml', fileType: FileType.ViewXml },
      ]);
    });

    it('correctly identifies CodeBehind files', () => {
      expect(processor.fileMap.getAllFiles().map( (file) => {
        return { filename: file.filename, fileType: file.fileType };
      })).containSubset([
        { filename: 'test.brs', fileType: FileType.CodeBehind },
        { filename: 'test2imports.brs', fileType: FileType.CodeBehind },
        { filename: 'testCascadingImports.brs', fileType: FileType.CodeBehind },
      ]);
    });

    it('correctly sets namespaces', () => {
      expect([...processor.fileMap.allNamespaces.values()]).to.have.length(6);
      let file = processor.fileMap.getFileByNamespaceName('Utils');
      expect(file).to.not.be.null;
      expect(file.filename).to.equal('Utils.brs');
      expect(file.namespace.name).to.equal('Utils');

      file = processor.fileMap.getFileByNamespaceName('FocusMixin');
      expect(file).to.not.be.null;
      expect(file.filename).to.equal('FocusMixin.brs');
      expect(file.namespace.name).to.equal('FocusMixin');

      file = processor.fileMap.getFileByNamespaceName('MultipleMixin');
      expect(file).to.not.be.null;
      expect(file.filename).to.equal('MultipleMixin.brs');
      expect(file.namespace.name).to.equal('MultipleMixin');

      file = processor.fileMap.getFileByNamespaceName('TextMixin');
      expect(file).to.not.be.null;
      expect(file.filename).to.equal('TextMixin.brs');
      expect(file.namespace.name).to.equal('TextMixin');

      file = processor.fileMap.getFileByNamespaceName('LogMixin');
      expect(file).to.not.be.null;
      expect(file.filename).to.equal('LogMixin.brs');
      expect(file.namespace.name).to.equal('LogMixin');

      file = processor.fileMap.getFileByNamespaceName('NetMixin');
      expect(file).to.not.be.null;
      expect(file.filename).to.equal('NetMixin.brs');
      expect(file.namespace.name).to.equal('NetMixin');
    });
  });

  describe('getNamespaceFromFile', function() {
    beforeEach(() => {
      config = _.clone(config);
      processor = new ProjectProcessor(config);
    });

    it('empty file', async () => {
      const file = new File('', 'source', 'file.brs', '.brs');
      file.setFileContents(``);
      const ns = processor.getNamespaceFromFile(file);
      expect(ns).to.be.null;
    });

    it('non brs file', async () => {
      const file = new File('', 'source', 'file.xml', '.xml');
      file.setFileContents(``);
      const ns = processor.getNamespaceFromFile(file);
      expect(ns).to.be.null;
    });

    it('no namespaces', async () => {
      const file = new File('', 'source', 'file.brs', '.brs');
      file.setFileContents(`
      function init()
      end function
      `);
      const ns = processor.getNamespaceFromFile(file);
      expect(ns).to.be.null;
      expect(processor.errors).to.be.empty;
    });

    it('namespace short and long name', async () => {
      const file = new File('', 'source', 'file.brs', '.brs');
      file.setFileContents(`
      '@Namespace MNS MyNamespace
      function init()
      end function
      `);
      const ns = processor.getNamespaceFromFile(file);
      expect(ns).to.not.be.null;
      expect(ns.file).to.equal(file);
      expect(ns.shortName).to.equal('MNS');
      expect(ns.name).to.equal('MyNamespace');
      expect(processor.errors).to.be.empty;
    });

    it('namespace long name', async () => {
      const file = new File('', 'source', 'file.brs', '.brs');
      file.setFileContents(`
      '@Namespace MyNamespace
      function init()
      end function
      `);
      const ns = processor.getNamespaceFromFile(file);
      expect(ns).to.not.be.null;
      expect(ns.file).to.equal(file);
      expect(ns.shortName).to.equal('MyNamespace');
      expect(ns.name).to.equal('MyNamespace');
      expect(processor.errors).to.be.empty;
    });

    it('duplicate', async () => {
      const file = new File('', 'source', 'file.brs', '.brs');
      file.setFileContents(`
      '@Namespace MyNamespace
      function init()
      end function
      `);
      const file2 = new File('', 'source', 'file2.brs', '.brs');
      const ns = new Namespace('MyNamespace', file2);
      processor.fileMap.allNamespaces.set('MyNamespace'.toLowerCase(), ns);
      expect(() => processor.getNamespaceFromFile(file)).to.throw(`Could not register namespace MyNamespace,
        for file file.brs. It is already registered for file file2.brs`);
      expect(processor.errors).to.not.be.empty;
    });
  });
});
