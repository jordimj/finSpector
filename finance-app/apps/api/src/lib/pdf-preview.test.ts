import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseTransactionsFromPdfText,
  suggestTransactionCategory,
  type HistoricalTransaction,
} from './pdf-preview.js';

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
  {
    id: 'expense-2',
    date: '2025-03-21',
    amount: '71.49',
    description: 'Electric utility monthly bill',
    category: 'DESPESES',
    subcategory: 'Llum',
    account: 'shared',
    type: 'expense',
  },
];

describe('parseTransactionsFromPdfText', () => {
  it('extracts transaction rows from noisy statement text', () => {
    const rows = parseTransactionsFromPdfText(`
      Account statement
      Date Description Amount
      08/04/2025 BONPREU MARKET 17,25 EUR
      loyalty text carried onto next line
      -- 1 of 2 --
      Page 1 of 2
      2025-04-09 RANDOM SHOP -10.99
    `);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      date: '2025-04-08',
      description: 'BONPREU MARKET loyalty text carried onto next line',
      amount: '17.25',
      type: 'income',
      rawText: '08/04/2025 BONPREU MARKET 17,25 EUR\nloyalty text carried onto next line',
    });
    assert.equal(rows[1]?.date, '2025-04-09');
    assert.equal(rows[1]?.amount, '10.99');
    assert.equal(rows[1]?.type, 'expense');
  });

  it('extracts transaction rows split across multiple lines', () => {
    const rows = parseTransactionsFromPdfText(`
      Fecha operación
      10/04/2025
      11/04/2025
      COMPRA TARGETA
      LIDL BARCELONA
      -47,29 EUR
      1.234,56 EUR
      12/04/2025
      BONPREU MARKET
      17,25 EUR
    `);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      date: '2025-04-10',
      description: 'COMPRA TARGETA LIDL BARCELONA',
      amount: '47.29',
      type: 'expense',
      rawText:
        '10/04/2025\n11/04/2025\nCOMPRA TARGETA\nLIDL BARCELONA\n-47,29 EUR\n1.234,56 EUR',
    });
    assert.deepEqual(rows[1], {
      date: '2025-04-12',
      description: 'BONPREU MARKET',
      amount: '17.25',
      type: 'income',
      rawText: '12/04/2025\nBONPREU MARKET\n17,25 EUR',
    });
  });
});

describe('suggestTransactionCategory', () => {
  it('suggests a category from a similar description and exact amount', () => {
    const suggestion = suggestTransactionCategory(
      {
        date: '2024-02-01',
        description: 'Bonpreu supermarket',
        amount: '17.25',
        type: 'expense',
        rawText: 'Bonpreu supermarket',
      },
      historicalRows,
    );

    assert.equal(suggestion.suggestedCategory, 'MENJAR');
    assert.equal(suggestion.suggestedSubcategory, 'Supermercat');
    assert.equal(suggestion.suggestedDescription, 'Bonpreu supermarket');
    assert.equal(suggestion.matchedAmount, '17.25');
    assert.ok(suggestion.confidence >= 70);
  });

  it('does not suggest categories from a different transaction type', () => {
    const suggestion = suggestTransactionCategory(
      {
        date: '2024-02-01',
        description: 'Bonpreu supermarket',
        amount: '17.25',
        type: 'income',
        rawText: 'Bonpreu supermarket',
      },
      historicalRows,
    );

    assert.equal(suggestion.suggestedCategory, null);
    assert.equal(suggestion.suggestedSubcategory, null);
    assert.equal(suggestion.suggestedDescription, null);
  });

  it('suggests skipping when Splitwise already has the exact amount soon after', () => {
    const suggestion = suggestTransactionCategory(
      {
        date: '2024-02-01',
        description: 'Bonpreu supermarket',
        amount: '17.25',
        type: 'expense',
        rawText: 'Bonpreu supermarket',
      },
      [
        ...historicalRows,
        {
          id: 'splitwise-1',
          date: '2024-02-10',
          amount: '17.25',
          description: 'Splitwise Bonpreu share',
          category: 'DESPESES',
          subcategory: 'Splitwise',
          account: 'splitwise',
          type: 'expense',
        },
      ],
    );

    assert.equal(suggestion.skipped, true);
    assert.equal(suggestion.suggestedCategory, null);
    assert.equal(suggestion.suggestedSubcategory, null);
    assert.equal(suggestion.suggestedDescription, null);
    assert.equal(suggestion.matchedDescription, 'Splitwise Bonpreu share');
    assert.equal(suggestion.matchedAmount, '17.25');
    assert.equal(suggestion.matchedDate, '2024-02-10');
    assert.match(suggestion.matchReason, /Splitwise exact amount/);
  });

  it('keeps suggesting a category when Splitwise is outside the skip window', () => {
    const suggestion = suggestTransactionCategory(
      {
        date: '2024-02-01',
        description: 'Bonpreu supermarket',
        amount: '17.25',
        type: 'expense',
        rawText: 'Bonpreu supermarket',
      },
      [
        ...historicalRows,
        {
          id: 'splitwise-late',
          date: '2024-02-16',
          amount: '17.25',
          description: 'Late Splitwise Bonpreu share',
          category: 'DESPESES',
          subcategory: 'Splitwise',
          account: 'splitwise',
          type: 'expense',
        },
      ],
    );

    assert.equal(suggestion.skipped, undefined);
    assert.equal(suggestion.suggestedCategory, 'MENJAR');
    assert.equal(suggestion.suggestedSubcategory, 'Supermercat');
  });

  it('prefers historical bank concept before falling back to description', () => {
    const suggestion = suggestTransactionCategory(
      {
        date: '2025-05-03',
        description: 'COMPRA TARGETA LIDL BARCELONA',
        amount: '47.29',
        type: 'expense',
        rawText: 'COMPRA TARGETA LIDL BARCELONA',
      },
      [
        {
          id: 'expense-bank-concept',
          date: '2025-04-12',
          amount: '47.29',
          description: 'Edited grocery description',
          bankConcept: 'COMPRA TARGETA LIDL BARCELONA',
          category: 'MENJAR',
          subcategory: 'Supermercat',
          account: 'shared',
          type: 'expense',
        },
        {
          id: 'expense-description',
          date: '2025-04-13',
          amount: '47.29',
          description: 'COMPRA TARGETA LIDL BARCELONA',
          bankConcept: null,
          category: 'OTHER',
          subcategory: null,
          account: 'shared',
          type: 'expense',
        },
      ],
    );

    assert.equal(suggestion.suggestedCategory, 'MENJAR');
    assert.equal(suggestion.suggestedSubcategory, 'Supermercat');
    assert.equal(suggestion.suggestedDescription, 'Edited grocery description');
    assert.equal(suggestion.matchedDescription, 'COMPRA TARGETA LIDL BARCELONA');
    assert.match(suggestion.matchReason, /bank concept/);
  });

  it('leaves weak matches for manual review', () => {
    const suggestion = suggestTransactionCategory(
      {
        date: '2024-02-01',
        description: 'Completely unknown merchant',
        amount: '17.25',
        type: 'income',
        rawText: 'Completely unknown merchant',
      },
      historicalRows,
    );

    assert.equal(suggestion.suggestedCategory, null);
    assert.equal(suggestion.suggestedSubcategory, null);
    assert.equal(suggestion.suggestedDescription, null);
  });
});
