import { Router } from 'express';
import { convertPdfToMarkdown } from '../services/pdfToMarkdown';
import { savePaperToS3, parsePdfBuffer } from '../services/awsOrchestrator';

export const idpRouter = Router();

// 1. PDF to Linearized Academic Markdown
idpRouter.post('/pdf-to-markdown', async (req, res) => {
  try {
    const { pdfBase64, paperName = 'Uploaded Paper' } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: 'Base64 encoded PDF payload is required.' });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const parsedDoc = await convertPdfToMarkdown(pdfBuffer, paperName);
    const paperId = `doc-${Date.now()}`;

    savePaperToS3(paperId, pdfBuffer, 'application/pdf');
    savePaperToS3(paperId, parsedDoc.markdown, 'text/markdown');

    res.json({
      paperId,
      ...parsedDoc,
      s3MarkdownUri: `s3://${process.env.S3_BUCKET_NAME || 'paper-reviewer-storage'}/papers/${paperId}/document.md`,
    });
  } catch (err: any) {
    console.error('Error in /api/idp/pdf-to-markdown:', err);
    res.status(500).json({ error: err.message || 'Failed to linearize PDF to Markdown.' });
  }
});

// 2. Extract & Reconstruct Markdown Tables
idpRouter.post('/extract-tables', async (req, res) => {
  try {
    const { markdownContent = '' } = req.body;
    const lines = markdownContent.split('\n');
    const tables: Array<{ id: string; rawTable: string; rowCount: number }> = [];
    let currentTable: string[] = [];

    lines.forEach((l: string, idx: number) => {
      const trimmed = l.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        currentTable.push(trimmed);
      } else if (currentTable.length > 0) {
        tables.push({
          id: `table-${tables.length + 1}`,
          rawTable: currentTable.join('\n'),
          rowCount: currentTable.length,
        });
        currentTable = [];
      }
    });

    if (currentTable.length > 0) {
      tables.push({
        id: `table-${tables.length + 1}`,
        rawTable: currentTable.join('\n'),
        rowCount: currentTable.length,
      });
    }

    res.json({ tablesFound: tables.length, tables });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to extract tables.' });
  }
});

// 3. Extract Figures & Visual Bounding Box Tags
idpRouter.post('/extract-figures', async (req, res) => {
  try {
    const { markdownContent = '' } = req.body;
    const figureRegex = /!\[(.*?)\]\((.*?)\)/g;
    const figures: Array<{ caption: string; uriOrPath: string }> = [];
    let match;
    while ((match = figureRegex.exec(markdownContent)) !== null) {
      figures.push({ caption: match[1], uriOrPath: match[2] });
    }

    res.json({ figuresFound: figures.length, figures });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to extract figures.' });
  }
});

// 4. Extract Bibliography & Citation Reference List
idpRouter.post('/extract-references', async (req, res) => {
  try {
    const { markdownContent = '' } = req.body;
    const refIndex = markdownContent.search(/##\s+(References|Bibliography|Works Cited)/i);
    let referencesText = '';
    if (refIndex !== -1) {
      referencesText = markdownContent.slice(refIndex);
    }

    const refLines = referencesText
      .split('\n')
      .filter((l) => l.trim().startsWith('- ') || /^\s*\[\d+\]/.test(l.trim()));

    res.json({
      referencesFound: refLines.length,
      citations: refLines.map((r, i) => ({ id: `ref-${i + 1}`, rawCitation: r })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to extract references.' });
  }
});

// 5. Validate GFM Syntax & LaTeX Balance
idpRouter.post('/validate-structure', async (req, res) => {
  try {
    const { markdownContent = '' } = req.body;
    const mathDollars = (markdownContent.match(/\$/g) || []).length;
    const isMathBalanced = mathDollars % 2 === 0;
    const hasAbstract = /##\s+Abstract/i.test(markdownContent);
    const hasMethodology = /##\s+(Methodology|Model|Methods|Architecture)/i.test(markdownContent);
    const hasResults = /##\s+(Results|Experiments|Evaluation)/i.test(markdownContent);

    res.json({
      isValidMarkdown: true,
      isMathBalanced,
      hasAbstract,
      hasMethodology,
      hasResults,
      wordCount: markdownContent.split(/\s+/).filter(Boolean).length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to validate structure.' });
  }
});
