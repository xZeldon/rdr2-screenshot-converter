import path from 'path';
import { homedir, platform } from 'os';
import { spawn } from 'child_process';
import { trim } from 'buffertrim';
import fs from 'fs';
import chalk from 'chalk';

process.stdin.resume(); // to prevent the instantaneous closure of the script

const PROFILE_PATH = path.join(homedir(), 'Documents', 'Rockstar Games', 'Red Dead Redemption 2', 'Profiles');
const EXPORT_PATH = path.join(homedir(), 'Documents', 'RDR2_Screenshots'); //.replace(/\\/g, '\\\\')

const removeZeroBytes = (buffer: Buffer): string => {
  const result = JSON.stringify(trim(buffer).toString().trim()).replace(/\\u0000/gm, '');
  return JSON.parse(result);
};

const main = (profilePath: Array<string>): void => {
  const prdr3s = [];

  for (const i in profilePath) {
    const currentFile = fs.readdirSync(profilePath[i]);

    for (const x in currentFile) {
      if (currentFile[x].substr(0, 5) == 'PRDR3') {
        prdr3s.push(path.join(profilePath[i], currentFile[x]));
      }
    }
  }

  if (prdr3s.length <= 0) {
    console.log(`${chalk.red('Скриншотов для экспорта не найдено')}`);
    return;
  }

  console.log(`${chalk.green(`${chalk.bold.green(`Найден(о) ${prdr3s.length} скриншот(ов)`)}\nКонвертируем...`)}`);

  const images = [];

  for (const i in prdr3s) {
    const currentFile = fs.readFileSync(prdr3s[i]);
    const image = trim(currentFile.slice(currentFile.indexOf('JPEG') + 12, currentFile.indexOf('JSON')));

    let metadata = removeZeroBytes(currentFile.slice(currentFile.indexOf('JSON') + 5, currentFile.indexOf('TITL')));
    metadata = JSON.parse(metadata);

    images.push({
      metadata,
      image
    });
  }

  fs.mkdir(EXPORT_PATH, { recursive: true }, err => {
    if (err) throw err;
  });

  for (const i in images) {
    const currentItem = images[i];

    fs.writeFileSync(path.join(EXPORT_PATH, currentItem.metadata.uid + '.jpg'), currentItem.image);
  }

  console.log(`${chalk.bold.green(`${chalk.blackBright('Удаляем мусор...')}\nУспешный экспорт! Скриншоты сохранены по пути ${chalk.blue(`${EXPORT_PATH}`)}`)}`);

  for (const x of prdr3s) {
    fs.unlinkSync(x);
  }

  if (platform() === 'win32') {
    const p = spawn('explorer', [EXPORT_PATH]);

    p.on('error', err => {
      p.kill();
      if (err) throw err;
    });
  }
};

if (fs.existsSync(PROFILE_PATH)) {
  const profiles = fs.readdirSync(PROFILE_PATH);

  if (profiles.length > 0) {
    main(profiles.map(x => path.join(PROFILE_PATH, x)));

  } else {
    console.log(`[${chalk.bold.red('ОШИБКА')}] => Профили не найдены. Вы должны запустить игру хотя бы один раз!`);
  }

} else {
  console.log(`[${chalk.bold.red('ОШИБКА')}] => Похоже, что Red Dead Redemption 2 не установлена на вашем компьютере, папка с игрой не обнаружена по пути ${PROFILE_PATH}`);
}
