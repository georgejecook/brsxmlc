import { FileFeedback } from './FileFeedback';
import { ProcessorConfig } from './ProcessorConfig';
import { ProcessorSettings } from './ProcessorSettings';
import ProjectFileMap from './ProjectFileMap';
import { ProjectProcessor } from './ProjectProcessor';

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
  private sett
  private get feedback(): FileFeedback[] {
    return this.projectProcessor.feedback;
  }
}
