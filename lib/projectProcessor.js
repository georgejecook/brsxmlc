var path = require('path')
var FileDescriptor = require('./fileDescriptor');
const fs = require('fs');
var replaceExt = require('replace-ext');

class ProjectProcessor {
	get allFiles() {
		return this._allFiles;
	}

	get sourceFolder() {
		return this._sourceFolder;
	}

	get targetFolder() {
		return this._targetFolder;
	}

	constructor(sourceFolder, targetFolder) {
		this._sourceFolder = sourceFolder;
		this._targetFolder = targetFolder;
		this._allFiles = {};
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
	 * @param  {string} dir Dir fullPath string.
	 * @return {string[]} Array with all file names that are inside the directory.
	 */
	createFileDescriptors(directory) {

		//TODO - make async.
		//TODO - cachetimestamps for files - for performance
		fs.readdirSync(directory).forEach(file => {
			const fullPath = path.join(directory, file);
			if (fs.statSync(fullPath).isDirectory()) {
				this.createFileDescriptors(fullPath);
			} else {
				if (this.allFiles[file]) {
					console.writeln(`Warning - file ${fullPath} already has descriptor, skipping`);
				}
				this.createDescriptor(directory, file, fullPath);
			}
		};
	}


	/**
	 * Create desciptor for the given file -
	 * @param directory
	 * @param fileName
	 * @param fullPath
	 * @param associatedFile if passed in, it will automatically be assigned to the descriptor, otherwise it is searched for
	 */
	createDescriptor(fileName, fullPath, associatedFile) {
		const extension = path.extname(fileName);
		const fileDescriptor = new FileDescriptor(fileName, fullPath, extension);

		if (associatedFile == null) {
			assoicatedFile = getAssociatedFile(fullPath, fileName, extension);
		} else {
			associatedFile.associatedFile = fileDescriptor;
		}
		this.allFiles[fileName] = fileDescriptor;

	}

	getAssociatedFile(directory, fileName, fullPath, extension) {
		if (extension != '.brs' || extension != '.xml') {
			return null;
		}
		const otherExtension = extension = '.brs' ? '.xml' : '.brs';
		otherFileName = replaceExt(fileName otherExtension);
		otherFullPath = replaceExt(fullPath, otherExtension);
		let descriptor = this.allFiles[otherFileName];
		if (!descriptor){
			descriptor = fs.existsSync(otherFullPath) ? new FileDescriptor(otherFileName, otherFullPath, otherExtension) : null;
			this.allFiles[otherFileName] = fileDescriptor;
		}
		return descriptor;
	}


	print() {
		console.log(this.toString());
	}

}

module.exports = ProjectProcessor