"use strict";
const fs = require('fs');
const FileType = require('./fileType');
const DirectiveType = require('./directiveType');
const path = require('path');


class FileDescriptor {
	get extension() {
		return this._extension;
	}

	constructor (directory, filename, extension) {
		this._filename = filename;
		this._directory = directory;
		this._extension = extension;
		this._currentImportIds = []; //array of ids
		this._requireImportIds = []; //array of ids
		this._associatedFile = null;
	}

	get requireImportIds() {
		return this._requireImportIds;
	}

	get currentImportIds() {
		return this._currentImportIds;
	}

	get associatedFile() {
		return this._associatedFile;
	}
	set associatedFile(associatedFile) {
		this._associatedFile = associatedFile;
	}

	get fileType() {
		switch (this.extension.toLowerCase()){
			case '.brs':
				return this.associatedFile ? FileType.CODEBEHIND : FileType.BRS;
				break;
			case '.xml':
				return this.associatedFile ? FileType.VIEWXML : FileType.XML;
				break;
			default:
				return FileType.OTHER;
		}
	}

	get directory() {
		return this._directory;
	}

	get filename() {
		return this._filename;
	}

	get isMixin() {
		return this._filename.endsWith("Mixin");
	}

	get fullPath() {
		return path.join(this._directory, this._filename);
	}

	getPackagePath(projectRoot) {
		//TODO - remove projectRoot from directory, and replace with :pkg
		return path.join(this._directory, this._filename);
	}

	getFileContents() {
		if (this._fileContents == null){
			this._fileContents = fs.readFileSync(this.fullPath, 'utf8');
		}
		return this._fileContents;
	}

	setFileContents(contents) {
		this._fileContents = contents;
	}

	saveFileContents() {
		fs.writeFileSync(this.fullPath, contents,'utf8');
	}

	unloadContents() {
		this._fileContents = null;
	}


	toString () {
		return `DESCRIPTOR: ${this.filename} TYPE ${this.fileType} PATH ${this.fullPath}`;
	}

	print () {
		console.log( this.toString() );
	}
}

module.exports = FileDescriptor;