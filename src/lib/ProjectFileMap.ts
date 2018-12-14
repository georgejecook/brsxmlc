import FileDescriptor from "./FileDescriptor";

export default class ProjectFileMap {
  get importDependencies(): {} {
    return this._importDependencies;
  }
  get projectRoot(): string {
    return this._projectRoot;
  }
  get allFiles(): {} {
    return this._allFiles;
  }
	/**
	 * For a given file, which has been listed as a dependency, will list ALL of the files it also depends on
	 * @returns {{string[]}|*} - array of filenames of all dependncies
	 */
	constructor(projectRoot, allFiles = {}, importDependencies = {}) {
		this._projectRoot = projectRoot;
		this._allFiles = allFiles;
		this._importDependencies = importDependencies;
	}

  private _projectRoot: string;
  private _allFiles: {};
  private _importDependencies: {};

	public getImportDependencies(filename) {
		return this._importDependencies[filename];
	}

	public setImportDependencies(filename, dependencies = []) {
		this._importDependencies[filename] = dependencies;
	}

	public getDescriptor(filename) {
		return this._allFiles[filename.endsWith('.brs') ? filename : filename + '.brs'];
	}

  addDescriptor(fileDescriptor: FileDescriptor) {
    this._allFiles[fileDescriptor.filename] = fileDescriptor;
  }
}