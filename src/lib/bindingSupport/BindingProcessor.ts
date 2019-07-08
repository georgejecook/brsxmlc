import { spliceStringAt } from '../../../out/lib/StringUtils';
import File from '../fileProcessing/File';
import { FileFeedback } from '../fileProcessing/FileFeedback';
import { FileType } from '../fileProcessing/FileType';
import { ProcessorConfig } from '../fileProcessing/ProcessorConfig';
import { ProcessorSettings } from '../fileProcessing/ProcessorSettings';
import ProjectFileMap from '../fileProcessing/ProjectFileMap';
import { ProjectProcessor } from '../fileProcessing/ProjectProcessor';
import { XMLTag } from '../fileProcessing/XMLTag';
const xmldoc = require('../utils/xmldoc');

export class BindingProcessor {
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

  public processFile(file: File) {
    if (!file || file.fileType !== FileType.Xml && file.fileType !== FileType.ViewXml) {
      throw new Error('was given a non-xml file');
    }
    const tagsWithBindings: XMLTag[] = [];
    let fileContents = file.getFileContents();
    const doc = new xmldoc.XmlDocument(fileContents);
    doc.allElements.forEach( (xmlElement) => {
      const tagText = fileContents.substring(xmlElement.startTagPosition, xmlElement.endTagPosition);
      xmlElement.children = [];
      const tag = new XMLTag(xmlElement, tagText, file);
      if (true || tag.bindings.length > 0) {
        tagsWithBindings.push(tag);
      }
    });

    for (const tag of tagsWithBindings) {
      for (const binding of tag.bindings) {
        file.componentIds.add(binding.nodeId);
        file.bindings.push(binding);
      }
      fileContents = spliceStringAt(fileContents, tag.startPosition, tag.text);
    }
    file.setFileContents(fileContents);
    console.log('complete');
    // file.saveFileContents();
  }
}
