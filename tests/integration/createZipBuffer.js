'use strict';

const fs = require('fs');
const AdmZip = require('adm-zip');

module.exports = () => {
	const zip = new AdmZip();
	const indexFile = fs.readFileSync(process.cwd() + '/index.js', {
		encoding: 'utf-8'
	});
	const packageJson = fs.readFileSync(process.cwd() + '/package.json', {
		encoding: 'utf-8'
	});

	zip.addFile('index.js', indexFile);
	zip.addFile('package.json', packageJson);
	zip.addLocalFolder(process.cwd() + '/node_modules', './node_modules');
	return zip.toBuffer();
};
