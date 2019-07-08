// @ts-ignore
import { Program, XmlFile } from 'brightscript-language';
// @ts-ignore
import { util } from 'brightscript-language';
// @ts-ignore
import { BrsConfig } from 'brightscript-language/dist/BrsConfig';
import * as Debug from 'debug';
import * as fs from 'fs-extra';
import * as path from 'path';
import { inspect } from 'util';

import { changeExtension } from './changeExtension';
import { feedbackError, feedbackWarning } from './Feedback';
import File from './File';
import { FileFeedback, FileFeedbackType } from './FileFeedback';
import { FileType } from './FileType';
import ImportProcessor from './ImportProcessor';
import Namespace from './NameSpace';
import { ProcessorConfig } from './ProcessorConfig';
import { ProcessorSettings } from './ProcessorSettings';
import ProjectFileMap from './ProjectFileMap';
import { addSetItems, getRegexMatchesValues } from './Utils';

const debug = Debug('projectProcessor');

export class ProjectProcessor {
  constructor(config: ProcessorConfig, fileMap?: ProjectFileMap) {
    this._config = config;
    debug('Running project processor');
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
    this._settings = new ProcessorSettings();
  }

  private readonly _builderConfig: BrsConfig;
  private readonly _config: ProcessorConfig;
  private readonly _fileMap: ProjectFileMap;
  private readonly _settings: ProcessorSettings;
  private readonly _targetPath: string;
  private _program: Program;

  get targetPath(): string {
    return this._targetPath;
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

  public async processFiles() {
    debug(`Running processor with config ${inspect(this.config)} `);
    this.clearFiles();
    this.copyFiles();
    await this.createFiles();
    //TODO - process bindings
    // - which will automatically add binding imports
    await this.processImports();
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
          feedbackWarning(null, `file ${directory}/${file} already has file, skipping`);
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

    //Set parents
    this.fileMap.getAllFiles().filter((file) => file.fileType === FileType.Xml
      || file.fileType === FileType.ViewXml)
      .forEach((file) => {
        const parent = (file.programFile as XmlFile).parent;
        if (parent) {
          file.parentFile = this.fileMap.getFile(parent.pathAbsolute);
        }
      });
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
      addSetItems(file.importedPaths,
        this.getNormalizedImports(file, getRegexMatchesValues(file.getFileContents(), this.settings.importRegex, 1)));
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
          feedbackError(file, `More than one namespace defined for file ${file.fullPath}`, true);
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
          feedbackError(file, `Could not register namespace ${namespace.name},
                for file ${file.fullPath}. It is already registered for file ${existingNamespace.file.fullPath}`, true);
        }
      }
    }
    return namespace;
  }

  private getNormalizedImports(file: File, paths: string[]): string[] {
    let importPaths = [];
    let filePath = file.pkgPath.toLowerCase();
    paths.forEach( (path) => {
      path = path.toLowerCase();
      let normalizedPath = this.getPkgPathFromTarget(filePath, path);
      if (normalizedPath) {
        importPaths.push(normalizedPath);
      }
    });
    return importPaths;
  }

  /**
   * Given an absollute path to a source file, and a target path,
   * compute the pkg path for the target relative to the source file's location
   * @param containingFilePathAbsolute
   * @param targetPath
   *
   * Note - lifted straight from Bronley Plumb's brightscript-language utisl : thanks Bron :)
   */
  public getPkgPathFromTarget(containingFilePathAbsolute: string, targetPath: string): string | null {
    //if the target starts with 'pkg:', it's an absolute path. Return as is
    if (targetPath.indexOf('pkg:/') === 0) {
      targetPath = targetPath.substring(5);
      if (targetPath === '') {
        return null;
      } else {
        return path.normalize(targetPath);
      }
    }
    if (targetPath === 'pkg:') {
      return null;
    }

    //remove the filename
    let containingFolder = path.normalize(path.dirname(containingFilePathAbsolute));
    //start with the containing folder, split by slash
    let result = containingFolder.split(path.sep);

    //split on slash
    let targetParts = path.normalize(targetPath).split(path.sep);

    for (let part of targetParts) {
      if (part === '' || part === '.') {
        //do nothing, it means current directory
        continue;
      }
      if (part === '..') {
        //go up one directory
        result.pop();
      } else {
        result.push(part);
      }
    }
    return result.join(path.sep);
  }
}
