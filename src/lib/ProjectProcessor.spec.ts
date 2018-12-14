import * as fs from 'fs-extra';
import * as dircompare from 'dir-compare';
import ProjectProcessor from './ProjectProcessor';

let config:any;
let processor: ProjectProcessor;
let targetPath: string;
let fileMap: string;
let allFiles: any;

describe("Project Processor", function () {
	beforeEach(() => {
		config = _.clone(config);
		processor = new ProjectProcessor(sourcePath, targetPath, fileMap, config);
		fs.removeSync(targetPath);
	});

	describe("Initialization", function () {
		it("correctly sets source paths and config", function () {
			expect(processor.sourceFolder).to.equal(sourcePath);
			expect(processor.targetFolder).to.equal(targetPath);
			expect(processor.config).to.equal(config);
			expect(processor.fileMap).to.not.be.null;

			//TODO look into correct babel compatible way to do this
			//expect(processor.fileMap instanceof ProjectFileMap).is.true; // this fails, and so does every other instance checking
		});

		it("allows overriding of filemap", function () {
			const filemap = new ProjectFileMap(targetPath);
			processor = new ProjectProcessor(sourcePath, targetPath, filemap, config);

			expect(processor.sourceFolder).to.equal(sourcePath);
			expect(processor.targetFolder).to.equal(targetPath);
			expect(processor.fileMap).to.equal(filemap);
		});
	});

	describe("Copy files", function () {
		it("correctly copies files to target folder", () => {
			console.debug('copying files');
			processor.copyFiles();
			const options = {compareSize: true};
			const res = dircompare.compareSync(sourcePath, targetPath, options);
			expect(res.same).to.be.true;
			//console.debug(`finished ${res}`);
		});
	});

	describe("Clear files", function () {
		it("correctly clears target folder", () => {
			console.debug('copying files');
			processor.copyFiles();
			const options = {compareSize: true};
			const res = dircompare.compareSync(sourcePath, targetPath, options);
			expect(res.same).to.be.true;
			processor.clearFiles();
			expect(fs.pathExistsSync(targetPath)).to.be.false;
		});
	});

	describe("Process files", function () {
		beforeEach(() => {
			processor.copyFiles();
			processor.createFileDescriptors(targetPath);
			allFiles = processor.fileMap.allFiles;
		});


		it("populates descriptors", () => {
			//TODO test warnings and errors!
			console.debug('finished processing map');
			console.debug('warnings');
			console.debug(processor.warnings);
			console.debug('errors');
			console.debug(processor.errors);
			_.forOwn(processor.fileMap.allFiles, (v, k) => console.debug(v.toString()));

		});

		it("does not include excluded folders", () => {
			//TODO let config do this

			expect(allFiles).not.contain.keys([
				'test2.xml',
				'test2importsExcluded.xml',
				'test2importsExcluded.brs',
				'testExcluded.brs'
			]);

			console.debug('finished processing map - it contains');
			_.forOwn(processor.fileMap.allFiles, (v, k) => console.debug(v.toString()));

		});

		it("does not include other filetypes", () => {
			expect(_.some(allFiles, {'fileTYPE': 'OTHTER'})).to.be.false;
		});

		it("correctly identifies brs files", () => {
			expect(allFiles).containSubset({
				'Utils.brs': (v) => v.filename === 'Utils.brs' && v.fileType === 'BRS',
				'BadImport.brs': (v) => v.filename === 'BadImport.brs' && v.fileType === 'BRS',
				'FocusMixin.brs': (v) => v.filename === 'FocusMixin.brs' && v.fileType === 'BRS',
				'LogMixin.brs': (v) => v.filename === 'LogMixin.brs' && v.fileType === 'BRS',
				'MultipleMixin.brs': (v) => v.filename === 'MultipleMixin.brs' && v.fileType === 'BRS',
				'NetMixin.brs': (v) => v.filename === 'NetMixin.brs' && v.fileType === 'BRS',
				'TextMixin.brs': (v) => v.filename === 'TextMixin.brs' && v.fileType === 'BRS'
			});

		});


		it("correctly identifies xml files", () => {
			const f = allFiles['testXMLOnly.xml'];
			console.debug(f.fileType);
			expect(allFiles).containSubset({
				'testXMLOnly.xml': (v) => v.filename === 'testXMLOnly.xml' && v.fileType === 'XML'
			});
		});

		it("correctly identifies VIEWXML files", () => {
			expect(allFiles).containSubset({
				'test.xml': (v) => v.filename === 'test.xml' && v.fileType === 'VIEWXML',
				'test2imports.xml': (v) => v.filename === 'test2imports.xml' && v.fileType === 'VIEWXML',
				'testcascadingimports.xml': (v) => v.filename === 'testCascadingImports.xml' && v.fileType === 'VIEWXML',
				'testMissingImport.xml': (v) => v.filename === 'testMissingImport.xml' && v.fileType === 'VIEWXML',
			});
		});

		it("correctly identifies CODEBEHIND files", () => {
			expect(allFiles).containSubset({
				'test.brs': (v) => v.filename === 'test.brs' && v.fileType === 'CODEBEHIND',
				'test2imports.brs': (v) => v.filename === 'test2imports.brs' && v.fileType === 'CODEBEHIND',
				'testcascadingimports.brs': (v) => v.filename === 'testCascadingImports.brs' && v.fileType === 'CODEBEHIND',
				'testMissingImport.brs': (v) => v.filename === 'testMissingImport.brs' && v.fileType === 'CODEBEHIND',
			});
		});
	});
});
