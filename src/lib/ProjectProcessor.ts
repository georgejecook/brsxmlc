import * as Debug from 'debug';
import * as fs from 'fs-extra';
import * as path from 'path';
import { inspect } from 'util';

import FileDescriptor from './FileDescriptor';
import ProjectFileMap from './ProjectFileMap';

import { Program } from 'brightscript-language';
import { util } from 'brightscript-language';
import { BrsConfig } from 'brightscript-language/dist/BrsConfig';
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
    this._builderConfig = {
      cwd: this.config.sourcePath,
      files: this.config.filePattern,
      rootDir: this.config.outputPath
    };
    if (!config.sourcePath) {
      throw new Error('Config does not contain sourcePath property');
    }
    if (!config.outputPath) {
      throw new Error('Config does not contain outputPath property');
    }
    this._targetPath = path.resolve(this._config.outputPath);
    this._fileMap = fileMap || new ProjectFileMap(this.config);
    this._feedback = [];
    this._settings = new ProcessorSettings();
  }

  private readonly _builderConfig: BrsConfig;
  private readonly _config: ProcessorConfig;
  private readonly _fileMap: ProjectFileMap;
  private readonly _settings: ProcessorSettings;
  private readonly _feedback: FileFeedback[];
  private readonly _targetPath: string;
  private _program: Program;

  get feedback(): FileFeedback[] {
    return this._feedback;
  }

  get targetPath(): string {
    return this._targetPath;
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

  public async processImports() {
    debug(`Processing imports `);
    let includeImporter = new IncludeImporter(this);
    this.fileMap.getAllDescriptors().filter((descriptor) => descriptor.fileType === FileType.CodeBehind)
      .forEach(async (descriptor) => {
        //includeImporter.identifyImports(descriptor);
      });

    this.fileMap.getAllDescriptors().filter((descriptor) => descriptor.fileType === FileType.CodeBehind)
      .forEach((descriptor) => {
        includeImporter.addImportIncludes(descriptor);
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
  public async createFileDescriptors() {
    let directory = this.config.outputPath;

    debug(`Creating file descriptors processor at path ${directory} `);

    let normalizedOptions = await util.normalizeAndResolveConfig(this._builderConfig);

    this._program = new Program(normalizedOptions);

    //TODO - make async.
    //TODO - cachetimestamps for files - for performance
    const glob = require('glob-all');
    let files = glob.sync(this.config.filePattern, { cwd: this.config.outputPath });
    for (const file of files) {
      const extension = path.extname(file).toLowerCase();
      if (extension === '.brs' || extension === '.xml') {
        const projectPath = path.dirname(file);
        const fullPath = path.join(this.targetPath, projectPath);
        const filename = path.basename(file);
        let existingDescriptor = this.fileMap.getDescriptor[file];
        if (existingDescriptor) {
          this.feedback.push(new FileFeedback(existingDescriptor, FileFeedbackType.Warning, `file ${directory}/${file} already has descriptor, skipping`));
        } else {
          try {
            await this.createDescriptor(fullPath, projectPath, filename, extension);
          } catch (e) {
          //log the error, but don't fail this process because the file might be fixable later
            console.error(e);
          }
        }
      }
    }
    debug.log(`finished creating file descriptors`);
  }

  /**
   * Create desciptor for the given file -
   * @param directory
   * @param filename
   * @param associatedFile
   */
  public async createDescriptor(fullPath, projectPath, filename, extension) {

    const fileDescriptor = new FileDescriptor(fullPath, projectPath, filename, extension);

    await this._program.addOrReplaceFile(fileDescriptor.fullPath.toLowerCase());
    const associatedFile = await this.getAssociatedFile(fullPath, projectPath, filename, extension);

    fileDescriptor.associatedFile = associatedFile;
    if (associatedFile !== null) {
      associatedFile.associatedFile = fileDescriptor;
    }
    this.fileMap.addDescriptor(fileDescriptor);
    fileDescriptor.programFile = await this._program.addOrReplaceFile(fileDescriptor.fullPath.toLowerCase());
  }

  public async getAssociatedFile(fullPath, projectPath, filename, extension) {
    if (extension !== '.brs' && extension !== '.xml') {
      return null;
    }
    const otherExtension = extension === '.brs' ? '.xml' : '.brs';
    const otherFilename = changeExtension(filename, otherExtension);
    let descriptor = this.fileMap.getDescriptor(otherFilename);
    if (!descriptor) {
      descriptor = fs.existsSync(path.join(fullPath, otherFilename)) ? new FileDescriptor(fullPath, projectPath, otherFilename, otherExtension) : null;
      if (descriptor) {
        this.fileMap.addDescriptor(descriptor);
        descriptor.programFile = await this._program.addOrReplaceFile(descriptor.fullPath.toLowerCase());
      }
    }
    return descriptor;
  }

  public clearFiles() {
    fs.removeSync(this.config.outputPath);
  }
}
