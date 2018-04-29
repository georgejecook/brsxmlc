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
const importFilesPath = path.join(sourcePath, 'components', 'screens', 'imports');

describe("Project Processor", () => {
	beforeEach(()=>{
		this.processor = new ProjectProcessor(sourcePath, targetPath, this.fileMap);
		fs.removeSync(targetPath);
	});

	describe("Initialization", () => {
		it("correctly sets source directory", () => {
			expect(this.processor.sourceFolder).to.equal(sourcePath);
			expect(this.processor.targetFolder).to.equal(targetPath);
			expect(this.processor.fileMap).to.not.be.null;
			//TODO look into correct babel compatible way to do this
			//expect(this.processor.fileMap instanceof ProjectFileMap).is.true; // this fails, and so does every other instance checking
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
		it("populates descriptors",  () => {
			//TODO test warnings and errors!

			this.processor.copyFiles()
			this.processor.createFileDescriptors(targetPath);
			console.debug('finished processing map');
			console.debug('warnings');
			console.debug(this.processor.warnings);
			console.debug('errors');
			console.debug(this.processor.errors);
			_.forOwn(this.processor.fileMap.allFiles ,(v, k) => console.debug(v.toString()));

		});

		it("does not include excluded folders",  () => {
			//TODO let config do this
			this.processor.copyFiles();
			this.processor.createFileDescriptors(targetPath);
			console.debug('finished processing map - it contains');
			_.forOwn(this.processor.fileMap.allFiles ,(v, k) => console.debug(v.toString()));

		});

		it("does not include other filetypes",  () => {
			this.processor.copyFiles();
			this.processor.createFileDescriptors(targetPath);
			console.debug('finished processing map - it contains');
			_.forOwn(this.processor.fileMap.allFiles ,(v, k) => console.debug(v.toString()));

		});

		it("correctly identifies brs files",  () => {
			this.processor.copyFiles();
			this.processor.createFileDescriptors(targetPath);
			console.debug('finished processing map - it contains');
			_.forOwn(this.processor.fileMap.allFiles ,(v, k) => console.debug(v.toString()));

		});


		it("correctly identifies xml files",  () => {
			this.processor.copyFiles();
			this.processor.createFileDescriptors(targetPath);
			console.debug('finished processing map - it contains');
			_.forOwn(this.processor.fileMap.allFiles ,(v, k) => console.debug(v.toString()));

		});

		it("correctly identifies codebehind files",  () => {
			this.processor.copyFiles();
			this.processor.createFileDescriptors(sourcePath);
			console.debug('finished processing map - it contains');
			_.forOwn(this.processor.fileMap.allFiles ,(v, k) => console.debug(v.toString()));
		});
	});
});
