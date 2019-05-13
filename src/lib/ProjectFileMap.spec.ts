import { expect } from 'chai';

import File from './File';
import Namespace from './NameSpace';
import ProjectFileMap from './ProjectFileMap';

let config = require('../test/testProcessorConfig.json');

describe('Project File map', function() {
  describe('Initialization', function() {
    it('correctly initializes with empty files and import dictionary', function() {
      const fileMap = new ProjectFileMap();
      expect(fileMap.allFiles).to.be.empty;
      expect(fileMap.allNamespaces).to.be.empty;
    });

    it('correctly initializes with preset files and import dictionary, which are used for unit testing', function() {
      const file = new File('fsPath', 'projectPath', 'filename.brs', '.brs');
      const ns = new Namespace('T', 'Test', file);
      file.namespace = ns;

      const fileMap = new ProjectFileMap();
      fileMap.addFile(file);
      expect(fileMap.getFileByPkgPath('projectPath/filename.brs')).to.equal(file);
      expect(fileMap.getNamespaceByName('T')).to.equal(ns);
    });
  });
});
