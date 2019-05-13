import { BindingProperties } from './BindingProperties';

export default class Binding {

  constructor(observerId: string, observerField: string, nodeId: string, nodeField: string, properties: BindingProperties) {
    this._observerId = observerId;
    this._observerField = observerField;
    this._nodeId = nodeId;
    this._nodeField = nodeField;
  }

  private _observerId: string;
  private _observerField: string;
  private _nodeId: string;
  private _nodeField: string;

  get nodeField(): string {
    return this._nodeField;
  }
  get nodeId(): string {
    return this._nodeId;
  }
  get observerField(): string {
    return this._observerField;
  }
  get observerId(): string {
    return this._observerId;
  }
}
