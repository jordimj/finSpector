import type { FastifyInstance } from 'fastify';
import {
  buildPdfTextPreview,
  extractPdfText,
  fetchHistoricalTransactions,
  parseTransactionsFromPdfText,
  toPdfPreviewRows,
  type HistoricalTransaction,
} from '../lib/pdf-preview.js';

const pdfBodyLimit = 15 * 1024 * 1024;

export type ImportRouteDependencies = {
  extractPdfText?: (buffer: Buffer) => Promise<string>;
  fetchHistoricalTransactions?: () => Promise<HistoricalTransaction[]>;
};

export async function registerImportRoutes(
  app: FastifyInstance,
  dependencies: ImportRouteDependencies = {},
): Promise<void> {
  const extractText = dependencies.extractPdfText ?? extractPdfText;
  const fetchHistory =
    dependencies.fetchHistoricalTransactions ?? fetchHistoricalTransactions;

  app.addContentTypeParser(
    'application/pdf',
    {
      bodyLimit: pdfBodyLimit,
      parseAs: 'buffer',
    },
    (_request, body, done) => {
      done(null, body);
    },
  );

  app.post('/pdf-preview', async (request, reply) => {
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Upload a non-empty PDF body with content type application/pdf.',
      });
    }

    try {
      const text = await extractText(request.body);
      const extractedRows = parseTransactionsFromPdfText(text);
      const history = await fetchHistory();
      const rows = toPdfPreviewRows(extractedRows, history);

      return {
        extractedTextLength: text.length,
        rowCount: rows.length,
        rows,
        textPreview: buildPdfTextPreview(text),
      };
    } catch (error) {
      return reply.status(422).send({
        error: 'Unable to preview PDF',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
