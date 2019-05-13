'use strict';
import * as _ from 'lodash';
import * as path from 'path';

import File from './File';

import { FileType } from './FileType';

import { XmlFile } from 'brightscript-language';
import { FileFeedback, FileFeedbackType } from './FileFeedback';
import Namespace from './NameSpace';
import { ProcessorConfig } from './ProcessorConfig';
import { ProcessorSettings } from './ProcessorSettings';
import ProjectFileMap from './ProjectFileMap';
import { ProjectProcessor } from './ProjectProcessor';
import { getRegexMatchesValues, spliceString } from './StringUtils';

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

  public addImportsToXmlFile(file: File) {
    if (file.fileType !== FileType.Xml && file.fileType !== FileType.ViewXml) {
      throw new Error('was given a non-xml file');
    }
    const rootNamespaceNames = new Set();
    //1 add codebehind namespace names
    if (file.associatedFile) {
      this.addSetItems(rootNamespaceNames, file.associatedFile.importedNamespaceNames);
    }

    //2 add namespace names from all imported scripts
    const xmlFile = file.programFile as XmlFile;
    for (const fileReference of xmlFile.getOwnScriptImports()) {
      const importedFile = this.fileMap.getFileByPkgPath(fileReference.pkgPath);
      if (!importedFile) {
        const feedback = new FileFeedback(file, FileFeedbackType.Error, `xml file imports a file that cannot be found ${fileReference.pkgPath}`);
        this.feedback.push(feedback);
        feedback.throw();
      }
      this.addSetItems(rootNamespaceNames, importedFile.importedNamespaceNames);
    }

    //3 identify if the file is using bindings
    if (file.bindings.length > 0) {
      //TODO
      rootNamespaceNames.add('ObservableMixin');
      rootNamespaceNames.add('BaseObservable');
    }

    //5 get all nested depende
    const allNamespaceNames = new Set();
    for (const namespaceName of rootNamespaceNames) {
      this.addNestedNamespaces(file, namespaceName, allNamespaceNames);
    }

    //turn all names into namespaces
    const namespaces = [];
    for (const namespaceName of allNamespaceNames) {
      namespaces.push(this.fileMap.getNamespaceByName(namespaceName));
    }

    //5 add script import tags to file
    this.addImportIncludes(file, namespaces);
  }

  public addSetItems(setA, setB) {
    for (const elem of setB) {
      setA.add(elem);
    }
  }

  private addNestedNamespaces(parentFile: File, parentNamespaceName: string, namespaceNames: Set<string>, parentSet: Set<string> = null) {
    let parentNamespace = this.fileMap.getNamespaceByName(parentNamespaceName);
    if (!parentNamespace) {
      this.failWithMissingNamespace(parentFile, parentNamespaceName);
    }
    if (!parentSet) {
      parentSet = new Set([parentNamespaceName]);
    }
    let file = parentNamespace.file;
    for (const namespaceName of file.importedNamespaceNames) {
      if (!namespaceNames.has(namespaceName)) {
        let namespace = this.fileMap.getNamespaceByName(namespaceName);
        if (!namespace) {
          this.failWithMissingNamespace(file, namespaceName);
        }
        if (parentSet.has(namespaceName)) {
          this.failWithCyclicalNamespace(file, parentNamespaceName, namespaceName);
        }
        const namespaceStack = new Set(parentSet);
        namespaceStack.add(namespaceName);
        this.addNestedNamespaces(file, namespaceName, namespaceNames, namespaceStack);
        namespaceNames.add(namespaceName);
      }
    }
    namespaceNames.add(parentNamespaceName);
  }

  public failWithMissingNamespace(file: File, namespaceName: string) {
    const feedback = new FileFeedback(file, FileFeedbackType.Error, `Missing namespace - could not find a file that
     declares the namespace ${namespaceName}`);
    this.feedback.push(feedback);
    feedback.throw();
  }

  public failWithCyclicalNamespace(file: File, sourceNamespaceName: string, namespaceName: string) {
    const feedback = new FileFeedback(file, FileFeedbackType.Error, `Cyclical import detected - an infinite import cycle
     was found on ${namespaceName} when processing import for ${sourceNamespaceName}`);
    this.feedback.push(feedback);
    feedback.throw();
  }

  /**
   * Responsible for updating the codebehind and xml files with the required imports
   */
  public addImportIncludes(file: File, namespaces: Namespace[]) {
    //for viewxml/codebehind files, we add the imports to xml - for pure brs files that's a moot point
    if (file.fileType === FileType.CodeBehind && file.associatedFile) {
      this.addImportIncludesToXML(file, namespaces);
      this.addMixinInitializersToBRSInit(file, namespaces);
    }

  }

  /**
   * We need a means to hook our mixins into our code. We use a special tag '@MixinInit
   * to allow us to replace ONE LINE of code, and then put the actual mixin init methods in a method at the end of the file
   * this prevents us from screwing up the line numbering in the event of an error.
   */
  private addMixinInitializersToBRSInit(file: File, namespaces: Namespace[]) {
    //TODO - note
    //1. Check that brs file has Mixin placeholder call '@Mixin'
    //if not - error
    //replace with __CallMixinInits() method
    //2. create __CallMixinInits() method
    //for each import, if it's a mixin, add a call to it there
  }

  private addImportIncludesToXML(file: File, namespaces: Namespace[]) {

    if (file.fileType !== FileType.Xml && file.fileType !== FileType.ViewXml) {
      this.feedback.push(new FileFeedback(file, FileFeedbackType.Error, `Was passed a xml file`));
      throw new Error('was given a non-xml file');
    }

    let imports = ``;
    let cwd = process.cwd();
    namespaces.forEach( (namespace) => {
      imports += `\n${this.settings.importTemplate.replace(`$PATH$`, namespace.file.pkgPath)}`;
    });

    //we place imports at the end of the file to ensure we don't screw up error line number reporting

    let xmlContents = file.associatedFile.getFileContents();
    this.settings.endOfXmlFileRegex.lastIndex = 0;
    let result = this.settings.endOfXmlFileRegex.exec(xmlContents);
    if (result) {
      const insertionIndex = result.index; //TODO - get the end tag location, and put it on the line before
      xmlContents = spliceString(xmlContents, insertionIndex, 0, imports);
      file.associatedFile.setFileContents(xmlContents);
      file.associatedFile.saveFileContents();
      let xmlFile = file.programFile as XmlFile;
      //TODO update xmlFile - re-add/ reprocess? or simply add it to the imports
    } else {
      this.feedback.push(new FileFeedback(file.associatedFile, FileFeedbackType.Error, `xml file did not have end component tag`));
      throw new Error(`xml file did not have end component tag`);
    }
  }

}
