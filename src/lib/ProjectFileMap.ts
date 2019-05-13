import File from './File';
import Namespace from './NameSpace';
import { ProcessorConfig } from './ProcessorConfig';

export default class ProjectFileMap {
  /**
   * For a given file, which has been listed as a dependency, will list ALL of the files it also depends on
   * @returns {{string[]}|*} - array of filenames of all dependncies
   */
  constructor() {
    this._allFiles = new Map<string, File>();
    this._filesByPkgPath = new Map<string, File>();
    this._namespacesByName = new Map<string, Namespace>();
  }

  private _allFiles: Map<string, File>;
  private _filesByPkgPath: Map<string, File>;
  private _namespacesByName: Map<string, Namespace>;

  get allFiles(): Map<string, File> {
    return this._allFiles;
  }

  get filesByPkgPath(): Map<string, File> {
    return this._filesByPkgPath;
  }

  get allNamespaces(): Map<string, Namespace> {
    return this._namespacesByName;
  }

  public getAllFiles(): File[] {
    return [...this._allFiles.values()];
  }

  public getFile(fullPath: string): File {
    return this._allFiles.get(fullPath);
  }

  public getFileByPkgPath(pkgPath: string): File {
    return this._filesByPkgPath.get(pkgPath);
  }

  public getNamespaceByName(name: string): Namespace {
    return this._namespacesByName.get(name);
  }

  public getFileByNamespaceName(name: string): File {
    const namespace = this.getNamespaceByName(name);
    return namespace ? namespace.file : null;
  }

  public addFile(file: File) {
    this._allFiles.set(file.fullPath, file);
    this._filesByPkgPath.set(file.pkgPath, file);
    if (file.namespace) {
      this._namespacesByName.set(file.namespace.name, file.namespace);
    }
  }
}
