import FileDescriptor from './FileDescriptor';
import { ProcessorConfig } from './ProcessorConfig';

export default class ProjectFileMap {
  /**
   * For a given file, which has been listed as a dependency, will list ALL of the files it also depends on
   * @returns {{string[]}|*} - array of filenames of all dependncies
   */
  constructor(config: ProcessorConfig, allFiles?: Map<string, FileDescriptor>, filesByPkgPath?: Map<string, FileDescriptor>) {
    this._projectRoot = config.rootPath;
    this._allFiles = allFiles || new Map<string, FileDescriptor>();
    this._filesByPkgPath = allFiles || new Map<string, FileDescriptor>();
  }

  private _projectRoot: string;
  private _allFiles: Map<string, FileDescriptor>;
  private _filesByPkgPath: Map<string, FileDescriptor>;

  get projectRoot(): string {
    return this._projectRoot;
  }

  get allFiles(): Map<string, FileDescriptor> {
    return this._allFiles;
  }

  public getAllDescriptors(): FileDescriptor[] {
    return [...this._allFiles.values()];
  }

  public getDescriptor(fullPath): FileDescriptor {
    return this._allFiles.get(fullPath);
  }
  public getDescriptorByPkgPath(pkgPath): FileDescriptor {
    return this._filesByPkgPath.get(pkgPath);
  }

  public addDescriptor(fileDescriptor: FileDescriptor) {
    this._allFiles.set(fileDescriptor.fullPath, fileDescriptor);
    this._filesByPkgPath.set(fileDescriptor.pkgPath, fileDescriptor);
  }
}
