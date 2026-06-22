import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Fastify from 'fastify';
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
        suggestedCategory: string | null;
        suggestedSubcategory: string | null;
      }>;
    }>();

    assert.equal(payload.rowCount, 1);
    assert.ok(payload.extractedTextLength > 0);
    assert.match(payload.textPreview, /BONPREU MARKET/);
    assert.equal(payload.rows[0]?.suggestedCategory, 'MENJAR');
    assert.equal(payload.rows[0]?.suggestedSubcategory, 'Supermercat');

    await app.close();
  });
});
