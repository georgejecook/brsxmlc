var expect = require('chai').expect;
var FileDescriptor = require('../lib/fileDescriptor');
const FileType = require('../lib/fileType');
const DirectiveType = require('../lib/directiveType');


describe("File Descriptor", function () {
	describe("Initialization", function () {
		it("correctly sets fullPath", function () {
			var file = new FileDescriptor("/source/test.xml", "test.xml", ".xml");
			expect(file.name).to.equal("test.xml")
		});

		it("correctly sets fullpath", function () {
			var file = new FileDescriptor("/source/test.xml", "test.xml", ".xml");
			expect(file.fullPath).to.equal("/source/test.xml")

		});

		it("correctly sets extension", function () {
			var file = new FileDescriptor("/source/test.xml", "test.xml", ".xml");
			expect(file.extension).to.equal(".xml")

		});

	});

	describe("file types", function () {
		it("correctly identifies type other", function () {
			var file = new FileDescriptor("/source/test.json", "test.json", ".json");
			expect(file.fileType).to.equal(FileType.OTHER);

		});

		it("correctly identifies type xml", function () {
			var file = new FileDescriptor("/source/test.xml", "test.xml", ".xml");
			expect(file.fileType).to.equal(FileType.XML);

		});


		it("correctly identifies type brs", function () {
			var file = new FileDescriptor("/source/test.brs", "test.brs", ".brs");
			expect(file.fileType).to.equal(FileType.BRS);

		});


		it("correctly identifies type viewxml", function () {
			var file = new FileDescriptor("/source/test.xml", "test.xml", ".xml");
			file.associatedFile = new FileDescriptor("/source/test.brs", "test.brs", ".brs");
			expect(file.fileType).to.equal(FileType.VIEWXML);

		});


		it("correctly  identifies type codebehind", function () {
			var file = new FileDescriptor("/source/test.brshttps://github.com/georgejecook/brsxmlc", "test.brs", ".brs");
			file.associatedFile = new FileDescriptor("/source/test.xml", "test.xml", ".xml");
			expect(file.fileType).to.equal(FileType.CODEBEHIND);

		});


		it("correctly identifies type other - no extension", function () {
			var file = new FileDescriptor("/source/test", "test", "");
			expect(file.fileType).to.equal(FileType.OTHER);

		});



	});

});