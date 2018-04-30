const expect = require('chai').expect;
const FileDescriptor = require('../lib/fileDescriptor');
const IncludeImporter = require('../lib/includeImporter');
const ProjectProcessor = require('../lib/projectProcessor');
const ProjectFileMap = require('../lib/projectFileMap');
const config = require('../config.json');
const path = require('path');
const _ = require('lodash');
const sourcePath = path.join(__dirname, 'stubProject');
const targetPath = path.join(__dirname, '..', 'tmp');
const importFilesPath = path.join(targetPath, 'components', 'screens', 'imports');
const chaiSubset = require('chai-subset');
const chai = require('chai');
chai.use(chaiSubset);

describe("Include importer", () => {
	beforeEach(()=>{
		this.fileMap = new ProjectFileMap(sourcePath);
		this.config = _.clone(config);
		this.processor = new ProjectProcessor(sourcePath, targetPath, this.fileMap, this.config);
		this.processor.clearFiles();
		this.processor.copyFiles();
		this.processor.createFileDescriptors(targetPath);
	});

	describe("Initialization", () => {
		it("initializes with codebehind file", function () {
			var file = createCodeBehind(importFilesPath, 'test');
			var importer = new IncludeImporter(this.config, file, this.processor);
			expect(importer).to.not.be.null;
		});

		it("fails with xml file", function () {
			var file = createFile(importFilesPath, 'xml');
			expect(() => new IncludeImporter(this.config, file, this.fileMap)).to.throw(Error);
		});

		it("fails with brs file", function () {
			var file = createFile(importFilesPath, 'brs');
			expect(() => new IncludeImporter(this.config, file, this.fileMap)).to.throw(Error);
		});

		it("fails with other file", function () {
			var file = createFile(importFilesPath, 'png');
			expect(() => new IncludeImporter(this.config, file, this.fileMap)).to.throw(Error);
		});

	});

	describe("identify imports", () => {

		it("identifies 1 import", () => {
			var codeBehind = createCodeBehind(importFilesPath, 'test');
			var importer = new IncludeImporter(this.config, codeBehind, this.processor);
			expect(importer).to.not.be.null;
			importer.identifyImports();
			expect(importer.requiredImports).to.have.lengthOf(1);
			expect(importer.requiredImports).containSubset([{_filename:'FocusMixin.brs'}]);
		});

		it("identifies 2 imports", () => {
			var codeBehind = createCodeBehind(importFilesPath, 'test2Imports');
			var importer = new IncludeImporter(this.config, codeBehind, this.processor);
			expect(importer).to.not.be.null;
			importer.identifyImports();
			expect(importer.requiredImports).to.have.lengthOf(2);
			expect(importer.requiredImports).containSubset([{_filename:'FocusMixin.brs'}]);
		});

		it("fails on missing import", () => {
			var codeBehind = createCodeBehind(importFilesPath, 'testMissingImport');
			var importer = new IncludeImporter(this.config, codeBehind, this.processor);
			expect(importer).to.not.be.null;
			//expect error
			expect(() =>importer.identifyImports()).to.throw(Error);

		});

		it("fails on cascading missing imports", () => {
			var codeBehind = new FileDescriptor(importFilesPath, `testCascadingMissingImport.brs`, ".brs");
			var importer = new IncludeImporter(this.config, codeBehind, this.processor);
			expect(importer).to.not.be.null;
			//expect error
			expect(() =>importer.identifyImports()).to.throw(Error);
		});
	});

});

function createCodeBehind(path, name){
	var codeBehind = new FileDescriptor(path, `${name}.brs`, ".brs");
	var view = new FileDescriptor(path, `${name}.xml`, ".xml");
	codeBehind.associatedFile = view;
	view.associatedFile = codeBehind;
	return codeBehind;
}

function createFile(path, extension){
	return new FileDescriptor(path, `test${extension}`, ".extension");
}