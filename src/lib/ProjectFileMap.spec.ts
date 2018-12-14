const expect = require('chai').expect;
const FileDescriptor = require('./FileDescriptor');
const FileType = require('./FileType');
const DirectiveType = require('./DirectiveType');
const ProjectFileMap = require('./ProjectFileMap');
const config = require('../../config.json');
const path = require('path');

var sourcePath = path.join(__dirname, 'stubProject');
var importFilesPath = path.join(sourcePath, 'components', 'screens', 'imports');

describe("Project File map", function () {
	describe("Initialization", function () {
		it("correctly initializes with empty files and import dictionary", function () {
			var fileMap = new ProjectFileMap(sourcePath);
			expect(fileMap.allFiles).to.be.empty;
			expect(fileMap.importDependencies).to.be.empty;
		});
		it("correctly initializes with preset files and import dictionary, which are used for unit testing", function () {
			var allFiles = {"test": "value"};
			var imports = {"test": ["value", "value2"]};
			var fileMap = new ProjectFileMap(sourcePath, allFiles, imports);
			expect(fileMap.allFiles).to.equal(allFiles);
			expect(fileMap.importDependencies).to.equal(imports);
		});
	});
});
