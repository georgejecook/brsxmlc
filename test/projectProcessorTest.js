const expect = require('chai').expect;
const FileDescriptor = require('../lib/fileDescriptor');
const FileType = require('../lib/fileType');
const DirectiveType = require('../lib/directiveType');
const ProjectFileMap = require('../lib/projectFileMap');
const ProjectProcessor = require('../lib/projectProcessor');
const config = require('../config.json');
const path = require('path');
const dircompare = require('dir-compare');
const fs = require('fs-extra');
const _ = require('lodash');
const sourcePath = path.join(__dirname, 'stubProject');
const targetPath = path.join(__dirname, '..', 'tmp');
const chaiSubset = require('chai-subset');
const chai = require('chai');
chai.use(chaiSubset);

describe("Project Processor", () => {
	beforeEach(()=>{
		this.config = _.clone(config);
		this.processor = new ProjectProcessor(sourcePath, targetPath, this.fileMap, this.config);
		fs.removeSync(targetPath);
	});

	describe("Initialization", () => {
		it("correctly sets source paths and config", () => {
			expect(this.processor.sourceFolder).to.equal(sourcePath);
			expect(this.processor.targetFolder).to.equal(targetPath);
			expect(this.processor.config).to.equal(this.config);
			expect(this.processor.fileMap).to.not.be.null;

			//TODO look into correct babel compatible way to do this
			//expect(this.processor.fileMap instanceof ProjectFileMap).is.true; // this fails, and so does every other instance checking
		});

		it("allows overriding of filemap", () => {
			const filemap = new ProjectFileMap(targetPath);
			this.processor = new ProjectProcessor(sourcePath, targetPath, filemap, this.config);

			expect(this.processor.sourceFolder).to.equal(sourcePath);
			expect(this.processor.targetFolder).to.equal(targetPath);
			expect(this.processor.fileMap).to.equal(filemap);
		});
	});

	describe("Copy files", () => {
		it("correctly copies files to target folder",  () => {
			console.debug('copying files');
			this.processor.copyFiles();
			const options = {compareSize: true};
			const res = dircompare.compareSync(sourcePath, targetPath, options);
			expect(res.same).to.be.true;
			//console.debug(`finished ${res}`);
		});
	});

	describe("Clear files", () => {
		it("correctly clears target folder",  () => {
			console.debug('copying files');
			this.processor.copyFiles();
			const options = {compareSize: true};
			const res = dircompare.compareSync(sourcePath, targetPath, options);
			expect(res.same).to.be.true;
			this.processor.clearFiles();
			expect(fs.pathExistsSync(targetPath)).to.be.false;
		});
	});

	describe("Process files", () => {
		beforeEach(()=>{
			this.processor.copyFiles();
			this.processor.createFileDescriptors(targetPath);
			this.allFiles = this.processor.fileMap.allFiles;
		});


		it("populates descriptors",  () => {
			//TODO test warnings and errors!
			console.debug('finished processing map');
			console.debug('warnings');
			console.debug(this.processor.warnings);
			console.debug('errors');
			console.debug(this.processor.errors);
			_.forOwn(this.processor.fileMap.allFiles ,(v, k) => console.debug(v.toString()));

		});

		it("does not include excluded folders",  () => {
			//TODO let config do this

			expect(this.allFiles).not.contain.keys([
				'test2.xml',
				'test2importsExcluded.xml',
				'test2importsExcluded.brs',
				'testExcluded.brs'
			]);

			console.debug('finished processing map - it contains');
			_.forOwn(this.processor.fileMap.allFiles ,(v, k) => console.debug(v.toString()));

		});

		it("does not include other filetypes",  () => {
			expect(_.some(this.allFiles, { 'fileTYPE': 'OTHTER'})).to.be.false;
		});

		it("correctly identifies brs files",  () => {
			expect(this.allFiles).containSubset({
				'Utils.brs': (v) => v.filename === 'Utils.brs' && v.fileType === 'BRS',
				'BadImport.brs': (v) => v.filename === 'BadImport.brs' && v.fileType === 'BRS',
				'FocusMixin.brs': (v) => v.filename === 'FocusMixin.brs' && v.fileType === 'BRS',
				'LogMixin.brs': (v) => v.filename === 'LogMixin.brs' && v.fileType === 'BRS',
				'MultipleMixin.brs': (v) => v.filename === 'MultipleMixin.brs' && v.fileType === 'BRS',
				'NetMixin.brs': (v) => v.filename === 'NetMixin.brs' && v.fileType === 'BRS',
				'TextMixin.brs': (v) => v.filename === 'TextMixin.brs' && v.fileType === 'BRS'
			});

		});


		it("correctly identifies xml files",  () => {
			const f = this.allFiles['testXMLOnly.xml'];
			console.debug(f.fileType);
			expect(this.allFiles).containSubset({
				'testXMLOnly.xml': (v) => v.filename === 'testXMLOnly.xml' && v.fileType === 'XML'
			});
		});

		it("correctly identifies VIEWXML files",  () => {
			expect(this.allFiles).containSubset({
				'test.xml': (v) => v.filename === 'test.xml' && v.fileType === 'VIEWXML',
				'test2imports.xml': (v) => v.filename === 'test2imports.xml' && v.fileType === 'VIEWXML',
				'testcascadingimports.xml': (v) => v.filename === 'testcascadingimports.xml' && v.fileType === 'VIEWXML',
				'testMissingImport.xml': (v) => v.filename === 'testMissingImport.xml' && v.fileType === 'VIEWXML',
			});
		});

		it("correctly identifies CODEBEHIND files",  () => {
			expect(this.allFiles).containSubset({
				'test.brs': (v) => v.filename === 'test.brs' && v.fileType === 'CODEBEHIND',
				'test2imports.brs': (v) => v.filename === 'test2imports.brs' && v.fileType === 'CODEBEHIND',
				'testcascadingimports.brs': (v) => v.filename === 'testcascadingimports.brs' && v.fileType === 'CODEBEHIND',
				'testMissingImport.brs': (v) => v.filename === 'testMissingImport.brs' && v.fileType === 'CODEBEHIND',
			});
		});
	});
});
