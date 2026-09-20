import { UserRole, UserRoleDetail } from '../types';

export const USER_ROLES: UserRoleDetail[] = [
  {
    id: 'phd',
    title: 'PhD / Senior Researcher',
    badge: 'Rigor & Gaps',
    description: 'Deep methodology validation, statistical power audits, identification of unstated assumptions & research opportunities.',
    perspective: 'Identifies methodology flaws, statistical boundary conditions, and gaps for future grant proposals.',
    readingLevel: 'C2 Academic / Technical Domain Expert'
  },
  {
    id: 'masters',
    title: 'Graduate Scholar / Student',
    badge: 'Lit Review & Context',
    description: 'Contextualizes claims within current literature, evaluates experimental baselines, and simplifies writing lit reviews.',
    perspective: 'Focuses on synthesis, positioning relative to baseline models, and experimental validity.',
    readingLevel: 'C1 Technical Scholar'
  },
  {
    id: 'undergrad',
    title: 'Undergraduate Student',
    badge: 'Guided Critical Reading',
    description: 'Scaffolds technical jargon, breaks down complex equations into intuitive concepts, and teaches scientific critique.',
    perspective: 'Deconstructs dense jargon, highlights key concepts, and guides step-by-step critical questioning.',
    readingLevel: 'B2 Guided Academic'
  },
  {
    id: 'independent',
    title: 'Independent Researcher',
    badge: 'Open Science & Reproduction',
    description: 'Focuses on missing source data, code availability, replication requirements, and open-source validation.',
    perspective: 'Audit for reproducible benchmarks, open datasets, and missing supplementary code.',
    readingLevel: 'C1 Practical Technical'
  },
  {
    id: 'reviewer',
    title: 'Peer Reviewer / Editor',
    badge: 'Adversarial Audit',
    description: 'Hostile claim-by-claim scrutiny, overclaiming checks, dataset bias detection, and ethical transparency audit.',
    perspective: 'Acts as an uncompromising reviewer looking for over-generalized conclusions and hidden limitations.',
    readingLevel: 'C2 Editorial / Critical Audit'
  },
  {
    id: 'communicator',
    title: 'Science Communicator / Journalist',
    badge: 'Plain Language & Impact',
    description: 'Translates technical jargon into accessible B2/C1 analogies, surfaces real-world caveats, and guards against hype.',
    perspective: 'Extracts headline-worthy findings while highlighting caveats to avoid sensationalized reporting.',
    readingLevel: 'B2 Clear Explanatory & Analogies'
  },
  {
    id: 'educator',
    title: 'Educator / Professor',
    badge: 'Teaching & Pedagogy',
    description: 'Generates discussion prompts, Socratic questions for classroom debate, and teaches student evaluation skills.',
    perspective: 'Formulates teaching points, debate questions, and conceptual exercises for students.',
    readingLevel: 'C1 Pedagogical & Conceptual'
  },
  {
    id: 'practitioner',
    title: 'Industry Practitioner / Engineer',
    badge: 'Implementation & ROI',
    description: 'Evaluates real-world deployability, computational overhead, edge-case failures, and trade-offs.',
    perspective: 'Focuses on latency, memory footprint, production constraints, and practical implementation caveats.',
    readingLevel: 'C1 Applied Engineering'
  }
];

export function getRoleDetail(role: UserRole): UserRoleDetail {
  return USER_ROLES.find(r => r.id === role) || USER_ROLES[0];
}
