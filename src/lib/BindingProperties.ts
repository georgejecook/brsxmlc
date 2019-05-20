import { BindingType } from './BindingType';

export class BindingProperties {

  constructor(public type: BindingType = BindingType.oneWay,
              public isSettingInitialValue: boolean = true,
              public transformFunction: string = '') {
  }
}
