import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as XLSX from 'xlsx';
import { parseTransactionsFromSpreadsheet } from './spreadsheet-preview.js';

describe('parseTransactionsFromSpreadsheet', () => {
  it('extracts rows from a header-based spreadsheet', () => {
    const buffer = workbookBuffer([
      ['ignored title'],
      ['Fecha', 'Concepto', 'Descripción', 'Cargo', 'Abono', 'Saldo'],
      [
        '10/04/2025',
        'Compra tarjeta',
        'LIDL BARCELONA',
        '-47,29 EUR',
        '',
        '1.234,56 EUR',
      ],
      [
        '12/04/2025',
        'Ingreso',
        'BONPREU MARKET',
        '',
        '17,25 EUR',
        '1.251,81 EUR',
      ],
    ]);
    const preview = parseTransactionsFromSpreadsheet(buffer);

    assert.equal(preview.rows.length, 2);
    assert.deepEqual(preview.rows[0], {
      date: '2025-04-10',
      description: 'LIDL BARCELONA',
      concept: 'Compra tarjeta',
      amount: '47.29',
      type: 'expense',
      rawText:
        'Sheet1 R3: 10/04/2025 | Compra tarjeta | LIDL BARCELONA | -47,29 EUR |  | 1.234,56 EUR',
    });
    assert.deepEqual(preview.rows[1], {
      date: '2025-04-12',
      description: 'BONPREU MARKET',
      concept: 'Ingreso',
      amount: '17.25',
      type: 'income',
      rawText:
        'Sheet1 R4: 12/04/2025 | Ingreso | BONPREU MARKET |  | 17,25 EUR | 1.251,81 EUR',
    });
    assert.match(preview.textPreview, /Concepto/);
    assert.match(preview.textPreview, /Descripción/);
  });

  it('falls back to row text parsing when headers are not detected', () => {
    const buffer = workbookBuffer([
      ['10/04/2025', 'COMPRA TARGETA', 'LIDL BARCELONA', '-47,29 EUR'],
    ]);
    const preview = parseTransactionsFromSpreadsheet(buffer);

    assert.equal(preview.rows.length, 1);
    assert.equal(preview.rows[0]?.date, '2025-04-10');
    assert.equal(preview.rows[0]?.description, 'COMPRA TARGETA LIDL BARCELONA');
    assert.equal(preview.rows[0]?.amount, '47.29');
    assert.equal(preview.rows[0]?.type, 'expense');
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
