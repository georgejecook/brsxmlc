const path = require('path');
const FileDescriptor = require('./fileDescriptor');
const ProjectFileMap = require('./ProjectFileMap');
const fs = require('fs');
const replaceExt = require('replace-ext');

class ProjectProcessor {
	get sourceFolder() {
		return this._sourceFolder;
	}

	get targetFolder() {
		return this._targetFolder;
	}

	constructor(sourceFolder, targetFolder) {
		this._sourceFolder = sourceFolder;
		this._targetFolder = targetFolder;
		this._fileMap = new ProjectFileMap();
	}

	async processFiles() {
		await this.copyFiles()
		this.createFileDescriptors(this.sourceFolder);
	}

	async copyFiles() {
		//TODO process while copying using the transform function
		//TODO use timestamps to skip files that don't require updates
		let result = await ncp(this.sourceFolder, this.targetFolder, function (err) {
			if (err) {
				return console.error(err);
			}
			console.log('done!');
		});
	}

	/**
	 * Find all files inside a dir, recursively and convert to fileDescriptors
	 * @function getAllFiles
	 * @param  {string} dir Dir directory string.
	 * @return {string[]} Array with all file names that are inside the directory.
	 */
	createFileDescriptors(directory) {

		//TODO - make async.
		//TODO - cachetimestamps for files - for performance
		fs.readdirSync(directory).forEach(filename => {
			if (fs.statSync(fullPath).isDirectory()) {
				this.createFileDescriptors(directory, filename);
			} else {
				if (this.allFiles[filename]) {
					console.writeln(`Warning - file ${directory} / ${filename} already has descriptor, skipping`);
				}
				this.createDescriptor(directory, filename, null);
			}
		};
	}


	/**
	 * Create desciptor for the given file -
	 * @param directory
	 * @param filename
	 * @param fullPath
	 * @param associatedFile if passed in, it will automatically be assigned to the descriptor, otherwise it is searched for
	 */
	createDescriptor(directory, filename, associatedFile) {
		const extension = path.extname(filename);
		const fileDescriptor = new FileDescriptor(directory, file, extension);

		if (associatedFile == null) {
			assoicatedFile = getAssociatedFile(directory, filename, extension);
		} else {
			associatedFile.associatedFile = fileDescriptor;
		}
		this.allFiles[filename] = fileDescriptor;

	}

	getAssociatedFile(directory, filename, extension) {
		if (extension != '.brs' || extension != '.xml') {
			return null;
		}
		const otherExtension = extension = '.brs' ? '.xml' : '.brs';
		otherFilename = replaceExt(filename, otherExtension);
		let descriptor = this.allFiles[otherFileName];
		if (!descriptor){
			descriptor = fs.existsSync(otherFullPath) ? new FileDescriptor(directory, otherFilename, otherExtension) : null;
			this.allFiles[otherFilename] = fileDescriptor;
		}
		return descriptor;
	}


}

module.exports = ProjectProcessor