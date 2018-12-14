import ProjectProcessor from "./ProjectProcessor";
import IncludeImporter from "./IncludeImporter";
import ProjectFileMap from "./ProjectFileMap";

let processor: ProjectProcessor;
let config: Object;
let fileMap: ProjectFileMap;
let targetPath: string;

describe("Include importer", function () {
	beforeEach(function (){
		fileMap = new ProjectFileMap(sourcePath);
		config = _.clone(config);
		processor = new ProjectProcessor(sourcePath, targetPath, fileMap, config);
		processor.clearFiles();
		processor.copyFiles();
		processor.createFileDescriptors(targetPath);
	});

	describe("Initialization", function () {
		it("initializes with codebehind file", function () {
			var file = createCodeBehind(importFilesPath, 'test');
			var importer = new IncludeImporter(config, file, processor);
			expect(importer).to.not.be.null;
		});

		it("fails with xml file", function () {
			var file = createFile(importFilesPath, 'xml');
			expect(() => new IncludeImporter(config, file, fileMap)).to.throw(Error);
		});

		it("fails with brs file", function () {
			var file = createFile(importFilesPath, 'brs');
			expect(() => new IncludeImporter(config, file, fileMap)).to.throw(Error);
		});

		it("fails with other file", function () {
			var file = createFile(importFilesPath, 'png');
			expect(() => new IncludeImporter(config, file, fileMap)).to.throw(Error);
		});

	});

	describe("identify imports", function () {

		it("identifies 1 import", function () {
			var codeBehind = createCodeBehind(importFilesPath, 'test');
			var importer = new IncludeImporter(config, codeBehind, processor);
			expect(importer).to.not.be.null;
			importer.identifyImports();
			expect(importer.requiredImports).to.have.lengthOf(1);
			expect(importer.requiredImports).containSubset([{_filename:'FocusMixin.brs'}]);
		});

		it("identifies 2 imports", function () {
			var codeBehind = createCodeBehind(importFilesPath, 'test2Imports');
			var importer = new IncludeImporter(config, codeBehind, processor);
			expect(importer).to.not.be.null;
			importer.identifyImports();

			expect(importer.requiredImports).to.have.lengthOf(2);
			expect(importer.requiredImports).containSubset([{_filename:'FocusMixin.brs'}]);
		});

		it("fails on missing import", function () {
			var codeBehind = createCodeBehind(importFilesPath, 'testMissingImport');
			var importer = new IncludeImporter(config, codeBehind, processor);
			expect(importer).to.not.be.null;
			//expect error
			expect(() =>importer.identifyImports()).to.throw(Error);

		});

        it("identifies cascading imports", function () {
            var codeBehind = new FileDescriptor(importFilesPath, `testCascadingImports.brs`, ".brs");
            var importer = new IncludeImporter(config, codeBehind, processor);
            expect(importer).to.not.be.null;
            importer.identifyImports();

            expect(importer.requiredImports).to.have.lengthOf(3);
            expect(importer.requiredImports).containSubset([{_filename:'NetMixin.brs'}, {_filename:'LogMixin.brs'}, {_filename:'Utils.brs'}]);
        });

		it("fails on cascading missing imports", function () {
			var codeBehind = new FileDescriptor(importFilesPath, `testCascadingMissingImport.brs`, ".brs");
			var importer = new IncludeImporter(config, codeBehind, processor);
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