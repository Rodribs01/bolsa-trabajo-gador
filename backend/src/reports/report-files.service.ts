import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { readFileSync } from 'fs';
import { join } from 'path';
import pdfMake = require('pdfmake');
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { ReportData } from './reports.service.js';

const GUINDA = '#771013';
const PDF_FONTS = [
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
];
const STRIPE_COLORS = [
  '#771013',
  '#e0b23c',
  '#1f3b8f',
  '#e0b23c',
  '#2e7d32',
  '#9c5a1a',
];
interface StripeRect {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const INSTITUTION = 'GOBIERNO AUTÓNOMO DEPARTAMENTAL DE ORURO';
const UNIT = 'Unidad de Sistemas e Informática';
const SYSTEM = 'Bolsa de Trabajo Departamental · Plaza 10 de Febrero, Oruro';

@Injectable()
export class ReportFilesService {
  private readonly coatOfArms: Buffer;

  constructor() {
    this.coatOfArms = readFileSync(join(process.cwd(), 'assets', 'escudo.png'));
    pdfMake.setFonts({
      Helvetica: {
        normal: PDF_FONTS[0],
        bold: PDF_FONTS[1],
        italics: PDF_FONTS[2],
        bolditalics: PDF_FONTS[3],
      },
    });
    pdfMake.setUrlAccessPolicy(() => false);
    pdfMake.setLocalAccessPolicy((path) => PDF_FONTS.includes(path));
  }

  async buildPdf(report: ReportData, issuedBy: string): Promise<Buffer> {
    const pageWidth = report.landscape ? 842 - 80 : 595 - 80;
    let totalWidth = 0;
    for (const column of report.columns) {
      totalWidth += column.width;
    }
    const availableWidth = pageWidth - report.columns.length * 9;
    const widths: number[] = [];
    for (const column of report.columns) {
      widths.push(Math.floor((availableWidth * column.width) / totalWidth));
    }

    const header: Content[] = [];
    for (const column of report.columns) {
      header.push({ text: column.header, bold: true, color: '#ffffff' });
    }
    const body: Content[][] = [header];
    for (const row of report.rows) {
      const cells: Content[] = [];
      for (const value of row) {
        cells.push({ text: String(value) });
      }
      body.push(cells);
    }

    let table: Content;
    if (report.rows.length === 0) {
      table = {
        text: 'No hay registros con estos filtros.',
        italics: true,
        color: '#5c636a',
        margin: [0, 10, 0, 10],
      };
    } else {
      table = {
        table: { headerRows: 1, widths: widths, body: body },
        layout: {
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0) {
              return GUINDA;
            }
            if (rowIndex % 2 === 0) {
              return '#f5f5f5';
            }
            return null;
          },
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#dddddd',
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      };
    }

    const document: TDocumentDefinitions = {
      pageSize: 'A4',
      pageOrientation: report.landscape ? 'landscape' : 'portrait',
      pageMargins: [40, 40, 40, 50],
      defaultStyle: { font: 'Helvetica', fontSize: 8.5 },
      info: { title: report.title, author: 'G.A.D.OR.' },
      footer: (currentPage: number, pageCount: number) => {
        return {
          margin: [40, 15, 40, 0],
          columns: [
            {
              width: '*',
              text: 'Documento emitido por el sistema Bolsa de Trabajo Departamental · G.A.D.OR.',
              fontSize: 7.5,
              color: '#5c636a',
            },
            {
              width: 80,
              text: `Página ${currentPage} de ${pageCount}`,
              alignment: 'right',
              fontSize: 7.5,
              bold: true,
            },
          ],
        };
      },
      content: [
        {
          columns: [
            {
              image: `data:image/png;base64,${this.coatOfArms.toString('base64')}`,
              width: 48,
            },
            {
              width: '*',
              margin: [10, 4, 0, 0],
              stack: [
                { text: INSTITUTION, bold: true, color: GUINDA, fontSize: 11 },
                { text: UNIT, bold: true, fontSize: 10, margin: [0, 2, 0, 2] },
                { text: SYSTEM, color: '#5c636a', fontSize: 8 },
              ],
            },
            {
              width: 150,
              margin: [0, 6, 0, 0],
              alignment: 'right',
              fontSize: 8,
              color: '#5c636a',
              stack: [
                `Fecha de emisión: ${this.formatNow()}`,
                `Emitido por: ${issuedBy}`,
              ],
            },
          ],
        },
        {
          canvas: this.stripe(pageWidth),
          margin: [0, 10, 0, 14],
        },
        {
          text: report.title.toUpperCase(),
          bold: true,
          fontSize: 13,
          alignment: 'center',
        },
        {
          text: report.filters,
          color: '#5c636a',
          alignment: 'center',
          margin: [0, 3, 0, 12],
        },
        table,
        {
          margin: [0, 12, 0, 0],
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: [{ text: 'Resumen: ', bold: true }, report.summary],
                  fillColor: '#f1f1f3',
                  margin: [6, 4, 6, 4],
                },
              ],
            ],
          },
          layout: 'noBorders',
        },
      ],
    };

    return pdfMake.createPdf(document).getBuffer();
  }

  async buildExcel(report: ReportData, issuedBy: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bolsa de Trabajo Departamental';
    const sheet = workbook.addWorksheet('Reporte', {
      pageSetup: {
        paperSize: 9,
        orientation: report.landscape ? 'landscape' : 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    const widths: { width: number }[] = [];
    for (const column of report.columns) {
      widths.push({ width: column.width });
    }
    sheet.columns = widths;
    const lastColumn = report.columns.length;

    const imageId = workbook.addImage({
      base64: this.coatOfArms.toString('base64'),
      extension: 'png',
    });
    sheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 48, height: 52 },
    });

    sheet.getCell(1, 2).value = INSTITUTION;
    sheet.getCell(1, 2).font = {
      bold: true,
      size: 13,
      color: { argb: 'FF771013' },
    };
    sheet.getCell(2, 2).value = UNIT;
    sheet.getCell(2, 2).font = { bold: true };
    sheet.getCell(3, 2).value = SYSTEM;
    sheet.getCell(3, 2).font = { color: { argb: 'FF5C636A' }, size: 9 };

    sheet.getCell(5, 1).value = report.title.toUpperCase();
    sheet.getCell(5, 1).font = { bold: true, size: 13 };
    sheet.getCell(6, 1).value = report.filters;
    sheet.getCell(7, 1).value =
      `Fecha de emisión: ${this.formatNow()} · Emitido por: ${issuedBy}`;
    sheet.getCell(6, 1).font = { color: { argb: 'FF5C636A' } };
    sheet.getCell(7, 1).font = { color: { argb: 'FF5C636A' } };

    const headerValues: string[] = [];
    for (const column of report.columns) {
      headerValues.push(column.header);
    }
    const headerRow = sheet.getRow(9);
    headerRow.values = headerValues;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    for (let i = 1; i <= lastColumn; i++) {
      headerRow.getCell(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF771013' },
      };
    }

    let rowNumber = 10;
    for (const values of report.rows) {
      sheet.getRow(rowNumber).values = values;
      rowNumber++;
    }
    if (report.rows.length > 0) {
      sheet.autoFilter = {
        from: { row: 9, column: 1 },
        to: { row: rowNumber - 1, column: lastColumn },
      };
    } else {
      sheet.getCell(rowNumber, 1).value = 'No hay registros con estos filtros.';
      rowNumber++;
    }

    const summaryCell = sheet.getCell(rowNumber + 1, 1);
    summaryCell.value = `Resumen: ${report.summary}`;
    summaryCell.font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 9 }];

    const data = await workbook.xlsx.writeBuffer();
    return Buffer.from(data);
  }

  private stripe(width: number): StripeRect[] {
    const rectangles: StripeRect[] = [];
    let x = 0;
    let index = 0;
    while (x < width) {
      const blockWidth = Math.min(14, width - x);
      rectangles.push({
        type: 'rect',
        x: x,
        y: 0,
        w: blockWidth,
        h: 4,
        color: STRIPE_COLORS[index % STRIPE_COLORS.length],
      });
      x += blockWidth;
      index++;
    }
    return rectangles;
  }

  private formatNow(): string {
    return new Date().toLocaleString('es-BO', {
      timeZone: 'America/La_Paz',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
