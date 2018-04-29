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
		return this._requiredImports = [];
	}

	constructor(config, fileDescriptor, fileMap) {
		assert(fileDescriptor.fileType == FileType.CODEBEHIND, 'was given a non-codebehind file');
		this._fileDescriptor = fileDescriptor;
		this._requiredImports = [];
		this._config = config;
		this._fileMap = fileMap;
		this._codeBehindContents = fileDescriptor.getFileContents();
	}

	identifyImports(){
		//1. Get list of '@Import
		var codeBehindImportNames = this.getRegexMatchesValues(this._codeBehindContents, this._config.importRegex, 2);
		if (_.isEmpty(codeBehindImportNames)){
			return;
		}

		this._xmlContents = this._fileDescriptor.associatedFile.getFileContents();
		var xmlImports = this.getRegexMatchesValues(this._xmlContents, this._config.importXMLRegex, 3);
		//Tidy up xml import value
		xmlImports = xmlImports.map(i => path.basename(i));

		//get all nestedDependcies
		var allImportDescriptors = this.getAllImportDescriptors(this._fileDescriptor.filename, codeBehindImportNames);

		//remove anything that's already present in the xml file
		xmlImports.forEach(xmlImport =>{
			delete allImportDescriptors[xmlImport];
		});

		for(var key in allImportDescriptors){
			this._requiredImports.push(allImportDescriptors[key]);
		}
	}

	/**
	 * keeps
	 * @param importNames
	 */
	getAllImportDescriptors(rootFilename, importNames){
		var newImports = {};
		importNames.forEach(importName => {
			let dependencyNames = this._fileMap.getImportDependencies(importName);
			if (!dependencyNames){
				//look up the dependency, in the filemap
				dependencyNames = this.getNestedDependencies(rootFilename, importName);
				this._fileMap.setImportDependencies(rootFilename, dependencyNames);
			}

			dependencyNames.for(dependencyName => {
				assert(dependencyName != rootFilename, `cyclical dependency discovered for ${rootFilename}! ABORTING`);

				const descriptor = this._fileMap.getDescriptor(dependencyName);
				assert(descriptor, `missing dependency for ${dependencyName}! ABORTING`);
				newImports[dependencyName] = descriptor;
			});
		});
		return newImports;
	}

	addImportIncludes(){
		var imports = "";
		this._requiredImports.forEach(descriptor =>{
			imports += this._config.importTemplate.replace("$PATH$", descriptor.getPackagePath(this._fileMap.projectRoot))
		});
		var insertionIndex = 43; // TODO find location in file to put the import
		spliceString(this._xmlContents,insertionIndex,0, imports);
		imports.splice(insertionIndex, 0, imports);
	}

	getRegexMatchesValues(input, pattern, groupIndex){
		var values = [], matches = [];
		var regex = new RegExp(pattern, 'g');
		while (matches = regex.exec(input)) {
			values.push(matches[groupIndex]);
		}
		return values;
	}

	getNestedDependencies(dependencyName, dependencyNames = []) {
		const descriptor = this._fileMap.getDescriptor(dependencyName);
		assert(descriptor, `missing dependency for ${dependencyName}! ABORTING`);
		if (!dependencyNames.includes(dependencyName)){
			dependencyNames.push(dependencyName);
			var nestedDependencies = this.getRegexMatchesValues(descriptor.getFileContents(), this._config.importRegex, 2);
			nestedDependencies.forEach(nestedDependency => this.getNestedDependencies(nestedDependency, dependencyNames));
		}
		return dependencyNames;
	}

}


module.exports = IncludeImporter