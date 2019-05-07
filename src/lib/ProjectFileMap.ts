import FileDescriptor from './FileDescriptor';
import { ProcessorConfig } from './ProcessorConfig';

export default class ProjectFileMap {
  /**
   * For a given file, which has been listed as a dependency, will list ALL of the files it also depends on
   * @returns {{string[]}|*} - array of filenames of all dependncies
   */
  constructor(config: ProcessorConfig, allFiles?: Map<string, FileDescriptor>, importDependencies?: Map<string, string[]>) {
    this._projectRoot = config.rootPath;
    this._allFiles = allFiles || new Map<string, FileDescriptor>();
    this._importDependencies = importDependencies || new Map<string, string[]>();
  }

  private _projectRoot: string;
  private _allFiles: Map<string, FileDescriptor>;
  private _importDependencies: Map<string, string[]>;

  get importDependencies(): Map<string, string[]> {
    return this._importDependencies;
  }

  get projectRoot(): string {
    return this._projectRoot;
  }

  get allFiles(): Map<string, FileDescriptor> {
    return this._allFiles;
  }

  public getImportDependenciesForFile(filename): string[] {
    return this._importDependencies[filename];
  }

  public getAllDescriptors(): FileDescriptor[] {
    return [...this._allFiles.values()];
  }

  public setImportDependenciesForFile(filename, dependencies: string[]) {
    this._importDependencies[filename] = dependencies;
  }

  public getDescriptor(filename): FileDescriptor {
    return this._allFiles[filename];
  }

  public addDescriptor(fileDescriptor: FileDescriptor) {
    this._allFiles[fileDescriptor.filename] = fileDescriptor;
  }
}
