import ProjectFileMap from './ProjectFileMap';

import * as path from 'path';

import { Minimatch } from 'minimatch';

import FileDescriptor from './FileDescriptor';

import * as fs from "fs-extra";

import * as Debug from 'debug';
import * as M from 'minimatch';
import { changeExtension } from "./changeExtension";

const debug = Debug('projectProcessor');

export default class ProjectProcessor {
  get errors(): any[] {
    return this._errors;
  }
  get warnings(): any[] {
    return this._warnings;
  }
  get config(): object {
    return this._config;
  }
  get fileMap(): ProjectFileMap {
    return this._fileMap;
  }
  get targetFolder(): string {
    return this._targetFolder;
  }
  get sourceFolder(): string {
    return this._sourceFolder;
  }
  constructor(sourceFolder, targetFolder, fileMap, config) {
    this._config = config;
    this._sourceFolder = sourceFolder;
    this._targetFolder = targetFolder;
    this._fileMap = fileMap || new ProjectFileMap(this._sourceFolder);
    this._warnings = [];
    this._errors = [];
    this.excludeMatcher = new Minimatch(config.exclude);
  }

  private _config: object;
  private _sourceFolder: string;
  private _targetFolder: string;
  private _fileMap: ProjectFileMap;
  private _warnings: any[];
  private _errors: any[];
  private excludeMatcher: M.IMinimatch;


  processFiles() {
    debug(`Running processor at path ${this._targetFolder} `);

    this.clearFiles();
    this.copyFiles()
    this.createFileDescriptors(this._sourceFolder);
  }

  copyFiles() {
    try {
      fs.copySync(this._sourceFolder, this._targetFolder);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Find all files inside a dir, recursively and convert to fileDescriptors
   * @function getAllFiles
   * @param  {string} dir Dir directory string.
   * @return {string[]} Array with all file names that are inside the directory.
   */
  createFileDescriptors(directory) {
    debug(`Creating file descriptors processor at path ${directory} `);
    //TODO - make async.
    //TODO - cachetimestamps for files - for performance
    fs.readdirSync(directory).forEach(filename => {
      const fullPath = path.join(directory, filename);
      if (fs.statSync(fullPath).isDirectory()) {
        this.createFileDescriptors(fullPath);
      } else {
        const extension = path.extname(filename).toLowerCase();
        if (extension == '.brs' || extension == '.xml') {
          if (this._fileMap.getDescriptor[filename]) {
            this._warnings.push(`file ${directory}/${filename} already has descriptor, skipping`);
          }
          this.createDescriptor(directory, filename, null);
        }
      }
    });
  }


  /**
   * Create desciptor for the given file -
   * @param directory
   * @param filename
   * @param assoicatedFile
   */
  createDescriptor(directory, filename, assoicatedFile) {
    if (this.excludeMatcher.match(directory)) {
      this._warnings.push[`skipping excluded path ${path}`];
      return;
    }

    const extension = path.extname(filename);
    const fileDescriptor = new FileDescriptor(directory, filename, extension);

    if (assoicatedFile == null) {
      assoicatedFile = this.getAssociatedFile(directory, filename, extension);
    }

    fileDescriptor.associatedFile = assoicatedFile;
    if (assoicatedFile != null) {
      assoicatedFile.associatedFile = fileDescriptor;
    }
    this._fileMap.addDescriptor(fileDescriptor);
  }

  getAssociatedFile(directory, filename, extension) {
    if (extension != '.brs' && extension != '.xml') {
      return null;
    }
    const otherExtension = extension === '.brs' ? '.xml' : '.brs';
    const otherFilename = changeExtension(filename, otherExtension);
    let descriptor = this._fileMap.getDescriptor(otherFilename);
    if (!descriptor) {
      const otherFullPath = path.join(directory, otherFilename);
      descriptor = fs.existsSync(otherFullPath) ? new FileDescriptor(directory, otherFilename, otherExtension) : null;
      if (descriptor) {
        this._fileMap.addDescriptor(descriptor);
      }
    }
    return descriptor;
  }


  clearFiles() {
    fs.removeSync(this._targetFolder);
  }
}

module.exports = ProjectProcessor