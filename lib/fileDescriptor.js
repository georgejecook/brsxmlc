"use strict";
var fs = require('fs');
const FileType = require('./fileType');
const DirectiveType = require('./directiveType');


class FileDescriptor {

	constructor (fullPath, fileName, extension) {
		this._name = fileName;
		this._path = fullPath;
		this.extension = extension;
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

	get fullPath() {
		return this._path;
	}

	get name() {
		return this._name;
	}

	toString () {
		return `${this.name} | ${this.protein}g P :: ${this.carbs}g C :: ${this.fat}g F`
	}

	print () {
		console.log( this.toString() );
	}
}

module.exports = FileDescriptor