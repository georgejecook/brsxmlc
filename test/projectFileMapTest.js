const expect = require('chai').expect;
const FileDescriptor = require('../lib/fileDescriptor');
const FileType = require('../lib/fileType');
const DirectiveType = require('../lib/directiveType');
const ProjectFileMap = require('../lib/projectFileMap');
const config = require('../config.json');
const path = require('path');

var sourcePath = path.join(__dirname, 'stubProject');
var importFilesPath = path.join(sourcePath, 'components', 'screens', 'imports');

describe("Project File map", ()=> {
	describe("Initialization",() => {
		it("correctly initializes with empty files and import dictionary",() => {
			var fileMap = new ProjectFileMap(sourcePath);
			expect(fileMap.allFiles).to.be.empty;
			expect(fileMap.importDependencies).to.be.empty;
		});
		it("correctly initializes with preset files and import dictionary, which are used for unit testing",() => {
			var allFiles = {"test":"value"};
			var imports = {"test":["value","value2"]};
			var fileMap = new ProjectFileMap(sourcePath, allFiles, imports);
			expect(fileMap.allFiles).to.equal(allFiles);
			expect(fileMap.importDependencies).to.equal(imports);
		});
	});
});
