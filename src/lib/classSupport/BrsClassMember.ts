
export enum MemberVisibility {
  Public,
  Private
}

export enum MemberType {
  Constructor,
  Method,
  Variable
}

export enum MemberReturnType {
  None,
  String,
  Number,
  Object,
  Boolean
}

export class BrsClassMember {
  constructor(name: string, visibility: MemberVisibility, type: MemberType, returnType: MemberReturnType, defaultValue?: any) {
    this._visibility = visibility;
    this._name = name;
    this._type = type;
    this._returnType = returnType;
    this._defaultValue = defaultValue;
  }

  private _visibility: MemberVisibility;
  private _name: string;
  private _type: MemberType;
  private _returnType: MemberReturnType;
  private _defaultValue: any;

  get defaultValue(): any {
    return this._defaultValue;
  }

  get returnType(): MemberReturnType {
    return this._returnType;
  }

  get type(): MemberType {
    return this._type;
  }

  get name(): string {
    return this._name;
  }

  get visibility(): MemberVisibility {
    return this._visibility;
  }
}