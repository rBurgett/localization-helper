const fs = require('fs-extra'),
    path = require('path'),
    { exec } = require('child_process'),
    colors = require('colors/safe');

console.log('\nGenerating .deb installer');

const packageJSON = fs.readJsonSync('package.json');
const { version } = packageJSON;
const dmgBasePath = 'build-native';

const buildPath = path.join('build-native', 'LocalizationHelper', 'linux64');
const arch = 64;

const fileName = `LocalizationHelper_v${version}_${arch}bit.deb`;
fs.ensureFileSync(path.join(dmgBasePath, fileName));
fs.removeSync(path.join(dmgBasePath, fileName));

const newPackageJSON = Object.assign(
    {},
    packageJSON,
    {node_deb: {
        user: 'localization-helper-user',
        group: 'localization-helper-group',
        start_command: './LocalizationHelper'
    }}
);
fs.writeFileSync(
    path.join(buildPath, 'package.json'),
    JSON.stringify(newPackageJSON, null, '  '),
    {encoding: 'utf8'}
);
const process = exec('node-deb -- **', {
    cwd: buildPath
});
// process.stdout.setEncoding('utf8');
// process.stdout.on('data', data => console.log(data));
// process.stderr.on('data', data => console.log(data));
process.on('error', err => console.error(err));
process.on('close', () => {
    fs.move(
        path.join(buildPath, `LocalizationHelper_${version}_all.deb`),
        path.join(dmgBasePath, fileName),
        err => {
            if(err) {
                console.error(err);
            } else {
                console.log(colors.green('\n\nSuccessfully compiled .deb installer.\n'));
            }
        }
    );
});
