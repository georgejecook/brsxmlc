const path = require('path');
const FileDescriptor = require('./fileDescriptor');
const ProjectFileMap = require('./ProjectFileMap');
const fs = require('fs-extra');
const replaceExt = require('replace-ext');
const debug = require('debug')('projectProcessor');

class ProjectProcessor {
	get config() {
		return this._config;
	}
	get errors() {
		return this._errors;
	}

	get warnings() {
		return this._warnings;
	}

	get fileMap() {
		return this._fileMap;
	}

	get sourceFolder() {
		return this._sourceFolder;
	}

	get targetFolder() {
		return this._targetFolder;
	}

	constructor(sourceFolder, targetFolder, fileMap, config) {
		this._config = config;
		this._sourceFolder = sourceFolder;
		this._targetFolder = targetFolder;
		this._fileMap = fileMap || new ProjectFileMap();
		this._warnings = [];
		this._errors = [];
	}

	processFiles() {
		debug(`Running processor at path ${this._targetFolder} `);

		this.clearFiles();
		this.copyFiles()
		this.createFileDescriptors(this.sourceFolder);
	}

	copyFiles() {
		try {
			fs.copySync(this.sourceFolder, this.targetFolder);
		} catch (err) {
			console.error(err);
		}
	}

	/**
	 * Find all files inside a dir, recursively and convert to fileDescriptors
	 * @function getAllFiles
	 * @param  {string} dir Dir directory string.
	 * @return {string[]} Array with all file names that are inside the directory.
	 */
	createFileDescriptors(directory) {
		// debug(`Creating file descriptors processor at path ${directory} `);
		console.debug(`Creating file descriptors processor at path ${directory} `);
		//TODO - make async.
		//TODO - cachetimestamps for files - for performance
		fs.readdirSync(directory).forEach(filename => {
			const fullPath = path.join(directory, filename);
			if (fs.statSync(fullPath).isDirectory()) {
				this.createFileDescriptors(fullPath);
			} else {
				const extension = path.extname(filename).toLowerCase();
				if (extension == '.brs' || extension == '.xml') {
					if (this.fileMap.allFiles[filename]) {
						this._warnings.push(`file ${directory}/${filename} already has descriptor, skipping`);
					}
					this.createDescriptor(directory, filename, null);
				}
			}
		});
	}


	/**
	 * Create desciptor for the given file -
	 * @param directory
	 * @param filename
	 * @param assoicatedFile
	 */
	createDescriptor(directory, filename, assoicatedFile) {
		for(let i = 0; i < this.config.excludedFolders.length; i++){
			if (directory.endsWith(this.config.excludedFolders[i])){
				this.warnings.push[`skipping excluded path ${path}`];
				return;
			}
		}

		const extension = path.extname(filename);
		const fileDescriptor = new FileDescriptor(directory, filename, extension);

		if (assoicatedFile == null) {
			assoicatedFile = this.getAssociatedFile(directory, filename, extension);
		}

		fileDescriptor.associatedFile = assoicatedFile;
		if (assoicatedFile != null) {
			assoicatedFile.associatedFile = fileDescriptor;
		}
		this.fileMap.allFiles[filename] = fileDescriptor;

	}

	getAssociatedFile(directory, filename, extension) {
		if (extension != '.brs' && extension != '.xml') {
			return null;
		}
		const otherExtension = extension === '.brs' ? '.xml' : '.brs';
		const otherFilename = replaceExt(filename, otherExtension);
		let descriptor = this.fileMap.allFiles[otherFilename];
		if (!descriptor) {
			const otherFullPath = path.join(directory, otherFilename);
			descriptor = fs.existsSync(otherFullPath) ? new FileDescriptor(directory, otherFilename, otherExtension) : null;
			if (descriptor){
				this.fileMap.allFiles[otherFilename] = descriptor;
			}
		}
		return descriptor;
	}


	clearFiles() {
		fs.removeSync(this._targetFolder);
	}
}

module.exports = ProjectProcessor