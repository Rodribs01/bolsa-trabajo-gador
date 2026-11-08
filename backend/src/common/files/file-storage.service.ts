import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createReadStream, existsSync, ReadStream } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

const PDF_HEADER = '%PDF';
const PNG_HEADER = '89504e47';
const JPEG_HEADER = 'ffd8ff';

@Injectable()
export class FileStorageService {
  constructor(private readonly config: ConfigService) {}

  isPdf(file: Express.Multer.File): boolean {
    const header = file.buffer.subarray(0, 4).toString();
    return file.mimetype === 'application/pdf' && header === PDF_HEADER;
  }

  isImage(file: Express.Multer.File): boolean {
    const header = file.buffer.subarray(0, 4).toString('hex');
    const isPng = file.mimetype === 'image/png' && header === PNG_HEADER;
    const isJpeg =
      file.mimetype === 'image/jpeg' && header.startsWith(JPEG_HEADER);
    return isPng || isJpeg;
  }

  async save(folder: string, file: Express.Multer.File): Promise<string> {
    const directory = join(this.root(), folder);
    await mkdir(directory, { recursive: true });

    const fileName = `${randomUUID()}${this.extensionOf(file)}`;
    await writeFile(join(directory, fileName), file.buffer);
    return fileName;
  }

  async delete(folder: string, fileName: string): Promise<void> {
    await rm(join(this.root(), folder, fileName), { force: true });
  }

  open(folder: string, fileName: string): ReadStream | null {
    const path = join(this.root(), folder, fileName);
    if (!existsSync(path)) {
      return null;
    }
    return createReadStream(path);
  }

  private root(): string {
    return resolve(this.config.get<string>('UPLOADS_DIR') ?? 'uploads');
  }

  private extensionOf(file: Express.Multer.File): string {
    if (file.mimetype === 'application/pdf') {
      return '.pdf';
    }
    if (file.mimetype === 'image/png') {
      return '.png';
    }
    return '.jpg';
  }
}
