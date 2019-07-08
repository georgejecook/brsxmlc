import File from './File';

export default class Namespace {
  constructor(name: string, file: File, filePrefix?: string) {
    this._name = !name || name.trim() === '' ? filePrefix : name;
    this._filePrefix = !filePrefix || filePrefix.trim() === '' ? name : filePrefix;
    this._file = file;
  }

  private readonly _name: string;
  private readonly _filePrefix: string;
  private readonly _file: File;

  public get name() {
    return this._name;
  }

  public get filePrefix() {
    return this._filePrefix;
  }

  public get file() {
    return this._file;
  }
}
