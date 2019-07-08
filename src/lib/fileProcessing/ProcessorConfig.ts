export enum ProcessorLogLevel {
  error = 0,
  warning = 1,
  info = 2,
  verbose = 3
}

export interface ProcessorConfig {
  sourcePath?: string;
  rootPath?: string;
  filePattern: string[];
  outputPath?: string;
  logLevel: ProcessorLogLevel;
}
