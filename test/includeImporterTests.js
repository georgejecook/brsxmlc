const expect = require('chai').expect;
const FileDescriptor = require('../lib/fileDescriptor');
const FileType = require('../lib/fileType');
const DirectiveType = require('../lib/directiveType');
const IncludeImporter = require('../lib/includeImporter');
const ProjectProcessor = require('../lib/projectProcessor');
const ProjectFileMap = require('../lib/projectFileMap');
const config = require('../config.json');
const path = require('path');

const sourcePath = path.join(__dirname, 'stubProject');
const targetPath = path.join(__dirname, '..', 'tmp');
const importFilesPath = path.join(targetPath, 'components', 'screens', 'imports');

describe("Include importer", () => {
	beforeEach(()=>{
		this.fileMap = new ProjectFileMap(sourcePath);
		this.processor = new ProjectProcessor(sourcePath, targetPath, this.fileMap);
		this.processor.clearFiles();
		this.processor.copyFiles();
	});

	describe("Initialization", () => {
		it("initializes with codebehind file", function () {
			var file = createCodeBehind(importFilesPath, 'test');
			var importer = new IncludeImporter(config, file, this.fileMap);
			expect(importer).to.not.be.null;
		});

		it("fails with xml file", function () {
			var file = createFile(importFilesPath, 'xml');
			expect(() => new IncludeImporter(config, file, this.fileMap)).to.throw(Error);
		});

		it("fails with brs file", function () {
			var file = createFile(importFilesPath, 'brs');
			expect(() => new IncludeImporter(config, file, this.fileMap)).to.throw(Error);
		});

		it("fails with other file", function () {
			var file = createFile(importFilesPath, 'png');
			expect(() => new IncludeImporter(config, file, this.fileMap)).to.throw(Error);
		});

	});

	describe("identify imports", () => {

		it("identifies 1 import", () => {
			var codeBehind = createCodeBehind(importFilesPath, 'test');
			var importer = new IncludeImporter(config, codeBehind, this.fileMap);
			expect(importer).to.not.be.null;
			importer.identifyImports();
			expect(importer.requiredImports).to.have.lengthOf(1);
			expect(importer.requiredImports.to.contain('FocusMixin.brs'));
		});

		it("identifies 2 imports", () => {
			var codeBehind = createCodeBehind(importFilesPath, 'test2Imports');
			var importer = new IncludeImporter(config, codeBehind);
			expect(importer).to.not.be.null;
			importer.identifyImports();
			expect(importer.requiredImports).to.have.lengthOf(1);
			expect(importer.requiredImports.to.contain('FocusMixin.brs'));
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