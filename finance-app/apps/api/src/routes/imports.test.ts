import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Fastify from 'fastify';
import * as XLSX from 'xlsx';
import { registerImportRoutes } from './imports.js';
import type { HistoricalTransaction } from '../lib/pdf-preview.js';

const historicalRows: HistoricalTransaction[] = [
  {
    id: 'expense-1',
    date: '2025-04-08',
    amount: '17.25',
    description: 'Bonpreu supermarket',
    category: 'MENJAR',
    subcategory: 'Supermercat',
    account: 'shared',
    type: 'expense',
  },
];

describe('registerImportRoutes', () => {
  it('returns preview rows for an uploaded PDF body', async () => {
    const app = Fastify({ logger: false });

    await app.register(registerImportRoutes, {
      extractPdfText: async () => '08/04/2025 BONPREU MARKET 17,25 EUR',
      fetchHistoricalTransactions: async () => historicalRows,
    });

    const response = await app.inject({
      body: Buffer.from('%PDF-1.4'),
      headers: {
        'content-type': 'application/pdf',
      },
      method: 'POST',
      url: '/pdf-preview',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json<{
      extractedTextLength: number;
      rowCount: number;
      textPreview: string;
      rows: Array<{
        suggestedDescription: string | null;
        suggestedCategory: string | null;
        suggestedSubcategory: string | null;
      }>;
    }>();

    assert.equal(payload.rowCount, 1);
    assert.ok(payload.extractedTextLength > 0);
    assert.match(payload.textPreview, /BONPREU MARKET/);
    assert.equal(payload.rows[0]?.suggestedDescription, 'Bonpreu supermarket');
    assert.equal(payload.rows[0]?.suggestedCategory, 'MENJAR');
    assert.equal(payload.rows[0]?.suggestedSubcategory, 'Supermercat');

    await app.close();
  });

  it('returns preview rows for an uploaded spreadsheet body', async () => {
    const app = Fastify({ logger: false });

    await app.register(registerImportRoutes, {
      fetchHistoricalTransactions: async () => historicalRows,
    });

    const response = await app.inject({
      body: workbookBuffer([
        ['Fecha', 'Concepto', 'Descripción', 'Importe'],
        ['08/04/2025', 'Compra tarjeta', 'Bonpreu supermarket', '17,25 EUR'],
      ]),
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      method: 'POST',
      url: '/spreadsheet-preview',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json<{
      rowCount: number;
      rows: Array<{
        concept?: string;
        description: string;
        type: 'expense' | 'income';
        suggestedDescription: string | null;
        suggestedCategory: string | null;
        suggestedSubcategory: string | null;
      }>;
    }>();

    assert.equal(payload.rowCount, 1);
    assert.equal(payload.rows[0]?.concept, 'Compra tarjeta');
    assert.equal(payload.rows[0]?.description, 'Bonpreu supermarket');
    assert.equal(payload.rows[0]?.type, 'income');
    assert.equal(payload.rows[0]?.suggestedDescription, 'Bonpreu supermarket');
    assert.equal(payload.rows[0]?.suggestedCategory, 'MENJAR');
    assert.equal(payload.rows[0]?.suggestedSubcategory, 'Supermercat');

    await app.close();
  });
});

function workbookBuffer(rows: string[][]): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'buffer',
  }) as Buffer;
}
