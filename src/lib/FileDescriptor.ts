import * as fs from 'fs';
import * as path from 'path';

import { FileType } from './FileType';

/**
 * describes a file in our project.
 */
export default class FileDescriptor {

  constructor(directory, filename, extension) {
    this.filename = filename;
    this.directory = directory;
    this.extension = extension;
    this.currentImportIds = [];
    this.requireImportIds = [];
    this._requiredImports = [];
    this.associatedFile = null;
  }

  public filename: string;
  public directory: string;
  public extension: string;
  public currentImportIds: string[];
  public requireImportIds: string[];
  public _requiredImports: FileDescriptor[];
  public associatedFile?: FileDescriptor;

  private _fileContents: string;

  get fileType(): FileType {
    switch (this.extension.toLowerCase()) {
      case '.brs':
        return this.associatedFile ? FileType.CodeBehind : FileType.Brs;
      case '.xml':
        return this.associatedFile ? FileType.ViewXml : FileType.Xml;
      default:
        return FileType.Other;
    }
  }

  public get isMixin() {
    return this.filename.endsWith('Mixin');
  }

  public get requiredImports(): FileDescriptor[] {
    return this._requiredImports;
  }

  public get fullPath() {
    return path.join(this.directory, this.filename);
  }

  public getPackagePath(projectRoot: string, cwd: string) {
    let pkgPath = `pkg:${this.fullPath.replace(projectRoot, '')}`;
    pkgPath = pkgPath.replace(cwd, '');
    return pkgPath.replace('pkg://', 'pkg:/');
  }

  public get normalizedFileName() {
    return this.filename.replace('.brs', '').replace('-', '_').replace('.', '_');
  }

  public get normalizedFullFileName() {
    return this.fullPath.replace('/', '_') + this.normalizedFileName;
  }

  public getFileContents(): string {
    if (!this._fileContents) {
      this._fileContents = fs.readFileSync(this.fullPath, 'utf8');
    }
    return this._fileContents;
  }

  public setFileContents(fileContents: string) {
    this._fileContents = fileContents;
  }

  public saveFileContents() {
    fs.writeFileSync(this.fullPath, this._fileContents, 'utf8');
  }

  public unloadContents() {
    this._fileContents = null;
  }

  public toString(): string {
    return `DESCRIPTOR: ${this.filename} TYPE ${this.fileType} PATH ${this.fullPath}`;
  }

}
