import { ConceptNode, ConceptLink } from '../src/types';

export interface MermaidValidationResult {
  valid: boolean;
  cleanCode: string;
  error?: string;
  attemptCount?: number;
}

/**
 * Sanitizes text to remove characters that break Mermaid parsers
 */
export function sanitizeMermaidText(text: string, maxLength = 36): string {
  if (!text) return 'Concept';
  return text
    .replace(/[`"'\[\]\(\)\{\}<>;&]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and repairs Mermaid Flowchart syntax
 */
export function validateFlowchartSyntax(rawCode: string): MermaidValidationResult {
  if (!rawCode || typeof rawCode !== 'string') {
    return { valid: false, cleanCode: '', error: 'Empty flowchart code provided' };
  }

  const clean = rawCode
    .replace(/```(?:mermaid)?/gi, '')
    .replace(/```/g, '')
    .trim();

  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { valid: false, cleanCode: '', error: 'No flowchart content lines found' };
  }

  const firstLine = lines[0].toLowerCase();
  if (!firstLine.startsWith('flowchart') && !firstLine.startsWith('graph')) {
    return { valid: false, cleanCode: clean, error: 'Flowchart must begin with "flowchart TD" or "flowchart LR"' };
  }

  // Check brackets balance
  let openBrackets = 0;
  for (const char of clean) {
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
    if (openBrackets < 0) {
      return { valid: false, cleanCode: clean, error: 'Unbalanced closing bracket "]" found' };
    }
  }

  if (openBrackets !== 0) {
    return { valid: false, cleanCode: clean, error: `Unbalanced brackets: ${openBrackets} unclosed "["` };
  }

  return { valid: true, cleanCode: clean };
}

/**
 * Validates and repairs Mermaid Mindmap syntax
 */
export function validateMindmapSyntax(rawCode: string): MermaidValidationResult {
  if (!rawCode || typeof rawCode !== 'string') {
    return { valid: false, cleanCode: '', error: 'Empty mindmap code provided' };
  }

  const clean = rawCode
    .replace(/```(?:mermaid)?/gi, '')
    .replace(/```/g, '')
    .trim();

  const lines = clean.split('\n');
  if (lines.length < 2) {
    return { valid: false, cleanCode: clean, error: 'Mindmap must contain at least a header and a root node' };
  }

  const firstLine = lines[0].trim().toLowerCase();
  if (firstLine !== 'mindmap') {
    return { valid: false, cleanCode: clean, error: 'Mindmap must begin with the keyword "mindmap"' };
  }

  // Verify second line has a valid root node
  const secondLine = lines.slice(1).find((l) => l.trim().length > 0);
  if (!secondLine) {
    return { valid: false, cleanCode: clean, error: 'Missing root node definition after "mindmap"' };
  }

  const trimmedSecond = secondLine.trim();
  const hasValidRoot =
    trimmedSecond.startsWith('root((') ||
    trimmedSecond.startsWith('root[') ||
    trimmedSecond.startsWith('root(') ||
    trimmedSecond.startsWith('(') ||
    trimmedSecond.startsWith('[');

  if (!hasValidRoot) {
    return {
      valid: false,
      cleanCode: clean,
      error: 'Root node should be formatted as root((Root Label)) or root[Root Label]',
    };
  }

  // Check paren/bracket balance in root
  const openParens = (clean.match(/\(/g) || []).length;
  const closeParens = (clean.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return {
      valid: false,
      cleanCode: clean,
      error: `Unbalanced parentheses in mindmap: ${openParens} open vs ${closeParens} close`,
    };
  }

  return { valid: true, cleanCode: clean };
}

/**
 * Deterministic safe generator for Node Mindmaps (4 academic pillars)
 */
export function generateSafeNodeMindmap(node: ConceptNode, paperTitle = 'Research Paper'): string {
  const rootLabel = sanitizeMermaidText(node.label || 'Concept Node', 30);
  const typeLabel = node.type.replace('_', ' ').toUpperCase();
  const statusLabel = node.status === 'available' ? 'Supported' : node.status === 'partially_available' ? 'Bounded' : 'Identified Gap';

  let descA = 'Theoretical Foundation';
  let descB = 'Empirical Method';
  let descC = 'Statistical Bounds';
  let descD = 'Open Research Gap';

  if (node.type === 'core_claim') {
    descA = 'Central Thesis';
    descB = 'Reported Metrics';
    descC = 'Operating Assumptions';
    descD = 'Ablation Verification';
  } else if (node.type === 'method') {
    descA = 'Algorithmic Architecture';
    descB = 'Hardware & Compute';
    descC = 'Hyperparameter Sensitivity';
    descD = 'Scaling Ceiling';
  } else if (node.type === 'evidence') {
    descA = 'Primary Benchmark';
    descB = 'Baseline Parity';
    descC = 'Sample Size & Power';
    descD = 'OOD Generalization';
  } else if (node.type === 'limitation') {
    descA = 'Stated Boundary';
    descB = 'Computational Cost';
    descC = 'Domain Restriction';
    descD = 'Mitigation Pathway';
  } else if (node.type === 'gap') {
    descA = 'Missing Artifact';
    descB = 'Unverified Variance';
    descC = 'Silent Assumption';
    descD = 'Independent Audit Need';
  }

  return `mindmap
  root((${rootLabel}))
    ${descA}
      Role: ${typeLabel}
      Status: ${statusLabel}
    ${descB}
      Empirical Execution
      Evaluation Criteria
    ${descC}
      Boundary Conditions
      Known Constraints
    ${descD}
      Reproducibility Check
      Missing Evidence Link`;
}

/**
 * Deterministic safe generator for Global Flowchart DAG
 */
export function generateSafeGlobalFlowchart(nodes: ConceptNode[], links: ConceptLink[]): string {
  if (!nodes || nodes.length === 0) return 'flowchart TD\n  empty["No Concept Nodes"]';

  let code = 'flowchart TD\n';
  code += '  classDef available fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#064e3b;\n';
  code += '  classDef partial fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#78350f;\n';
  code += '  classDef missing fill:#fff1f2,stroke:#f43f5e,stroke-width:2px,color:#881337;\n\n';

  nodes.forEach((n) => {
    const sanitizedId = (n.id || 'node').replace(/[^a-zA-Z0-9_]/g, '_');
    const cleanLabel = sanitizeMermaidText(n.label || 'Concept', 30);
    const statusClass =
      n.status === 'available'
        ? 'available'
        : n.status === 'partially_available'
        ? 'partial'
        : 'missing';
    code += `  ${sanitizedId}["${cleanLabel}"]:::${statusClass}\n`;
  });

  code += '\n';

  if (links && links.length > 0) {
    links.forEach((l) => {
      const src = (l.source || '').replace(/[^a-zA-Z0-9_]/g, '_');
      const tgt = (l.target || '').replace(/[^a-zA-Z0-9_]/g, '_');
      const label = sanitizeMermaidText(l.label || l.relationType || '', 20);
      if (src && tgt) {
        if (label) {
          code += `  ${src} -->|"${label}"| ${tgt}\n`;
        } else {
          code += `  ${src} --> ${tgt}\n`;
        }
      }
    });
  }

  return code;
}
