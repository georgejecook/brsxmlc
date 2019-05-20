'use strict';
import { XmlFile } from 'brightscript-language';

import { Error } from 'tslint/lib/error';
import { feedbackError } from './Feedback';
import File from './File';
import { FileFeedback, FileFeedbackType } from './FileFeedback';
import { FileType } from './FileType';
import Namespace from './NameSpace';
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
    const rootNamespaceNames = new Set();
    //1 add codebehind namespace names
    if (file.associatedFile) {
      addSetItems(rootNamespaceNames, file.associatedFile.importedNamespaceNames);
    }

    //2 add namespace names from all imported scripts
    const xmlFile = file.programFile as XmlFile;
    for (const fileReference of xmlFile.getOwnScriptImports()) {
      const importedFile = this.fileMap.getFileByPkgPath(fileReference.pkgPath);
      if (!importedFile) {
        feedbackError(file, `xml file imports a file that cannot be found ${fileReference.pkgPath}`, true);
      } else if (importedFile === file.associatedFile) {
        continue;
      }
      addSetItems(rootNamespaceNames, importedFile.importedNamespaceNames);
    }

    //3 identify if the file is using bindings
    if (file.bindings.length > 0) {
      //TODO
      rootNamespaceNames.add('ObservableMixin');
      rootNamespaceNames.add('BaseObservable');
    }

    //5 get all nested dependencies
    const allNamespaceNames = new Set();
    for (const namespaceName of rootNamespaceNames) {
      this.addNestedNamespaces(file, namespaceName, allNamespaceNames);
    }

    //turn all names into namespaces
    const requiredNamespaces = [];
    const importedNamespaces = [];
    const parentNamespaces = file.getAllParentNamespaces();
    for (const namespaceName of allNamespaceNames) {
      const ns = this.fileMap.getNamespaceByName(namespaceName);
      requiredNamespaces.push(ns);
      if (!parentNamespaces.includes(ns)) {
        importedNamespaces.push(ns);
      }
    }
    file.importedNamespaces = importedNamespaces;
    file.requiredNamespaces = requiredNamespaces;
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
    feedbackError(file, `Missing namespace - could not find a file that
     declares the namespace ${namespaceName}`, true);
  }

  public failWithCyclicalNamespace(file: File, sourceNamespaceName: string, namespaceName: string) {
    feedbackError(file, `Cyclical import detected - an infinite import cycle
     was found on ${namespaceName} when processing import for ${sourceNamespaceName}`, true);
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
    file.importedNamespaces.forEach( (namespace) => {
      imports += `\n${this.settings.importTemplate.replace(`$PATH$`, namespace.file.pkgUri)}`;
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
