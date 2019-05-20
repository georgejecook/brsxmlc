import File from './File';

export enum FileFeedbackType {
  Info = 'Info',
  Warning = 'Warning',
  Error = 'Error',
}

export class FileFeedback {
  constructor(public file: File,
              public feedbackType: FileFeedbackType,
              public message: string,
              public line?: number,
              public character?: number) {

  }

  public toString(): string {
    let fileName = this.file ? this.file.fullPath : 'No file';
    let lineText = this.line ? this.line.toString() : '-';
    let charText = this.character ? this.character.toString() : '-';
    return `${this.feedbackType.toString()} - ${fileName}(${lineText}:${charText}) ${this.message}`;
  }

  public throw() {
    throw new Error(this.toString());
  }
}
