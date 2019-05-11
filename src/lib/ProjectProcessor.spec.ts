import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as _ from 'lodash';

import { expect } from 'chai';

import FileDescriptor from './FileDescriptor';
import { FileType } from './FileType';
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
      const filemap = new ProjectFileMap(config);
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

  describe('createFileDescriptors', function() {
    beforeEach(() => {
      processor.clearFiles();
      processor.copyFiles();
      processor.createFileDescriptors();
    });

    it('populates descriptors', () => {
      //TODO test warnings and errors!
      console.debug('finished processing map');
      console.debug('warnings');
      console.debug(processor.warnings);
      console.debug('errors');
      console.debug(processor.errors);
      processor.fileMap.allFiles.forEach((v: FileDescriptor) => console.debug(v.toString()));
    });

    it('does not include excluded folders', () => {
      //TODO let config do this

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
      expect(processor.fileMap.allFiles).containSubset({
        'Utils.brs': (v: FileDescriptor) => v.filename === 'Utils.brs' && v.fileType === FileType.Brs,
        'BadImport.brs': (v: FileDescriptor) => v.filename === 'BadImport.brs' && v.fileType === FileType.Brs,
        'FocusMixin.brs': (v: FileDescriptor) => v.filename === 'FocusMixin.brs' && v.fileType === FileType.Brs,
        'LogMixin.brs': (v: FileDescriptor) => v.filename === 'LogMixin.brs' && v.fileType === FileType.Brs,
        'MultipleMixin.brs': (v: FileDescriptor) => v.filename === 'MultipleMixin.brs' && v.fileType === FileType.Brs,
        'NetMixin.brs': (v: FileDescriptor) => v.filename === 'NetMixin.brs' && v.fileType === FileType.Brs,
        'TextMixin.brs': (v: FileDescriptor) => v.filename === 'TextMixin.brs' && v.fileType === FileType.Brs
      });

    });

    it('correctly identifies xml files', () => {
      const f = processor.fileMap.allFiles['testXMLOnly.xml'];
      console.debug(f.fileType);
      expect(processor.fileMap.allFiles).containSubset({
        'testXMLOnly.xml': (v: FileDescriptor) => v.filename === 'testXMLOnly.xml' && v.fileType === FileType.Xml
      });
    });

    it('correctly identifies ViewXml files', () => {
      expect(processor.fileMap.allFiles).containSubset({
        'test.xml': (v: FileDescriptor) => v.filename === 'test.xml' && v.fileType === FileType.ViewXml,
        'test2imports.xml': (v: FileDescriptor) => v.filename === 'test2imports.xml' && v.fileType === FileType.ViewXml,
        'testCascadingImports.xml': (v: FileDescriptor) => v.filename === 'testCascadingImports.xml' && v.fileType === FileType.ViewXml,
        'testMissingImport.xml': (v: FileDescriptor) => v.filename === 'testMissingImport.xml' && v.fileType === FileType.ViewXml,
      });
    });

    it('correctly identifies CodeBehind files', () => {
      expect(processor.fileMap.allFiles).containSubset({
        'test.brs': (v: FileDescriptor) => v.filename === 'test.brs' && v.fileType === FileType.CodeBehind,
        'test2imports.brs': (v: FileDescriptor) => v.filename === 'test2imports.brs' && v.fileType === FileType.CodeBehind,
        'testCascadingImports.brs': (v: FileDescriptor) => v.filename === 'testCascadingImports.brs' && v.fileType === FileType.CodeBehind,
        'testMissingImport.brs': (v: FileDescriptor) => v.filename === 'testMissingImport.brs' && v.fileType === FileType.CodeBehind,
      });
    });
  });
  describe('processImports', function() {
    beforeEach(() => {
      config = _.clone(config);
      config.sourcePath = `/Users/georgecook/Documents/h7ci/hope/smc/pot-smithsonian-channel-roku-xm/src`;
      config.outputPath = `/Users/georgecook/Documents/h7ci/hope/brsxmlc/build`;
      processor = new ProjectProcessor(config);
      fs.removeSync(config.outputPath);
      processor.clearFiles();
      processor.copyFiles();
      processor.createFileDescriptors();
    });

    it('updates the xml files', async () => {
      await processor.processImports();
      expect(true).to.not.be.true;
    });

    it('throws an error when an import is missing', () => {
      config = _.clone(config);
      config.filePattern = [
        '**/*.brs',
        '**/*.xml',
        '!**/excluded/**/*'
      ];
      processor = new ProjectProcessor(config);
      fs.removeSync(config.outputPath);
      processor.clearFiles();
      processor.copyFiles();
      processor.createFileDescriptors();
      expect( () => processor.processImports()).to.throw(Error);
    });
  });
});
