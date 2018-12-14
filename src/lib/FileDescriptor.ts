"use strict";
import * as fs from "fs";

import { FileType } from "./FileType";

import { DirectiveType } from "./DirectiveType";

import * as path from 'path';

export default class FileDescriptor {

  constructor(directory, filename, extension) {
    this.filename = filename;
    this.directory = directory;
    this.extension = extension;
    this.currentImportIds = []; //array of ids
    this.requireImportIds = []; //array of ids
    this.associatedFile = null;
  }

  public filename: string;
  public directory: string;
  public extension: string;
  public currentImportIds: string[];
  public requireImportIds: string[];
  public associatedFile?: FileDescriptor;

  private _fileContents: string;

  get fileType() : FileType {
    switch (this.extension.toLowerCase()) {
      case '.brs':
        return this.associatedFile ? FileType.CODEBEHIND : FileType.BRS;
      case '.xml':
        return this.associatedFile ? FileType.VIEWXML : FileType.XML;
      default:
        return FileType.OTHER;
    }
  }

  public get isMixin() {
    return this.filename.endsWith("Mixin");
  }

  public get fullPath() {
    return path.join(this.directory, this.filename);
  }

  public getPackagePath(projectRoot) {
    //TODO - remove projectRoot from directory, and replace with :pkg
    return path.join(this.directory, this.filename);
  }

  public getFileContents() {
    if (this._fileContents == null) {
      this._fileContents = fs.readFileSync(this.fullPath, 'utf8');
    }
    return this._fileContents;
  }

  public saveFileContents() {
    fs.writeFileSync(this.fullPath, this._fileContents, 'utf8');
  }

  public unloadContents() {
    this._fileContents = null;
  }


  toString() {
    return `DESCRIPTOR: ${this.filename} TYPE ${this.fileType} PATH ${this.fullPath}`;
  }

  print() {
    console.log(this.toString());
  }
}

module.exports = FileDescriptor;