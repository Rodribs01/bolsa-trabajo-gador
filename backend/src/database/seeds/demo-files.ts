import { config } from 'dotenv';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

config({ path: ['../.env', '.env'], quiet: true });

const FILES: [string, string][] = [
  ['demo-foto-postulante.png', 'public/photos'],
  ['demo-logo-sistemas.png', 'public/logos'],
  ['demo-logo-minera.png', 'public/logos'],
  ['demo-cv-postulante.pdf', 'private/cvs'],
  ['demo-cv-generico.pdf', 'private/cvs'],
  ['demo-nit-sistemas.pdf', 'private/documents'],
  ['demo-nit-minera.pdf', 'private/documents'],
  ['demo-nit-comercial.pdf', 'private/documents'],
];

// El disco del hosting gratuito se borra al reiniciar, por eso los archivos de la demo se vuelven a copiar
function copyDemoFiles(): void {
  const source = join(process.cwd(), 'src', 'database', 'seeds', 'files');
  const uploads = resolve(process.env.UPLOADS_DIR ?? 'uploads');
  let copied = 0;
  for (const [fileName, folder] of FILES) {
    const directory = join(uploads, folder);
    const target = join(directory, fileName);
    if (existsSync(target)) {
      continue;
    }
    mkdirSync(directory, { recursive: true });
    copyFileSync(join(source, fileName), target);
    copied++;
  }
  console.log(`Archivos de demostración copiados: ${copied}`);
}

copyDemoFiles();
