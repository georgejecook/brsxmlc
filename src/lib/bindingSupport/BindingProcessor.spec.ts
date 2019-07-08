import { expect } from 'chai';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as path from 'path';

import Binding from './Binding';
import { BindingProcessor } from './BindingProcessor';
import { BindingType } from './BindingType';
import { getFeedbackErrors, resetFeedback } from '../utils/Feedback';
import File from '../fileProcessing/File';
import ProjectFileMap from '../fileProcessing/ProjectFileMap';
import { ProjectProcessor } from '../fileProcessing/ProjectProcessor';

const chaiSubset = require('chai-subset');
chai.use(chaiSubset);

let config = require('../../test/testProcessorConfig.json');
let processor: ProjectProcessor;
let fileMap: ProjectFileMap;
let importFilesPath: string = path.join('components', 'screens', 'imports');
let projectPath: string = path.join(path.resolve(config.outputPath), importFilesPath);
let bindingProcessor: BindingProcessor;

describe('BindingProcessor', function() {
  beforeEach(async () => {
    resetFeedback();
    fileMap = new ProjectFileMap();
    config = _.clone(config);
    processor = new ProjectProcessor(config, fileMap);
    processor.clearFiles();
    processor.copyFiles();
    await processor.createFiles();
    bindingProcessor = new BindingProcessor(processor);
  });

  describe('Initialization', function() {
    it('initializes with valid processor', function() {
      expect(bindingProcessor).to.not.be.null;
    });
  });

  describe('addImportsToXmlFile file failures', function() {
    it('fails with brs file', function() {
      const file = createFile(importFilesPath, '.brs');
      expect(() => new BindingProcessor(processor).processFile(file)).to.throw(Error);
    });

    it('fails with other file', function() {
      const file = createFile(importFilesPath, '.png');
      expect(() => new BindingProcessor(processor).processFile(file)).to.throw(Error);
    });

    it('identifies simple one way binding', function() {
      const file = processor.fileMap.getFileByPkgPath('components/screens/bindings/BindingTest.xml');
      bindingProcessor.processFile(file);
      expect(file.bindings).to.have.lengthOf(11);
      let binding: Binding = file.bindings[0];
      expect(binding.nodeField).to.equal('text');
      expect(binding.nodeId).to.equal('titleLabel');
      expect(binding.observerField).to.equal('titleText');
      expect(binding.observerId).to.equal('vm');
      expect(binding.properties.type).to.equal(BindingType.oneWay);
      expect(binding.properties.transformFunction).to.equal('');
      expect(binding.properties.isSettingInitialValue).to.be.true;
      expect(getFeedbackErrors()).to.be.empty;
    });
  });
});

function createFile(path, extension) {
  return new File(config.outputPath, path, `test${extension}`, '.extension');
}
