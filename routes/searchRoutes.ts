import { Router } from 'express';

export const searchRouter = Router();

// 11. Google Scholar Independent Verification Query Generator
searchRouter.post('/google-scholar', (req, res) => {
  const { topic = '', paperTitle = '', claimStatement = '' } = req.body;
  const rawQuery = topic || `${paperTitle} ${claimStatement}`.trim();
  const queryUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(rawQuery)}`;

  res.json({
    query: rawQuery,
    engine: 'Google Scholar',
    queryUrl,
    relevance: 'Independent peer review replication and citation verification',
  });
});

// 12. arXiv Competing Architecture & Baseline Search
searchRouter.post('/arxiv-competing', (req, res) => {
  const { architecture = '', baseline = '' } = req.body;
  const query = `${architecture} ${baseline} benchmark evaluation`.trim();
  const queryUrl = `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all`;

  res.json({
    query,
    engine: 'arXiv.org',
    queryUrl,
    purpose: 'Identify preprints with competing baseline architectures',
  });
});

// 13. PubMed Clinical Trial & Medical Evidence Query
searchRouter.post('/pubmed-clinical', (req, res) => {
  const { drugOrGene = '', condition = '' } = req.body;
  const query = `${drugOrGene} ${condition} clinical trial randomized`.trim();
  const queryUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`;

  res.json({
    query,
    engine: 'PubMed / NCBI',
    queryUrl,
    purpose: 'Search for peer-reviewed clinical trials and human safety assays',
  });
});

// 14. CrossRef DOI Lookup & Metadata Resolution
searchRouter.post('/crossref-doi', (req, res) => {
  const { doi = '' } = req.body;
  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '').trim();

  res.json({
    doi: cleanDoi,
    resolverUrl: `https://api.crossref.org/works/${cleanDoi}`,
    landingUrl: `https://doi.org/${cleanDoi}`,
  });
});

// 15. OpenAlex Open Access Citation Graph Search
searchRouter.post('/openalex-citations', (req, res) => {
  const { paperTitle = '' } = req.body;
  const queryUrl = `https://api.openalex.org/works?search=${encodeURIComponent(paperTitle)}`;

  res.json({
    paperTitle,
    engine: 'OpenAlex Graph API',
    apiUrl: queryUrl,
  });
});
