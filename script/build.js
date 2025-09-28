import { execa }  from 'execa';
import fse from 'fs-extra';
import mustache from 'mustache';
import { execSync } from 'child_process';
import path from 'path';

async function render() {
  const { stdout: lastModifyTime } = await execa('date -u +"%Y-%m-%dT%H:%M:%SZ"', { shell: true });
  const packageDoc = mustache.render(
    fse.readFileSync('src/OEBPS/content.opf', 'utf8'),
    { lastModifyTime }
  );
  return packageDoc;
}

async function main() {
  const EPUB_FILENAME = 'The_Stranger.epub';
  const DIST_EPUB_PATH = `dist/${EPUB_FILENAME}`;
  const TEMP_DIR = 'dist/temp';

  fse.ensureDirSync('./dist');
  
  const [packageDoc] = await Promise.all([
    render(),
    fse.stat(TEMP_DIR)
      .then(() => fse.rm(TEMP_DIR, { recursive: true }))
      .catch(() => null)
      .then(() => fse.copy('./src', TEMP_DIR))
      .catch(err => { throw err; }),
    fse.stat(DIST_EPUB_PATH).then(() => fse.rm(DIST_EPUB_PATH)).catch(() => null),
  ]);
  
  fse.writeFileSync(path.join(TEMP_DIR, 'OEBPS/content.opf'), packageDoc);

  execSync(`zip -X ../${EPUB_FILENAME} mimetype`, { cwd: TEMP_DIR });
  execSync(`zip -rg ../${EPUB_FILENAME} META-INF OEBPS`, { cwd: TEMP_DIR });
  fse.rmSync(TEMP_DIR, { recursive: true });
}

main();
