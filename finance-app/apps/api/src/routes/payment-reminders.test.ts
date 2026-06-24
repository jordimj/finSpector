import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  detectPaymentReminderCandidates,
  generatePaymentReminderOccurrences,
  getOpenPaymentOccurrenceState,
  isPaymentReminderExpenseMatch,
  toReminderCandidateKey,
  type CandidateExpenseInput,
  type PaymentReminderForOccurrence,
} from './payment-reminders.js';

const reminder: PaymentReminderForOccurrence = {
  account: 'mine',
  amount: '42.00',
  amountTolerance: '5.00',
  cadence: 'monthly',
  category: 'Utilities',
  categoryId: 10,
  dueDay: 31,
  id: 'reminder-1',
  leadDays: 7,
  matchText: 'internet',
  name: 'Internet',
  startDate: '2026-01-01',
  subcategory: null,
  subcategoryId: null,
};

describe('payment reminder occurrences', () => {
  it('clamps month-end due days and computes due states', () => {
    const occurrences = generatePaymentReminderOccurrences(
      reminder,
      '2026-01-01',
      '2026-03-31',
      '2026-02-22',
    );

    assert.deepEqual(
      occurrences.map((occurrence) => [
        occurrence.dueDate,
        occurrence.state,
      ]),
      [
        ['2026-01-31', 'overdue'],
        ['2026-02-28', 'dueSoon'],
        ['2026-03-31', 'upcoming'],
      ],
    );
  });

  it('uses lead days for due-soon boundaries', () => {
    assert.equal(
      getOpenPaymentOccurrenceState('2026-04-08', '2026-04-01', 7),
      'dueSoon',
    );
    assert.equal(
      getOpenPaymentOccurrenceState('2026-04-09', '2026-04-01', 7),
      'upcoming',
    );
  });

  it('generates quarterly and annual due dates from the start month', () => {
    const quarterly = generatePaymentReminderOccurrences(
      {
        ...reminder,
        cadence: 'quarterly',
        startDate: '2026-02-01',
      },
      '2026-01-01',
      '2026-12-31',
      '2026-01-01',
    );
    const annually = generatePaymentReminderOccurrences(
      {
        ...reminder,
        cadence: 'annually',
        startDate: '2026-02-01',
      },
      '2026-01-01',
      '2028-12-31',
      '2026-01-01',
    );

    assert.deepEqual(
      quarterly.map((occurrence) => occurrence.dueDate),
      ['2026-02-28', '2026-05-31', '2026-08-31', '2026-11-30'],
    );
    assert.deepEqual(
      annually.map((occurrence) => occurrence.dueDate),
      ['2026-02-28', '2027-02-28', '2028-02-29'],
    );
  });

  it('generates one occurrence for a one-time reminder', () => {
    const occurrences = generatePaymentReminderOccurrences(
      {
        ...reminder,
        cadence: 'oneTime',
        startDate: '2026-05-17',
      },
      '2026-05-01',
      '2026-06-30',
      '2026-05-10',
    );
    const outsideWindow = generatePaymentReminderOccurrences(
      {
        ...reminder,
        cadence: 'oneTime',
        startDate: '2026-05-17',
      },
      '2026-06-01',
      '2026-06-30',
      '2026-05-10',
    );

    assert.deepEqual(
      occurrences.map((occurrence) => [occurrence.dueDate, occurrence.state]),
      [['2026-05-17', 'dueSoon']],
    );
    assert.equal(outsideWindow.length, 0);
  });
});

describe('payment reminder candidates', () => {
  const rows: CandidateExpenseInput[] = [
    expense('2026-01-05', '39.90'),
    expense('2026-02-06', '40.10'),
    expense('2026-03-05', '40.00'),
    expense('2026-04-05', '40.20'),
  ];

  it('detects stable monthly expenses from history', () => {
    const candidates = detectPaymentReminderCandidates(
      rows,
      new Set(),
      new Set(),
      '2026-04-20',
    );

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0]?.amount, '40.05');
    assert.equal(candidates[0]?.cadence, 'monthly');
    assert.equal(candidates[0]?.dueDay, 5);
    assert.equal(candidates[0]?.monthCount, 4);
    assert.equal(candidates[0]?.nextDueDate, '2026-05-05');
  });

  it('suppresses existing and dismissed candidate keys', () => {
    const key = toReminderCandidateKey({
      account: 'mine',
      categoryId: 10,
      matchText: 'streaming service',
      subcategoryId: null,
    });

    assert.equal(
      detectPaymentReminderCandidates(rows, new Set([key])).length,
      0,
    );
    assert.equal(
      detectPaymentReminderCandidates(rows, new Set(), new Set([key])).length,
      0,
    );
  });

  it('rejects unstable amounts', () => {
    const candidates = detectPaymentReminderCandidates(
      [...rows.slice(0, 3), expense('2026-04-05', '120.00')],
      new Set(),
      new Set(),
      '2026-04-20',
    );

    assert.equal(candidates.length, 0);
  });

  it('detects stable quarterly and annual expenses from history', () => {
    const quarterlyCandidates = detectPaymentReminderCandidates(
      [
        expense('2025-01-15', '90.00'),
        expense('2025-04-15', '91.00'),
        expense('2025-07-16', '89.50'),
        expense('2025-10-15', '90.50'),
      ],
      new Set(),
      new Set(),
      '2025-10-20',
    );
    const annualCandidates = detectPaymentReminderCandidates(
      [expense('2024-06-10', '300.00'), expense('2025-06-11', '305.00')],
      new Set(),
      new Set(),
      '2025-06-20',
    );

    assert.equal(quarterlyCandidates[0]?.cadence, 'quarterly');
    assert.equal(quarterlyCandidates[0]?.nextDueDate, '2026-01-15');
    assert.equal(annualCandidates[0]?.cadence, 'annually');
    assert.equal(annualCandidates[0]?.nextDueDate, '2026-06-11');
  });
});

describe('payment reminder matching', () => {
  it('matches within date and amount tolerances', () => {
    assert.equal(
      isPaymentReminderExpenseMatch(
        reminder,
        {
          account: 'mine',
          amount: '46.99',
          bankConcept: null,
          categoryId: 10,
          date: '2026-02-23',
          description: 'Internet provider',
          subcategoryId: null,
        },
        '2026-02-28',
      ),
      true,
    );
  });

  it('rejects expenses outside matching boundaries', () => {
    assert.equal(
      isPaymentReminderExpenseMatch(
        reminder,
        {
          account: 'mine',
          amount: '47.01',
          bankConcept: null,
          categoryId: 10,
          date: '2026-02-28',
          description: 'Internet provider',
          subcategoryId: null,
        },
        '2026-02-28',
      ),
      false,
    );
    assert.equal(
      isPaymentReminderExpenseMatch(
        reminder,
        {
          account: 'mine',
          amount: '42.00',
          bankConcept: null,
          categoryId: 10,
          date: '2026-02-22',
          description: 'Internet provider',
          subcategoryId: null,
        },
        '2026-02-28',
      ),
      false,
    );
  });

  it('uses exact amount matching when tolerance is zero', () => {
    const exactReminder = {
      ...reminder,
      amountTolerance: '0.00',
      cadence: 'oneTime' as const,
    };

    assert.equal(
      isPaymentReminderExpenseMatch(
        exactReminder,
        {
          account: 'mine',
          amount: '42.00',
          bankConcept: null,
          categoryId: 10,
          date: '2026-02-28',
          description: 'Internet provider',
          subcategoryId: null,
        },
        '2026-02-28',
      ),
      true,
    );
    assert.equal(
      isPaymentReminderExpenseMatch(
        exactReminder,
        {
          account: 'mine',
          amount: '42.01',
          bankConcept: null,
          categoryId: 10,
          date: '2026-02-28',
          description: 'Internet provider',
          subcategoryId: null,
        },
        '2026-02-28',
      ),
      false,
    );
  });
});

function expense(date: string, amount: string): CandidateExpenseInput {
  return {
    account: 'mine',
    amount,
    bankConcept: null,
    category: 'Subscriptions',
    categoryId: 10,
    date,
    description: 'Streaming Service',
    subcategory: null,
    subcategoryId: null,
  };
}
