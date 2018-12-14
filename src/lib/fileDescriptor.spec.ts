import { expect } from 'chai';

import FileDescriptor from './FileDescriptor';

import { FileType } from './FileType';

describe("File Descriptor", function () {
	describe("Initialization", function () {
		it("correctly sets directory", function () {
			var file = new FileDescriptor("/source", "test.xml", ".xml");
			expect(file.filename).to.equal("test.xml");
		});

		it("correctly sets directory", function () {
			var file = new FileDescriptor("/source", "test.xml", ".xml");
			expect(file.directory).to.equal("/source");

		});

		it("correctly sets extension", function () {
			var file = new FileDescriptor("/source", "test.xml", ".xml");
			expect(file.extension).to.equal(".xml");

		});

		it("correctly gets fullpath", function () {
			var file = new FileDescriptor("/source", "test.xml", ".xml");
			expect(file.fullPath).to.equal("/source/test.xml");

		});



	});

	describe("file types", function () {
		it("correctly identifies type other", function () {
			var file = new FileDescriptor("/source", "test.json", ".json");
			expect(file.fileType).to.equal(FileType.OTHER);

		});

		it("correctly identifies type xml", function () {
			var file = new FileDescriptor("/source", "test.xml", ".xml");
			expect(file.fileType).to.equal(FileType.XML);

		});


		it("correctly identifies type brs", function () {
			var file = new FileDescriptor("/source", "test.brs", ".brs");
			expect(file.fileType).to.equal(FileType.BRS);

		});


		it("correctly identifies type viewxml", function () {
			var file = new FileDescriptor("/source", "test.xml", ".xml");
			file.associatedFile = new FileDescriptor("/source", "test.brs", ".brs");
			expect(file.fileType).to.equal(FileType.VIEWXML);

		});


		it("correctly  identifies type codebehind", function () {
			var file = new FileDescriptor("/sourcehttps://github.com/georgejecook/brsxmlc", "test.brs", ".brs");
			file.associatedFile = new FileDescriptor("/source", "test.xml", ".xml");
			expect(file.fileType).to.equal(FileType.CODEBEHIND);

		});


		it("correctly identifies type other - no extension", function () {
			var file = new FileDescriptor("/source", "test", "");
			expect(file.fileType).to.equal(FileType.OTHER);

		});

	});

});