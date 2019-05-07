'use strict';
import * as _ from 'lodash';
import * as path from 'path';

import FileDescriptor from './FileDescriptor';

import { FileType } from './FileType';

import { FileFeedback, FileFeedbackType } from './FileFeedback';
import { ProcessorConfig } from './ProcessorConfig';
import { ProcessorSettings } from './ProcessorSettings';
import ProjectFileMap from './ProjectFileMap';
import { ProjectProcessor } from './ProjectProcessor';
import { spliceString } from './StringUtils';

/**
 * Manages importing includes for a given brs file
 */
export default class IncludeImporter {
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

  private get feedback(): FileFeedback[] {
    return this.projectProcessor.feedback;
  }

  public identifyImports(fileDescriptor: FileDescriptor) {
    if (fileDescriptor.fileType !== FileType.CodeBehind && fileDescriptor.fileType !== FileType.Brs) {
      throw new Error('was given a non-codebehind / Brs file');
    }
    let codeBehindContents = fileDescriptor.getFileContents();
    //1. Get list of '@Import
    const codeBehindImportNames = IncludeImporter.getRegexMatchesValues(codeBehindContents, this.settings.importRegex, 2);
    if (_.isEmpty(codeBehindImportNames)) {
      return;
    }

    let xmlImports = [];
    if (fileDescriptor.fileType === FileType.CodeBehind) {
      //get the imports from the xml file associated with this
      //so we can remove any duplicate imports later on
      let xmlContents = fileDescriptor.associatedFile.getFileContents();
      xmlImports = IncludeImporter.getRegexMatchesValues(xmlContents, this.settings.importXMLRegex, 3);
      xmlImports = xmlImports.map((i) => path.basename(i));
    }

    //get all nestedDependencies
    const allImportDescriptors = this.getAllImportDescriptors(fileDescriptor.filename, codeBehindImportNames);

    //remove anything that's already present in the xml file
    xmlImports.forEach((xmlImport) => {
      delete allImportDescriptors[xmlImport];
    });

    for (const key in allImportDescriptors) {
      fileDescriptor.requiredImports.push(allImportDescriptors[key]);
    }
  }

  /**
   * keeps
   * @param rootFilename
   * @param importNames
   */
  private getAllImportDescriptors(rootFilename: string, importNames: string[]): { [filename: string]: FileDescriptor } {
    const newImports = {};
    importNames.forEach((importName) => {
      let dependencyNames = this.fileMap.getImportDependenciesForFile(importName);
      if (!dependencyNames) {
        //look up the dependency, in the filemap
        dependencyNames = this.getNestedDependencies(rootFilename, importName);
        this.fileMap.setImportDependenciesForFile(rootFilename, dependencyNames);
      }

      dependencyNames.forEach((dependencyName) => {
        if (dependencyName === rootFilename) {
          this.feedback.push(new FileFeedback(null, FileFeedbackType.Error, `Cyclical dependency discovered for ${rootFilename}`));
          throw new Error(`cyclical dependency discovered for ${rootFilename}! ABORTING`);
        }

        const descriptor = this.fileMap.getDescriptor(dependencyName);
        if (!descriptor) {
          this.feedback.push(new FileFeedback(null, FileFeedbackType.Error, `[${rootFilename}] has missing dependency for ${dependencyName}! ABORTING`));
          throw new Error(`[${rootFilename}] has missing dependency for ${dependencyName}! ABORTING`);
        }

        newImports[dependencyName] = descriptor;
      });
    });
    return newImports;
  }

  /**
   * Responsible for updating the codebehind and xml files with the required imports
   */
  public addImportIncludes(fileDescriptor: FileDescriptor) {
    //for viewxml/codebehind files, we add the imports to xml - for pure brs files that's a moot point
    if (fileDescriptor.fileType === FileType.CodeBehind && fileDescriptor.associatedFile) {
      this.addImportIncludesToXML(fileDescriptor);
      this.addMixinInitializersToBRSInit(fileDescriptor);
    }

  }

  /**
   * We need a means to hook our mixins into our code. We use a special tag '@MixinInit
   * to allow us to replace ONE LINE of code, and then put the actual mixin init methods in a method at the end of the file
   * this prevents us from screwing up the line numbering in the event of an error.
   */
  private addMixinInitializersToBRSInit(fileDescriptor: FileDescriptor) {
    //TODO - note
    //1. Check that brs file has Mixin placeholder call '@Mixin'
    //if not - error
    //replace with __CallMixinInits() method
    //2. create __CallMixinInits() method
    //for each import, if it's a mixin, add a call to it there
  }

  private addImportIncludesToXML(fileDescriptor: FileDescriptor) {

    if (fileDescriptor.fileType !== FileType.CodeBehind && fileDescriptor.fileType !== FileType.Brs) {
      this.feedback.push(new FileFeedback(fileDescriptor, FileFeedbackType.Error, `Was passed a non-brs/codebehind file`));
      throw new Error('was given a non-codebehind / Brs file');
    }

    if (!fileDescriptor.associatedFile || fileDescriptor.associatedFile.fileType !== FileType.ViewXml) {
      this.feedback.push(new FileFeedback(fileDescriptor, FileFeedbackType.Warning, `There was no xml file associated with the passed in file - cannot add imports to it's associated file`));
      return;
    }

    let imports = ``;
    let cwd = process.cwd();
    fileDescriptor.requiredImports.forEach((descriptor) => {
      imports += `\n${this.settings.importTemplate.replace(`$PATH$`, descriptor.getPackagePath(this.fileMap.projectRoot, cwd))}`;
    });

    //we place imports at the end of the file to ensure we don't screw up error line number reporting

    let xmlContents = fileDescriptor.associatedFile.getFileContents();
    const insertionIndex = 43; //TODO - get the end tag location, and put it on the line before
    xmlContents = spliceString(xmlContents, insertionIndex, 0, imports);
    fileDescriptor.associatedFile.setFileContents(xmlContents);
    fileDescriptor.associatedFile.saveFileContents();
  }

  private static getRegexMatchesValues(input, regex, groupIndex) {
    let values = [];
    let matches: any[];
    while (matches = regex.exec(input)) {
      values.push(matches[groupIndex]);
    }
    return values;
  }

  private getNestedDependencies(filename, dependencyName, dependencyNames: string[] = []) {
    if (!dependencyName.toLowerCase().endsWith('.brs')) {
      dependencyName += '.brs';
    }
    const descriptor = this.fileMap.getDescriptor(dependencyName);
    if (!descriptor) {
      this.feedback.push(new FileFeedback(null, FileFeedbackType.Error, `[${filename}] has missing dependency for ${dependencyName}! ABORTING`));
      throw new Error(`[${filename}] has missing dependency for ${dependencyName}! ABORTING`);
    }
    if (!dependencyNames.includes(dependencyName)) {
      dependencyNames.push(dependencyName);
      const nestedDependencies = IncludeImporter.getRegexMatchesValues(descriptor.getFileContents(), this.settings.importRegex, 2);
      nestedDependencies.forEach((nestedDependency) => this.getNestedDependencies(filename + '.' + dependencyName, nestedDependency, dependencyNames));
    }
    return dependencyNames;
  }

}
