import * as Debug from 'debug';
import * as fs from 'fs-extra';
import * as path from 'path';

import { inspect } from 'util';

import FileDescriptor from './FileDescriptor';
import ProjectFileMap from './ProjectFileMap';

import { changeExtension } from './changeExtension';
import { FileFeedback, FileFeedbackType } from './FileFeedback';
import { FileType } from './FileType';
import IncludeImporter from './IncludeImporter';
import { ProcessorConfig } from './ProcessorConfig';
import { ProcessorSettings } from './ProcessorSettings';

const debug = Debug('projectProcessor');

export class ProjectProcessor {
  constructor(config: ProcessorConfig, fileMap?: ProjectFileMap) {
    this._config = config;
    if (!config.sourcePath) {
      throw new Error('Config does not contain sourcePath property');
    }
    if (!config.outputPath) {
      throw new Error('Config does not contain outputPath property');
    }
    this._fileMap = fileMap || new ProjectFileMap(this.config);
    this._feedback = [];
    this._settings = new ProcessorSettings();
  }

  private readonly _config: ProcessorConfig;
  private readonly _fileMap: ProjectFileMap;
  private readonly _settings: ProcessorSettings;
  private readonly _feedback: FileFeedback[];

  get feedback(): FileFeedback[] {
    return this._feedback;
  }

  get errors(): FileFeedback[] {
    return this._feedback.filter((feedback) => feedback.feedbackType === FileFeedbackType.Error);
  }

  get warnings(): FileFeedback[] {
    return this._feedback.filter((feedback) => feedback.feedbackType === FileFeedbackType.Warning);
  }

  get infos(): FileFeedback[] {
    return this._feedback.filter((feedback) => feedback.feedbackType === FileFeedbackType.Info);
  }

  get config(): ProcessorConfig {
    return this._config;
  }

  get settings(): ProcessorSettings {
    return this._settings;
  }

  get fileMap(): ProjectFileMap {
    return this._fileMap;
  }

  public processFiles() {
    debug(`Running processor with config ${inspect(this.config)} `);

    this.clearFiles();
    this.copyFiles();
    this.createFileDescriptors();
    //TODO - process bindings
    // - which will automatically add binding imports
    this.processImports();

  }

  public processImports() {
    debug(`Processing imports `);
    let includeImporter = new IncludeImporter(this);
    this.fileMap.getAllDescriptors().forEach((descriptor) => {
      if (descriptor.fileType === FileType.CodeBehind) {
        includeImporter.identifyImports(descriptor);
        includeImporter.addImportIncludes(descriptor);
      }
    });
  }

  public copyFiles() {
    try {
      fs.copySync(this.config.sourcePath, this.config.outputPath);
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
  public createFileDescriptors() {
    let directory = this.config.outputPath;

    debug(`Creating file descriptors processor at path ${directory} `);

    //TODO - make async.
    //TODO - cachetimestamps for files - for performance
    const glob = require('glob-all');
    let files = glob.sync(this.config.filePattern, { cwd: this.config.outputPath });
    files.forEach((file) => {
      const extension = path.extname(file).toLowerCase();
      if (extension === '.brs' || extension === '.xml') {
        let existingDescriptor = this.fileMap.getDescriptor[file];
        if (existingDescriptor) {
          this.feedback.push(new FileFeedback(existingDescriptor, FileFeedbackType.Warning, `file ${directory}/${file} already has descriptor, skipping`));
        }
        this.createDescriptor(file, null);
      }
    });
  }

  /**
   * Create desciptor for the given file -
   * @param directory
   * @param filename
   * @param associatedFile
   */
  public createDescriptor(filename, associatedFile) {
    const extension = path.extname(filename).toLowerCase();
    const fileDescriptor = new FileDescriptor(filename, path.basename(filename), extension);

    if (associatedFile === null) {
      associatedFile = this.getAssociatedFile(filename, path.basename(filename), extension);
    }

    fileDescriptor.associatedFile = associatedFile;
    if (associatedFile !== null) {
      associatedFile.associatedFile = fileDescriptor;
    }
    this.fileMap.addDescriptor(fileDescriptor);
  }

  public getAssociatedFile(directory, filename, extension) {
    if (extension !== '.brs' && extension !== '.xml') {
      return null;
    }
    const otherExtension = extension === '.brs' ? '.xml' : '.brs';
    const otherFilename = changeExtension(filename, otherExtension);
    let descriptor = this.fileMap.getDescriptor(otherFilename);
    if (!descriptor) {
      const otherFullPath = path.join(directory, otherFilename);
      descriptor = fs.existsSync(otherFullPath) ? new FileDescriptor(directory, otherFilename, otherExtension) : null;
      if (descriptor) {
        this.fileMap.addDescriptor(descriptor);
      }
    }
    return descriptor;
  }

  public clearFiles() {
    fs.removeSync(this.config.outputPath);
  }
}
