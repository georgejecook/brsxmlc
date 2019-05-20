import Binding from './Binding';
import { BindingProperties } from './BindingProperties';
import { BindingType } from './BindingType';
import { feedbackError, feedbackWarning } from './Feedback';
import File from './File';
import { FileFeedback, FileFeedbackType } from './FileFeedback';
import { getRegexMatchValue, pad } from './Utils';

let bindingTypeTextMap = {
  oneway: BindingType.oneWay,
  twoway: BindingType.twoWay,
  onewaysource: BindingType.oneWaySource
};

export class XMLTag {
  constructor(xmlElement: any, tagText: string, file: File) {
    if (!xmlElement || !tagText) {
      feedbackError(file, `Received corrupt XMLElement "${tagText}`, true);
    }

    this.startPosition = xmlElement.startTagPosition;
    this.endPosition = xmlElement.endTagPosition;

    this._file = file;
    this.bindings = this.getBindings(xmlElement, tagText);
    const regex = new RegExp('\"@\{.*}\"', 'gi');
    this.text = tagText.replace(regex, (m) => '""'.padEnd(m.length, ' '));
  }

  private _file: File;
  public bindings: Binding[];
  public hasBindings: boolean;
  public startPosition: number;
  public endPosition: number;
  public id: string;
  public text: string;

  public getBindings(xmlElement: any, tagText: string): Binding[] {
    const regex = new RegExp('^@\\{(.*)\\}', 'i');
    this.id = xmlElement.attr.id;
    const bindings = [];
    for (const attribute in xmlElement.attr) {
      if (attribute.toLowerCase() !== 'id') {
        const bindingText = getRegexMatchValue(xmlElement.attr[attribute], regex, 1);

        if (bindingText) {
          const parts = bindingText.split(',');
          const binding = new Binding();
          for (let i = 0; i < parts.length; i++) {
            this.parseBindingPart(i, parts[i].replace(/\s/g, ''), binding, tagText);
          }
          binding.nodeId = this.id;
          binding.nodeField = attribute;
          binding.validate();
          if (binding.isValid) {
            bindings.push(binding);
          } else {
            feedbackError(this._file, `Could parse binding for tag "${tagText}" at position: ${this.startPosition} \n reason: ${binding.errorMessage}`, true);
          }
        }
      }
    }
    this.hasBindings = bindings.length > 0;
    return bindings;
  }

  public parseBindingPart(index: number, partText: string, binding: Binding, tagText: string) {
    if (index === 0) {
      let bindingParts = partText.split('.');
      if (bindingParts.length === 2) {
        binding.observerId = bindingParts[0];
        binding.observerField = bindingParts[1];
        binding.isFunctionBinding = binding.observerField.endsWith('()');
      } else {
        feedbackError(this._file,
          `Could not parse binding details for field "${partText}" from tag "${tagText}" at position: ${this.startPosition}`, true);
      }
    } else if (partText.toLowerCase().includes('mode=')) {
      //mode
      let mode: BindingType = bindingTypeTextMap[partText.substring(5).toLowerCase()];
      if (mode) {
        binding.properties.type = mode;
      } else {
        feedbackWarning(this._file,
          `Could not parse binding mode for field "${partText}" from tag "${tagText}" at position: ${this.startPosition}`);
      }
    } else if (partText.toLowerCase().includes('transform=')) {
      //transform function
      let transformFunction = partText.substring(10);
      if (transformFunction.trim()) {
        binding.properties.transformFunction = transformFunction;
      } else {
        feedbackWarning(this._file,
          `Could not parse transformFunction for field "${partText}" from tag "${tagText}" at position: ${this.startPosition}`);
      }
    } else if (partText.toLowerCase().includes('issettinginitialvalue=')) {
      //transform function
      let isSettingInitialValueText = partText.substring(22).toLowerCase();
      if (isSettingInitialValueText.trim()) {
        binding.properties.isSettingInitialValue = isSettingInitialValueText === 'true';
      } else {
        feedbackWarning(this._file,
          `Could not parse isSettingInitialValueText for field "${partText}" from tag "${tagText}" at position: ${this.startPosition}`);
      }
    }
  }
}
