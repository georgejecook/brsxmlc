import * as Debug from 'debug';
import * as fs from 'fs-extra';
import * as path from 'path';
import { inspect } from 'util';

import File from './File';
import ProjectFileMap from './ProjectFileMap';

import { Program } from 'brightscript-language';
import { util } from 'brightscript-language';
import { BrsConfig } from 'brightscript-language/dist/BrsConfig';
import { changeExtension } from './changeExtension';
import { FileFeedback, FileFeedbackType } from './FileFeedback';
import { FileType } from './FileType';
import ImportProcessor from './ImportProcessor';
import Namespace from './NameSpace';
import { ProcessorConfig } from './ProcessorConfig';
import { ProcessorSettings } from './ProcessorSettings';
import { addSetItems, getRegexMatchesValues } from './Utils';

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
    this._fileMap = fileMap || new ProjectFileMap();
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
    this.createFiles();
    //TODO - process bindings
    // - which will automatically add binding imports
    //this.processImports();

  }

  public async processImports() {
    debug(`Processing imports `);
    let includeImporter = new ImportProcessor(this);

    this.fileMap.getAllFiles().filter((file) => file.fileType === FileType.Xml
      || file.fileType === FileType.ViewXml)
      .forEach((file) => {
        includeImporter.addImportsToXmlFile(file);
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
   * Find all files inside a dir, recursively and convert to files
   * @function getAllFiles
   * @return {string[]} Array with all file names that are inside the directory.
   * @param directory
   */
  public async createFiles() {
    let directory = this.config.outputPath;

    debug(`Creating file files processor at path ${directory} `);

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
        let existingFile = this.fileMap.getFile[file];
        if (existingFile) {
          this.feedback.push(new FileFeedback(existingFile, FileFeedbackType.Warning, `file ${directory}/${file} already has file, skipping`));
        } else {
          try {
            await this.createFile(fullPath, projectPath, filename, extension);
          } catch (e) {
            //log the error, but don't fail this process because the file might be fixable later
            console.error(e);
          }
        }
      }
    }
    debug(`finished creating file files`);
  }

  /**
   * Create desciptor for the given file -
   * @param directory
   * @param filename
   * @param associatedFile
   */
  public async createFile(fullPath, projectPath, filename, extension, associatedFile: File = null): Promise<File> {

    const file = new File(fullPath, projectPath, filename, extension);

    await this._program.addOrReplaceFile(file.fullPath.toLowerCase());
    if (!associatedFile) {
      const associatedFile = await this.getAssociatedFile(file, fullPath, projectPath, filename, extension);
      file.associatedFile = associatedFile;
    } else {
      file.associatedFile = associatedFile;
    }
    if (associatedFile) {
      associatedFile.associatedFile = file;
    }
    file.programFile = await this._program.addOrReplaceFile(file.fullPath.toLowerCase(), file.getFileContents());
    if (file.fileType === FileType.Brs || file.fileType === FileType.CodeBehind) {
      file.namespace = this.getNamespaceFromFile(file);
      addSetItems(file.importedNamespaceNames,
        getRegexMatchesValues(file.getFileContents(), this.settings.importRegex, 2));
    }
    this.fileMap.addFile(file);
    return file;
  }

  public async getAssociatedFile(file: File, fullPath: string, projectPath: string, filename: string, extension: string): Promise<File> {
    if (extension !== '.brs' && extension !== '.xml') {
      return null;
    }
    const otherExtension = extension === '.brs' ? '.xml' : '.brs';
    const otherFilename = changeExtension(filename, otherExtension);
    const otherPath = path.join(fullPath, otherFilename);
    let associatedFile = this.fileMap.getFile(otherPath);
    if (!associatedFile) {
      if (fs.existsSync(otherPath)) {
        associatedFile = await this.createFile(fullPath, projectPath, otherFilename, otherExtension, file);
      }
    }
    return associatedFile;
  }

  public clearFiles() {
    fs.removeSync(this.config.outputPath);
  }

  public getNamespaceFromFile(file: File): Namespace {
    let namespace: Namespace = null;
    if (file && (file.fileType === FileType.CodeBehind || file.fileType === FileType.Brs)) {
      let namespaceCount = 0;
      let matches;
      while (matches = this.settings.namespaceRegex.exec(file.getFileContents())) {
        namespaceCount++;
        if (namespaceCount > 1) {
          const feedback = new FileFeedback(file, FileFeedbackType.Error, `More than one namespace defined
        for file ${file.fullPath}`);
          this.feedback.push(feedback);
          feedback.throw();
        } else if (matches.length > 3) {
          const shortName = matches[2];
          const name = matches[3];
          namespace = new Namespace(name, file, shortName);
          break;
        }
      }
      if (namespace) {
        const existingNamespace = this.fileMap.getNamespaceByName(namespace.name);
        if (existingNamespace) {
          const feedback = new FileFeedback(file, FileFeedbackType.Error, `Could not register namespace ${namespace.name},
        for file ${file.fullPath}. It is already registered for file ${existingNamespace.file.fullPath}`);
          this.feedback.push(feedback);
          feedback.throw();
        }
      }
    }
    return namespace;
  }
}
