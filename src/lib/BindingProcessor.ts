import { spliceStringAt } from '../../out/lib/StringUtils';
import File from './File';
import { FileFeedback } from './FileFeedback';
import { FileType } from './FileType';
import { ProcessorConfig } from './ProcessorConfig';
import { ProcessorSettings } from './ProcessorSettings';
import ProjectFileMap from './ProjectFileMap';
import { ProjectProcessor } from './ProjectProcessor';
import { XMLTag } from './XMLTag';
const xmldoc = require('./xmldoc');

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
