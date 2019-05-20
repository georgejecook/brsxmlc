import { BindingProperties } from './BindingProperties';
import { BindingType } from './BindingType';

export default class Binding {

  constructor() {
    this.properties = new BindingProperties();
  }

  public isValid: boolean = false;
  public isFunctionBinding: boolean = false;
  public observerId: string;
  public observerField: string;
  public nodeId: string;
  public nodeField: string;
  public properties: BindingProperties;
  public errorMessage: string;

  public validate() {
    this.isValid = this.validateImpl();
  }

  private validateImpl(): boolean {
    if (!this.nodeId) {
      this.errorMessage = 'node Id is not defined';
      return false;
    }

    if (!this.nodeField) {
      this.errorMessage = 'node field is not defined';
      return false;
    }

    if (!this.observerId) {
      this.errorMessage = 'observer.id is not defined';
      return false;
    }

    if (!this.observerField) {
      this.errorMessage = 'observer.field is not defined';
      return false;
    }

    if (this.isFunctionBinding && this.properties.type !== BindingType.oneWay) {
      this.errorMessage = 'observer callbacks on functions are only supported for one way bindings';
      return false;
    }
    return true;
  }
}
