export type UserRole =
  | 'phd'
  | 'masters'
  | 'undergrad'
  | 'independent'
  | 'reviewer'
  | 'communicator'
  | 'educator'
  | 'practitioner';

export interface UserRoleDetail {
  id: UserRole;
  title: string;
  badge: string;
  description: string;
  perspective: string;
  readingLevel: string;
}

export type GapStatus = 'available' | 'partially_available' | 'not_mentioned';

export interface BoundaryCondition {
  condition: string; // e.g. "IF sequence length N <= 512"
  outcome: string; // e.g. "THEN attention mechanism maintains superior BLEU score"
  status: 'holds' | 'fails' | 'untested';
  confidence: 'high' | 'moderate' | 'speculative';
  explanation: string;
}

export interface VerificationChecklistItem {
  id: string;
  criterion: string; // e.g. "Statistical Power & Baseline Parity"
  result: 'verified' | 'partial' | 'unsupported' | 'missing';
  details: string;
}

export interface ClaimPerspectiveArgument {
  viewpoint: 'Author Defense' | 'Adversarial Reviewer' | 'Industry Practitioner' | 'Open Science Auditor';
  argument: string;
  evidenceOrCaveat: string;
  verdict: 'valid' | 'contested' | 'unproven';
}

export interface ClaimDecisionVerdict {
  verdictBadge: string;
  confidenceScore: number; // 0 to 100
  takeaway: string;
  scholarSearchQuery?: string;
}

export interface ClaimItem {
  id: string;
  claimNumber: number;
  statement: string;
  section: string;
  evidenceSummary: string;
  evidenceType: string;
  supportLevel: 'strong' | 'moderate' | 'weak' | 'unsupported';
  adversarialObjection: string;
  gapStatus: GapStatus;
  gapReasoning: string;
  boundaryConditions?: BoundaryCondition[];
  verificationChecklist?: VerificationChecklistItem[];
  perspectiveArguments?: ClaimPerspectiveArgument[];
  verdict?: ClaimDecisionVerdict;
  linkedQuestionIds?: string[];
}

export interface ProblemStatement {
  coreProblem: string;
  realWorldImpact: string;
  priorLimitations: string;
  claimedBreakthrough: string;
}

export type QuestionCategory =
  | 'mechanism_causality'
  | 'statistical_power'
  | 'baseline_parity'
  | 'boundary_conditions'
  | 'ood_generalization'
  | 'anti_hype'
  | 'ablation_necessity'
  | 'finops_efficiency'
  | 'competing_sota'
  | 'open_science'
  | 'methodology'
  | 'sample_size'
  | 'controls'
  | 'generalizability'
  | 'data_reproducibility'
  | 'citation_gap';

export interface AdversarialQuestion {
  id: string;
  claimId: string;
  question: string;
  category: QuestionCategory;
  answerInPaper: string;
  status: GapStatus;
  missingElement: string | null;
  importance?: 'critical' | 'high' | 'moderate';
}

export interface MissingSourceItem {
  id: string;
  title: string;
  sourceType: 'dataset' | 'reference_paper' | 'code_repository' | 'supplementary_pdf' | 'raw_logs';
  citationOrRef: string;
  reasonNeeded: string;
  uploaded: boolean;
  uploadedFileName?: string;
}

export interface ConceptNode {
  id: string;
  label: string;
  type: 'core_claim' | 'method' | 'evidence' | 'limitation' | 'gap';
  status: GapStatus;
  description?: string;
  mindmap?: string;
}

export interface ConceptLink {
  source: string;
  target: string;
  label: string;
  relationType: 'supports' | 'tests' | 'refutes' | 'missing_for' | 'derived_from';
}

export interface SearchKeywordSuggestion {
  keyword: string;
  purpose: string;
  queryUrl: string;
  category: 'replication' | 'competing_method' | 'theoretical_foundation' | 'data_source';
}

export interface DocumentStructuralMetadata {
  totalPages: number;
  totalFigures: number;
  totalTables: number;
  totalReferences: number;
  totalSections: number;
  processedWindowsCount?: number;
}

export interface PaperAnalysis {
  paperId: string;
  title: string;
  authors: string[];
  year: string;
  journalOrConference: string;
  doiOrUrl?: string;
  pdfUrl?: string;
  executiveSummary: string;
  roleAdaptedOverview: string;
  problemStatement?: ProblemStatement;
  interrogationDepth?: 'standard' | 'deep' | 'comprehensive';
  claims: ClaimItem[];
  questions: AdversarialQuestion[];
  missingSources: MissingSourceItem[];
  nodes: ConceptNode[];
  links: ConceptLink[];
  mermaidGraph?: string;
  suggestedKeywords: SearchKeywordSuggestion[];
  statedLimitations: string[];
  unStatedLimitations: string[];
  overallRigorScore: number; // 0 to 100
  transparencyScore: number; // 0 to 100
  analyzedAt: string;
  supplementarySourcesUploaded: string[];
  markdownContent?: string;
  documentMetadata?: DocumentStructuralMetadata;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  referencedClaimId?: string;
}

export interface PromptPlaybookEntry {
  id: string;
  title: string;
  category: string;
  targetRole: string;
  difficultyLevel: 'Foundational' | 'Intermediate' | 'Advanced' | 'Expert';
  description: string;
  whatToDo: string[];
  whatNotToDo: string[];
  systemInstruction: string;
  userPromptTemplate: string;
  exampleInquiry: string;
  expectedOutputSchema?: string;
}
