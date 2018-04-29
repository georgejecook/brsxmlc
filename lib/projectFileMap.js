var path = require('path')
var FileDescriptor = require('./fileDescriptor');
const fs = require('fs');
var replaceExt = require('replace-ext');

class ProjectFileMap {
	get projectRoot() {
		return this._projectRoot;
	}

	/**
	 * For a given file, which has been listed as a dependency, will list ALL of the files it also depends on
	 * @returns {{string[]}|*} - array of filenames of all dependncies
	 */
	get importDependencies() {
		return this._importDependencies;
	}
	get allFiles() {
		return this._allFiles;
	}

	constructor(projectRoot, allFiles = {}, importDependencies = {}){
		this._projectRoot = projectRoot;
		this._allFiles = allFiles;
		this._importDependencies = importDependencies;
	}

	getImportDependencies(filename){
		return this.importDependencies[filename];
	}

	setImportDependencies(filename, dependencies = []){
		this.importDependencies[filename, dependencies];
	}

	getDescriptor(filename){
		return this.allFiles[filename];
	}
}



module.exports = ProjectFileMap;