import FileDescriptor from './FileDescriptor';

export default class ProjectFileMap {
  get importDependencies(): Map<string, string[]> {
    return this._importDependencies;
  }

  get projectRoot(): string {
    return this._projectRoot;
  }

  get allFiles(): Map<string, FileDescriptor> {
    return this._allFiles;
  }

  /**
   * For a given file, which has been listed as a dependency, will list ALL of the files it also depends on
   * @returns {{string[]}|*} - array of filenames of all dependncies
   */
  constructor(config, allFiles?: Map<string, FileDescriptor>, importDependencies?: Map<string, string[]>) {
    this._projectRoot = config.sourcePath;
    this._allFiles = allFiles || new Map<string, FileDescriptor>();
    this._importDependencies = importDependencies || new Map<string, string[]>();
  }

  private _projectRoot: string;
  private _allFiles: Map<string, FileDescriptor>;
  private _importDependencies: Map<string, string[]>;

  public getImportDependencies(filename): string[] {
    return this._importDependencies[filename];
  }

  public setImportDependencies(filename, dependencies: string[]) {
    this._importDependencies[filename] = dependencies;
  }

  public getDescriptor(filename): FileDescriptor {
    return this._allFiles[filename];
    // return this._allFiles[filename.endsWith('.brs') ? filename : filename + '.brs'];
  }

  public addDescriptor(fileDescriptor: FileDescriptor) {
    this._allFiles[fileDescriptor.filename] = fileDescriptor;
  }
}
