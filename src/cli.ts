#!/usr/bin/env node
import { ProcessorConfig } from './lib/ProcessorConfig';
import { ProjectProcessor } from './lib/ProjectProcessor';

const program = require('commander');
const inspect = require('util').inspect;

const pkg = require('../package.json');
const path = require('path');

program
  .version(pkg.version)
  .description('brsxmlc Preprocessor');

program
  .option('-c, --config [path]', 'Specify a config file to use.')
  .option('-p, --sourcePath [path]', 'Path to match files to process.')
  .option('-r, --rootPath [path]', 'Path to root directory.')
  .option('-o, --outputPath [path]', 'Path to output directory. This is where your project files will be written to')
  .option('-f, --filePattern [path]', 'array of globs to apply when ascertaining which files to to process')
  .alias('b')
  .description('build project')
  .action((options) => {
    console.log(`Processing....`);
    console.time('Finished in:');
    let config: ProcessorConfig;

    if (options.config) {
      try {
        config = require(path.resolve(process.cwd(), options.config));
      } catch (e) {
        console.log(e.message);
        process.exit(1);
      }

      if (!config.sourcePath) {
        console.log(`The config file you specified does not define the required "sourcePath" key.
Please read the docs for usage details https://github.com/georgejecook/brsxmlc/blob/master/docs/index.md`);
      }

      if (!config.sourcePath) {
        console.log(`The config file you specified does not define the required "outputPath" key.
Please read the docs for usage details https://github.com/georgejecook/brsxmlc/blob/master/docs/index.md`);
      }

    } else if (options.testPath) {
      config = {
        sourcePath: options.sourcepath,
        rootPath: options.rootPath || '',
        filePattern: options.filePattern || ['**/*.brs', '**/*.xml'],
        outputPath: options.outputPath || ''
      };
    } else {
      console.warn('You must specify either a config file or a test spec directory');
    }

    console.log(`Loaded config ${inspect(config)}`);
    let processor = new ProjectProcessor(config);
    processor.processFiles();
    console.timeEnd('Finished in:');
  });

program.parse(process.argv);
