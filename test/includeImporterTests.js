const expect = require('chai').expect;
const FileDescriptor = require('../lib/fileDescriptor');
const FileType = require('../lib/fileType');
const DirectiveType = require('../lib/directiveType');
const IncludeImporter = require('../lib/includeImporter');
const config = require('../config.json');
const path = require('path');

var sourcePath = path.join(__dirname, 'stubProject');
var importFilesPath = path.join(sourcePath, 'components', 'screens', 'imports');

describe("Include importer", () => {
	describe("Initialization", () => {
		it("initializes", function () {
			var file = new FileDescriptor(importFilesPath, "test.xml", ".xml");
			var importer = new IncludeImporter(config, file);
			expect(importer).to.not.be.null;
		});

	});

	describe("identify imports", () => {

		it("identifies 1 import", () => {
			var codeBehind = createCodeBehind(importFilesPath, 'test');
			var importer = new IncludeImporter(config, codeBehind);
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