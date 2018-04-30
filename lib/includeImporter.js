"use strict";
const FileType = require('./fileType');
const DirectiveType = require('./directiveType');
const assert = require('assert');
const path = require('path');
const _ = require('lodash');
const spliceString = require('splice-string');

/**
 * Manages importing includes for a given brs file
 */
class IncludeImporter {
	get requiredImports() {
		return this._requiredImports;
	}

	constructor(config, fileDescriptor, projectProcessor) {
		if (fileDescriptor.fileType != FileType.CODEBEHIND && fileDescriptor.fileType != FileType.BRS){
			throw new Error('was given a non-codebehind / BRS file');
		}
		this._fileDescriptor = fileDescriptor;
		this._requiredImports = [];
		this._config = config;
		this._fileMap = projectProcessor.fileMap;
		this._projectProcessor = projectProcessor;
		this._errors = projectProcessor._errors;
		this._warnings = projectProcessor._warnings;
		this._codeBehindContents = fileDescriptor.getFileContents();
	}

	identifyImports(){
		//1. Get list of '@Import
		const codeBehindImportNames = this.getRegexMatchesValues(this._codeBehindContents, this._config.importRegex, 2);
		if (_.isEmpty(codeBehindImportNames)){
			return;
		}

		let xmlImports = [];
		if (this._fileDescriptor.fileType == FileType.CODEBEHIND){
			//check if the xml file associated with this descriptor already has any of the imports
			this._xmlContents = this._fileDescriptor.associatedFile.getFileContents();
			xmlImports = this.getRegexMatchesValues(this._xmlContents, this._config.importXMLRegex, 3);
			xmlImports = xmlImports.map(i => path.basename(i));
		}

		//get all nestedDependcies
		const allImportDescriptors = this.getAllImportDescriptors(this._fileDescriptor.filename, codeBehindImportNames);

		//remove anything that's already present in the xml file
		xmlImports.forEach(xmlImport =>{
			delete allImportDescriptors[xmlImport];
		});

		for(const key in allImportDescriptors){
			this._requiredImports.push(allImportDescriptors[key]);
		}
	}

	/**
	 * keeps
	 * @param importNames
	 */
	getAllImportDescriptors(rootFilename, importNames){
		const newImports = {};
		importNames.forEach(importName => {
			let dependencyNames = this._fileMap.getImportDependencies(importName);
			if (!dependencyNames){
				//look up the dependency, in the filemap
				dependencyNames = this.getNestedDependencies(rootFilename, importName);
				this._fileMap.setImportDependencies(rootFilename, dependencyNames);
			}

			dependencyNames.forEach(dependencyName => {
				if (dependencyName == rootFilename){
					throw new Error(`cyclical dependency discovered for ${rootFilename}! ABORTING`);
				}

				const descriptor = this._fileMap.getDescriptor(dependencyName);
				if (!descriptor){
					throw new Error(`[${rootFilename}] has missing dependency for ${dependencyName}! ABORTING`);
				}

				newImports[dependencyName] = descriptor;
			});
		});
		return newImports;
	}

	/**
	 * Responsible for updating the codebehind and xml files with the required imports
	 */
	addImportIncludes() {
		//for viewxml/codebehind files, we add the imports to xml - for pure brs files that's a moot point
		if (this._fileDescriptor.fileType == FileType.CODEBEHIND) {
			addImportIncludesToXML();
		}

		//for xml/brs files, we need to add to the init method
		addMixinInitializersToBRSInit();
	}

	/**
	 * We need a means to hook our mixins into our code. We use a special tag '@MixinInit
	 * to allow us to replace ONE LINE of code, and then put the actual mixin init methods in a method at the end of the file
	 * this prevents us from screwing up the line numbering in the event of an error.
	 */
	addMixinInitializersToBRSInit() {
		//TODO - note
		//1. Check that brs file has Mixin placeholder call '@Mixin'
			//if not - error
		//replace with __CallMixinInits() method
		//2. create __CallMixinInits() method
			//for each import, if it's a mixin, add a call to it there
	}

	addImportIncludesToXML(){
		let imports = "";
		this._requiredImports.forEach(descriptor =>{
			imports += '\n' + this._config.importTemplate.replace('$PATH$', descriptor.getPackagePath(this._fileMap.projectRoot))
		});

		//we place imports at the end of the file to ensure we don't screw up error line number reporting

		const insertionIndex = 43; //TODO - get the end tag location, and put it on the line before
		spliceString(this._xmlContents,insertionIndex,0, imports);
		 imports.splice(insertionIndex, 0, imports);
	}

	getRegexMatchesValues(input, pattern, groupIndex){
		let values = [], matches = [];
		const regex = new RegExp(pattern, 'g');
		while (matches = regex.exec(input)) {
			values.push(matches[groupIndex]);
		}
		return values;
	}

	getNestedDependencies(filename, dependencyName, dependencyNames = []) {
		const descriptor = this._fileMap.getDescriptor(dependencyName);
		if (!descriptor){
			throw new Error(`[${filename}] has missing dependency for ${dependencyName}! ABORTING`);
		}
		if (!dependencyNames.includes(dependencyName)){
			dependencyNames.push(dependencyName);
			const nestedDependencies = this.getRegexMatchesValues(descriptor.getFileContents(), this._config.importRegex, 2);
			nestedDependencies.forEach(nestedDependency => this.getNestedDependencies(filename + "." + dependencyName, nestedDependency, dependencyNames));
		}
		return dependencyNames;
	}

}


module.exports = IncludeImporter;