import { BindingType } from './BindingType';

export class BindingProperties {

  constructor(bindingType: BindingType, isSettingInitialValue: boolean, transformFunction: string) {
    this._bindingType = bindingType;
    this._isSettingInitialValue = isSettingInitialValue;
    this._transformFunction = transformFunction;

  }
  private _isSettingInitialValue: boolean;
  private _transformFunction: string;
  private _bindingType: BindingType;

  get bindingType(): BindingType {
    return this._bindingType;
  }
  get transformFunction(): string {
    return this._transformFunction;
  }

  get isSettingInitialValue(): boolean {
    return this._isSettingInitialValue;
  }
}
