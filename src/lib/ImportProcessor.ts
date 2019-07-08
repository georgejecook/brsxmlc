'use strict';
// @ts-ignore
import { XmlFile } from 'brightscript-language';

import { feedbackError } from './Feedback';
import File from './File';
import { FileFeedback, FileFeedbackType } from './FileFeedback';
import { FileType } from './FileType';
import { ProcessorConfig } from './ProcessorConfig';
import { ProcessorSettings } from './ProcessorSettings';
import ProjectFileMap from './ProjectFileMap';
import { ProjectProcessor } from './ProjectProcessor';
import { addSetItems, spliceString } from './Utils';

/**
 * Manages importing includes for a given brs file
 */
export default class ImportProcessor {
  constructor(projectProcessor: ProjectProcessor) {
    this.settings = new ProcessorSettings();
    this.config = projectProcessor.config;
    this.fileMap = projectProcessor.fileMap;
    this.projectProcessor = projectProcessor;
  }

  private config: ProcessorConfig;
  private fileMap: ProjectFileMap;
  private projectProcessor: ProjectProcessor;
  private settings: ProcessorSettings;

  public addImportsToXmlFile(file: File) {
    if (!file || file.fileType !== FileType.Xml && file.fileType !== FileType.ViewXml) {
      throw new Error('was given a non-xml file');
    }
    if (!file.hasProcessedImports) {
      if (file.parentFile && !file.parentFile.hasProcessedImports) {
        //we must process and update the parent first, otherwise we can't filter the imports
        this.addImportsToXmlFile(file.parentFile);
      }
      this.identifyImports(file);
      this.addImportCodeToFile(file);
      file.hasProcessedImports = true;
    }
  }

  public identifyImports(file: File) {
    if (!file || file.fileType !== FileType.Xml && file.fileType !== FileType.ViewXml) {
      throw new Error('was given a non-xml file');
    }
    const rootImportPaths = new Set();
    //1 add codebehind imports
    if (file.associatedFile) {
      addSetItems(rootImportPaths, file.associatedFile.importedPaths);
    }

    //2 add imported paths from all XML imported scripts
    const xmlFile = file.programFile as XmlFile;
    for (const fileReference of xmlFile.getOwnScriptImports()) {
      const importedFile = this.fileMap.getFileByPkgPath(fileReference.pkgPath);
      if (!importedFile) {
        feedbackError(file, `xml file imports a file that cannot be found ${fileReference.pkgPath}`, true);
      } else if (importedFile === file.associatedFile) {
        continue;
      }
      addSetItems(rootImportPaths, importedFile.importedPaths);
    }

    //3 identify if the file is using bindings
    if (file.bindings.length > 0) {
      //TODO - need to ensure the location matches the project spec
      rootImportPaths.add('pkg:/source/maestro/binding/ObservableMixin.brs');
      rootImportPaths.add('pkg:/source/maestro/binding/BaseObservable.brs');
    }

    //TODO 4 include codebehind file, if not already included

    //5 get all nested dependencies
    const allImportedPaths = new Set();
    for (const importPath of rootImportPaths) {
      this.addNestedImportPaths(file, importPath, allImportedPaths);
    }

    //turn all imports into files
    const requiredFiles = [];
    const importedFiles = [];
    const parentImportPaths = file.getAllParentImportPaths();
    for (const path of allImportedPaths) {
      const importedFile = this.fileMap.getFileByPkgPath(path);
      requiredFiles.push(importedFile);
      if (!parentImportPaths.includes(path)) {
        importedFiles.push(importedFile);
      }
    }
    file.importedFiles = importedFiles;
    file.requiredFiles = requiredFiles;
  }

  private addNestedImportPaths(sourceFile: File, parentPkgPath: string, importPaths: Set<string>, parentSet: Set<string> = null) {
    let parentFile = this.fileMap.getFileByPkgPath(parentPkgPath);
    if (!parentFile) {
      this.failWithMissingImport(sourceFile, parentPkgPath);
    }
    if (!parentSet) {
      parentSet = new Set([parentPkgPath]);
    }
    let file = parentFile;
    for (const importPath of file.importedPaths) {
      if (!importPaths.has(importPath)) {
        let importFile = this.fileMap.getFileByPkgPath(importPath);
        if (!importFile) {
          this.failWithMissingImport(file, importPath);
        }
        if (parentSet.has(importPath)) {
          this.failWithCyclicalImport(file, parentPkgPath, importPath);
        }
        const importStack = new Set(parentSet);
        importStack.add(importPath);
        this.addNestedImportPaths(file, importPath, importPaths, importStack);
        importPaths.add(importPath);
      }
    }
    importPaths.add(parentPkgPath);
  }

  public failWithMissingImport(file: File, path: string) {
    feedbackError(file, `Missing import - could not find a file at path ${path}`, true);
  }

  public failWithCyclicalImport(file: File, sourceImportPath: string, path: string) {
    feedbackError(file, `Cyclical import detected - an infinite import cycle
     was found on ${path} when processing import for ${sourceImportPath}`, true);
  }

  /**
   * Responsible for updating the codebehind and xml files with the required imports
   */
  public addImportCodeToFile(file: File) {
    //for viewxml/codebehind files, we add the imports to xml - for pure brs files that's a moot point
    if (file.fileType === FileType.Xml || file.fileType === FileType.ViewXml) {
      this.addImportIncludesToXML(file);
      this.addMixinInitializersToBRSInit(file);
    }
  }

  /**
   * We need a means to hook our mixins into our code. We use a special tag '@MixinInit
   * to allow us to replace ONE LINE of code, and then put the actual mixin init methods in a method at the end of the file
   * this prevents us from screwing up the line numbering in the event of an error.
   */
  private addMixinInitializersToBRSInit(file: File) {
    //TODO - note
    //1. Check that brs file has Mixin placeholder call '@Mixin'
    //if not - error
    //replace with __CallMixinInits() method
    //2. create __CallMixinInits() method
    //for each import, if it's a mixin, add a call to it there
  }

  private addImportIncludesToXML(file: File) {

    if (file.fileType !== FileType.Xml && file.fileType !== FileType.ViewXml) {
      feedbackError(file, `Was passed a non xml file`, true);
    }

    let imports = ``;
    let cwd = process.cwd();
    file.importedFiles.forEach( (file) => {
      imports += `\n${this.settings.importTemplate.replace(`$PATH$`, file.pkgUri)}`;
    });

    //if the codebehind is not imported yet, import it
    const xmlFile = file.programFile as XmlFile;
    if (file.associatedFile) {
      const codeBehindPkgPath = file.associatedFile.pkgPath.toLowerCase();
      const ownScripts = xmlFile.getOwnScriptImports();
      if (!ownScripts.find((i) => i.pkgPath.toLowerCase() === codeBehindPkgPath)) {
        imports += `\n${this.settings.importTemplate.replace(`$PATH$`, file.associatedFile.pkgUri)}`;
      }
    }

    //we place imports at the end of the file to ensure we don't screw up error line number reporting
    let xmlContents = file.getFileContents();
    this.settings.endOfXmlFileRegex.lastIndex = 0;
    let result = this.settings.endOfXmlFileRegex.exec(xmlContents);
    if (result) {
      const insertionIndex = result.index; //TODO - get the end tag location, and put it on the line before
      xmlContents = spliceString(xmlContents, insertionIndex, 0, imports);
      file.setFileContents(xmlContents);
      file.saveFileContents();
      let xmlFile = file.programFile as XmlFile;
      //TODO update xmlFile - re-add/ reprocess? or simply add it to the imports
    } else {
      feedbackError(file, `xml file did not have end component tag`, true);
    }
  }

}
