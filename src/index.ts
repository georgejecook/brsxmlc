#!/usr/bin/env node
import ProjectProcessor from './lib/ProjectProcessor';
const program = require('commander');
const fs = require('fs');
const inspect = require('util').inspect;

program
  .version('0.0.1')
  .description('Roku Channel Preprocessor');

program
  .command('build <sourcePath> <targetPath> <config>')
  .alias('b')
  .description('build project')
  .action((sourcePath, targetPath, configFile) => {
    let config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    console.log(`Loaded config ${inspect(config)}`);
    let processor = new ProjectProcessor(config);
    processor.processFiles();
  });

program.parse(process.argv);
