
import * as Debug from 'debug';
import * as fs from 'fs-extra';
import { Minimatch } from 'minimatch';
import * as M from 'minimatch';
import * as path from 'path';

import FileDescriptor from './FileDescriptor';
import ProjectFileMap from './ProjectFileMap';

import { changeExtension } from './changeExtension';
const debug = Debug('projectProcessor');

export default class ProjectProcessor {
  constructor(config, fileMap?: ProjectFileMap) {
    this._config = config;
    if (!config.sourcePath) {
      throw new Error('Config does not contain sourcePath property');
    }
    if (!config.targetPath) {
      throw new Error('Config does not contain targetPath property');
    }
    this._sourcePath = config.sourcePath;
    this._targetPath = config.targetPath;
    this._fileMap = fileMap || new ProjectFileMap(this._sourcePath);
    this._warnings = [];
    this._errors = [];
    this.excludeMatcher = new Minimatch(config.exclude);
  }

  private readonly _config: object;
  private readonly _sourcePath: string;
  private readonly _targetPath: string;
  private readonly _fileMap: ProjectFileMap;
  private readonly _warnings: string[];
  private readonly _errors: string[];
  private excludeMatcher: M.IMinimatch;

  get errors(): string[] {
    return this._errors;
  }

  get warnings(): string[] {
    return this._warnings;
  }

  get config(): object {
    return this._config;
  }

  get fileMap(): ProjectFileMap {
    return this._fileMap;
  }

  get targetPath(): string {
    return this._targetPath;
  }

  get sourcePath(): string {
    return this._sourcePath;
  }

  public processFiles() {
    debug(`Running processor at path ${this._targetPath} `);

    this.clearFiles();
    this.copyFiles();
    this.createFileDescriptors(this._sourcePath);
  }

  public copyFiles() {
    try {
      fs.copySync(this._sourcePath, this._targetPath);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Find all files inside a dir, recursively and convert to fileDescriptors
   * @function getAllFiles
   * @return {string[]} Array with all file names that are inside the directory.
   * @param directory
   */
  public createFileDescriptors(directory?: string) {
    directory = directory || this._sourcePath;

    debug(`Creating file descriptors processor at path ${directory} `);
    //TODO - make async.
    //TODO - cachetimestamps for files - for performance
    fs.readdirSync(directory).forEach((filename) => {
      const fullPath = path.join(directory, filename);
      if (fs.statSync(fullPath).isDirectory()) {
        this.createFileDescriptors(fullPath);
      } else {
        const extension = path.extname(filename).toLowerCase();
        if (extension === '.brs' || extension === '.xml') {
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
  public createDescriptor(directory, filename, assoicatedFile) {
    if (this.excludeMatcher.match(directory)) {
      this._warnings.push(`skipping excluded path ${path}`);
      return;
    }

    const extension = path.extname(filename);
    const fileDescriptor = new FileDescriptor(directory, filename, extension);

    if (assoicatedFile === null) {
      assoicatedFile = this.getAssociatedFile(directory, filename, extension);
    }

    fileDescriptor.associatedFile = assoicatedFile;
    if (assoicatedFile !== null) {
      assoicatedFile.associatedFile = fileDescriptor;
    }
    this._fileMap.addDescriptor(fileDescriptor);
  }

  public getAssociatedFile(directory, filename, extension) {
    if (extension !== '.brs' && extension !== '.xml') {
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

  public clearFiles() {
    fs.removeSync(this._targetPath);
  }
}
