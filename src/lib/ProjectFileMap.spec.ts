import { expect } from 'chai';

import FileDescriptor from './FileDescriptor';
import ProjectFileMap from './ProjectFileMap';
let config = require('../test/testProcessorConfig.json');

describe('Project File map', function() {
  describe('Initialization', function() {
    it('correctly initializes with empty files and import dictionary', function() {
      const fileMap = new ProjectFileMap(config);
      expect(fileMap.allFiles).to.be.empty;
      expect(fileMap.importDependencies).to.be.empty;
    });
    it('correctly initializes with preset files and import dictionary, which are used for unit testing', function() {
      const allFiles: Map<string, FileDescriptor> = new Map();
      allFiles.set('test', new FileDescriptor('dir', 'filename', '.brs'));
      const imports: Map<string, string[]> = new Map();
      imports.set('test', ['value', 'value2']);

      const fileMap = new ProjectFileMap(config, allFiles, imports);
      expect(fileMap.allFiles).to.equal(allFiles);
      expect(fileMap.importDependencies).to.equal(imports);
    });
  });
});
