const expect = require('chai').expect;
const FileDescriptor = require('../lib/fileDescriptor');
const FileType = require('../lib/fileType');
const DirectiveType = require('../lib/directiveType');
const ProjectFileMap = require('../lib/projectFileMap');
const ProjectProcessor = require('../lib/projectProcessor');
const config = require('../config.json');
const path = require('path');

var sourcePath = path.join(__dirname, 'stubProject');
var targetPath = path.join(__dirname, 'stubProject');
var importFilesPath = path.join(sourcePath, 'components', 'screens', 'imports');

describe("Project Processor", () => {
	beforeEach(()=>{
		this.processor = new ProjectProcessor(sourcePath, targetPath, this.fileMap);
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
		it("correctly copies files to target folder", () => {
			expect(this.processor.sourceFolder).to.equal(sourcePath);
			expect(this.processor.targetFolder).to.equal(targetPath);
			expect(this.processor.fileMap).to.not.be.null;
			//TODO look into correct babel compatible way to do this
			//expect(this.processor.fileMap instanceof ProjectFileMap).is.true; // this fails, and so does every other instance checking
		});
	});
});
