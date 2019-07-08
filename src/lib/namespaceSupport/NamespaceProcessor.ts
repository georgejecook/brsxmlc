import File from '../fileProcessing/File';
import { FileType } from '../fileProcessing/FileType';
import { ProcessorConfig } from '../fileProcessing/ProcessorConfig';
import { ProcessorSettings } from '../fileProcessing/ProcessorSettings';
import ProjectFileMap from '../fileProcessing/ProjectFileMap';
import { ProjectProcessor } from '../fileProcessing/ProjectProcessor';

export default class NamespaceProcessor {
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

  public applyNamespaceToFile(file: File) {
    if (!file || file.fileType !== FileType.Brs && file.fileType !== FileType.CodeBehind) {
      throw new Error('was given a non-brs file');
    }

    if (file.namespace) {
      //Global search and replace all function and sub definitions with the correct namespaced version
      this.settings.functionNameRegex.lastIndex = 0;
      let updatedContents = file.getFileContents().replace(
        this.settings.functionNameRegex, '$1' + file.namespace.filePrefix + '_$2');
      file.setFileContents(updatedContents);
    }
  }
}
