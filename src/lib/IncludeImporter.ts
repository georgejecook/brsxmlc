'use strict';
import * as _ from 'lodash';
import * as path from 'path';

import FileDescriptor from './FileDescriptor';

import { FileType } from './FileType';

import ProjectProcessor from './ProjectProcessor';
import { spliceString } from './StringUtils';

/**
 * Manages importing includes for a given brs file
 */
export default class IncludeImporter {
  get requiredImports(): any[] {
    return this._requiredImports;
  }

  constructor(config, fileDescriptor, projectProcessor) {
    if (fileDescriptor.fileType !== FileType.CodeBehind && fileDescriptor.fileType !== FileType.Brs) {
      throw new Error('was given a non-codebehind / Brs file');
    }
    this.fileDescriptor = fileDescriptor;
    this._requiredImports = [];
    this.config = config;
    this.fileMap = projectProcessor.fileMap;
    this.projectProcessor = projectProcessor;
    this.errors = projectProcessor.errors;
    this.warnings = projectProcessor.warnings;
    this.codeBehindContents = fileDescriptor.getFileContents();
  }

  private fileDescriptor: FileDescriptor;
  private _requiredImports: any[];
  private config: any;
  private fileMap: any;
  private projectProcessor: ProjectProcessor;
  private errors: any;
  private warnings: any;
  private codeBehindContents: string;
  private xmlContents: string;

  public identifyImports() {
    //1. Get list of '@Import
    const codeBehindImportNames = IncludeImporter.getRegexMatchesValues(this.codeBehindContents, this.config.importRegex, 2);
    if (_.isEmpty(codeBehindImportNames)) {
      return;
    }

    let xmlImports = [];
    if (this.fileDescriptor.fileType === FileType.CodeBehind) {
      //check if the xml file associated with this descriptor already has any of the imports
      this.xmlContents = this.fileDescriptor.associatedFile.getFileContents();
      xmlImports = IncludeImporter.getRegexMatchesValues(this.xmlContents, this.config.importXMLRegex, 3);
      xmlImports = xmlImports.map((i) => path.basename(i));
    }

    //get all nestedDependcies
    const allImportDescriptors = this.getAllImportDescriptors(this.fileDescriptor.filename, codeBehindImportNames);

    //remove anything that's already present in the xml file
    xmlImports.forEach((xmlImport) => {
      delete allImportDescriptors[xmlImport];
    });

    for (const key in allImportDescriptors) {
      this._requiredImports.push(allImportDescriptors[key]);
    }
  }

  /**
   * keeps
   * @param rootFilename
   * @param importNames
   */
  private getAllImportDescriptors(rootFilename: string, importNames: string[]): { [userId: string]: FileDescriptor } {
    const newImports = {};
    importNames.forEach((importName) => {
      let dependencyNames = this.fileMap.getImportDependencies(importName);
      if (!dependencyNames) {
        //look up the dependency, in the filemap
        dependencyNames = this.getNestedDependencies(rootFilename, importName);
        this.fileMap.setImportDependencies(rootFilename, dependencyNames);
      }

      dependencyNames.forEach((dependencyName) => {
        if (dependencyName === rootFilename) {
          throw new Error(`cyclical dependency discovered for ${rootFilename}! ABORTING`);
        }

        const descriptor = this.fileMap.getDescriptor(dependencyName);
        if (!descriptor) {
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
  private addImportIncludes() {
    //for viewxml/codebehind files, we add the imports to xml - for pure brs files that's a moot point
    if (this.fileDescriptor.fileType === FileType.CodeBehind) {
      this.addImportIncludesToXML();
    }

    //for xml/brs files, we need to add to the init method
    this.addMixinInitializersToBRSInit();
  }

  /**
   * We need a means to hook our mixins into our code. We use a special tag '@MixinInit
   * to allow us to replace ONE LINE of code, and then put the actual mixin init methods in a method at the end of the file
   * this prevents us from screwing up the line numbering in the event of an error.
   */
  private addMixinInitializersToBRSInit() {
    //TODO - note
    //1. Check that brs file has Mixin placeholder call '@Mixin'
    //if not - error
    //replace with __CallMixinInits() method
    //2. create __CallMixinInits() method
    //for each import, if it's a mixin, add a call to it there
  }

  private addImportIncludesToXML() {
    let imports = ``;
    this._requiredImports.forEach((descriptor) => {
      imports += `\n` + this.config.importTemplate.replace(`$PATH$`, descriptor.getPackagePath(this.fileMap.projectRoot));
    });

    //we place imports at the end of the file to ensure we don't screw up error line number reporting

    const insertionIndex = 43; //TODO - get the end tag location, and put it on the line before
    this.xmlContents = spliceString(this.xmlContents, insertionIndex, 0, imports);
  }

  private static getRegexMatchesValues(input, pattern, groupIndex) {
    let values = [];
    let matches: any[];
    const regex = new RegExp(pattern, 'g');
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
      throw new Error(`[${filename}] has missing dependency for ${dependencyName}! ABORTING`);
    }
    if (!dependencyNames.includes(dependencyName)) {
      dependencyNames.push(dependencyName);
      const nestedDependencies = IncludeImporter.getRegexMatchesValues(descriptor.getFileContents(), this.config.importRegex, 2);
      nestedDependencies.forEach((nestedDependency) => this.getNestedDependencies(filename + '.' + dependencyName, nestedDependency, dependencyNames));
    }
    return dependencyNames;
  }

}
