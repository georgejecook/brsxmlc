#!/usr/bin/env node
const program = require('commander');
const ProjectProcessor = require('./src/lib/ProjectProcessor');
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
		console.log("Loaded config " + inspect(config));
		let processor = new ProjectProcessor(sourcePath, targetPath, null, config);
		processor.processFiles();
	});

program.parse(process.argv);