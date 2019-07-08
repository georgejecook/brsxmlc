import File from '../fileProcessing/File';
import { BrsClassMember } from './BrsClassMember';

export class BrsClass {
  constructor(file: File, className: string, members: BrsClassMember[]) {
    this._file = file;
    this._className = className;
    this._members = [];
    this._members.concat(members);
  }

  private _file: File;
  private _className: string;
  private _members: BrsClassMember[];

  get members(): BrsClassMember[] {
    return this._members;
  }

  get className(): string {
    return this._className;
  }

  get file(): File {
    return this._file;
  }
}
