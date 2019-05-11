import * as fs from 'fs';
import * as path from 'path';

import { BrsFile } from 'brightscript-language';
import { XmlFile } from 'brightscript-language';
import { FileType } from './FileType';

/**
 * describes a file in our project.
 */
export default class FileDescriptor {

  constructor(fsPath: string, projectPath: string, filename: string, extension: string) {
    this.filename = filename;
    this._fsPath = fsPath;
    this._fullPath = path.join(fsPath, filename);
    this._pkgPath = path.join(projectPath, filename);
    this._pkgUri = `pkg://${path.join(projectPath, filename)}`;
    this.projectPath = projectPath;
    this.extension = extension;
    this.currentImportIds = [];
    this.requireImportIds = [];
    this._requiredImports = [];
    this.associatedFile = null;
    this.parentFile = null;
  }

  public filename: string;
  private _fsPath: string;
  private _pkgPath: string;
  private _pkgUri: string;
  private _fullPath: string;
  public projectPath: string;
  public extension: string;
  public currentImportIds: string[];
  private requireImportIds: string[];
  private _requiredImports: FileDescriptor[];
  public associatedFile?: FileDescriptor;
  public parentFile?: FileDescriptor;
  public programFile: XmlFile | BrsFile;

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

  public get fsPath() {
    return this._fsPath;
  }

  public get requiredImports(): FileDescriptor[] {
    return this._requiredImports;
  }

  public get fullPath() {
    return this._fullPath;
  }

  public get pkgPath() {
    return this._pkgPath;
  }

  public get pkgUri() {
    return this._pkgUri;
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
