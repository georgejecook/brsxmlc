import { expect } from 'chai';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as path from 'path';

import File from '../fileProcessing/File';
import ProjectFileMap from '../fileProcessing/ProjectFileMap';
import { ProjectProcessor } from '../fileProcessing/ProjectProcessor';
import { getFeedbackErrors } from '../utils/Feedback';
import { resetFeedback } from '../utils/Feedback';
import { getRegexMatchesValues } from '../utils/Utils';
import NamespaceProcessor from './NamespaceProcessor';

const chaiSubset = require('chai-subset');
chai.use(chaiSubset);

let config = require('../../test/testProcessorConfig.json');
let processor: ProjectProcessor;
let namespaceProcessor: NamespaceProcessor;
let fileMap: ProjectFileMap;

describe('Include importProcessor', function() {
  beforeEach( async () => {
    resetFeedback();
    fileMap = new ProjectFileMap();
    config = _.clone(config);
    processor = new ProjectProcessor(config, fileMap);
    processor.clearFiles();
    processor.copyFiles();
    await processor.createFiles();
    namespaceProcessor = new NamespaceProcessor(processor);
  });

  describe('NamespaceProcessor', function() {
    describe('Initialization', function() {
      it('correctly applies namespace', function() {
        const file = processor.fileMap.getFileByPkgPath('source/namespaced/namespaced1.brs');
        namespaceProcessor.applyNamespaceToFile(file);
        expect(file.isDirty).to.be.true;
      });
    });
  });
});
