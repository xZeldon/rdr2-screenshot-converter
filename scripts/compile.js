/* eslint-disable */
const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const ICON_PATH = './assets/icon.ico';
const COMPILED_FILE = 'dist/app.js';
const COMPILED_FILE_PATH = './dist/exe/RDR2-Converter.exe';
const RESOURCE_HACKER_PATH = path.join(__dirname, '../assets/ResourceHacker.exe');

let binariesPath;
let customizedBinariesPath;

process.env['RESOURCE_HACKER'] = RESOURCE_HACKER_PATH;

const main = async () => {
  console.log(chalk.green('Скачиваю библиотеки...'));
  await getPkgPackages();
  console.log(chalk.green('Кастомизирую...'));
  await customizeBinaries();
  console.log(chalk.greenBright('Компилирую кастомизированные библиотеки...'));
  child.execSync(`yarn run cross-env PKG_CACHE_PATH=./pkg-cache pkg ${COMPILED_FILE} --target win --output ${COMPILED_FILE_PATH}`);
  console.log(chalk.green('Удаляю мусор...'))
  deleteFolderRecursive('./pkg-cache')
  console.log(chalk.bold.green('Готово!'));
};

async function getPkgPackages() {

  if (!(fs.existsSync(customizedBinariesPath))) {
    await child.execSync(`yarn run cross-env PKG_CACHE_PATH=./pkg-cache pkg ${COMPILED_FILE} --target win --output temp.exe`);

    await createPaths();

    await fs.renameSync(binariesPath, customizedBinariesPath);
    fs.unlinkSync('temp.exe');
  }
};

async function customizeBinaries() {
  child.execSync(`${RESOURCE_HACKER_PATH} -open ${'./' + customizedBinariesPath} -save ${'./' + binariesPath} -action addoverwrite -res ${ICON_PATH} -mask ICONGROUP,1,`);
};

async function createPaths() {
  if (fs.existsSync('./pkg-cache')) {

    let binPath = fs.readdirSync('./pkg-cache');

    binPath = binPath.map(x => path.join('./pkg-cache', x));
    binPath = binPath.map(x => path.join(x, fs.readdirSync(x).toString())).toString();

    binariesPath = replaceWithForwardSlashes(binPath);
    customizedBinariesPath = replaceWithForwardSlashes(binPath.concat('.original'));
  }
}

function deleteFolderRecursive(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const currentDir = path.join(dir, file);
      if (fs.lstatSync(currentDir).isDirectory()) {
        deleteFolderRecursive(currentDir);
      } else {
        fs.unlinkSync(currentDir);
      }
    });
    fs.rmdirSync(dir);
  }
};

function replaceWithForwardSlashes(pathString) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(pathString);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(pathString);

  if (isExtendedLengthPath || hasNonAscii) {
    return pathString;
  }

  return pathString.replace(/\\/g, '/');
}

main();
