import File from './File';

export default class Namespace {
  constructor(name: string, shortName: string, file : File) {
    this._name = name;
    this._shortName = shortName;
    this._file = file;
  }

  private readonly _name: string;
  private readonly _shortName: string;
  private readonly _file: File;

  public get name() {
    return this._name;
  }

  public get shortName() {
    return this._shortName;
  }

  public get file() {
    return this._file;
  }
}
