import {
  AdminProposal,
  AdminRevision,
  NOW,
  PERIODS,
  PROGRAMS,
  SEED_ADMIN_PROPOSALS,
  SEED_ADMIN_REVISIONS,
} from '../../types/adminPortal';

const PROPOSALS_KEY = 'tuntas-proto-v2:proposals';
const REVISIONS_KEY = 'tuntas-proto-v2:revisions';

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readStored<T>(key: string, seed: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return copy(seed);
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return copy(seed);
  }
}

export const loadDekanProposals = (): AdminProposal[] =>
  readStored(PROPOSALS_KEY, SEED_ADMIN_PROPOSALS);

export const saveDekanProposals = (proposals: AdminProposal[]): void =>
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));

export const loadDekanRevisions = (): AdminRevision[] =>
  readStored(REVISIONS_KEY, SEED_ADMIN_REVISIONS);

export const saveDekanRevisions = (revisions: AdminRevision[]): void =>
  localStorage.setItem(REVISIONS_KEY, JSON.stringify(revisions));

export const getDekanPendingRevisions = (
  revisions: AdminRevision[],
  proposals: AdminProposal[],
): AdminRevision[] =>
  revisions.filter((revision) =>
    revision.code.startsWith('REV-2026-01')
    && new Date(revision.expiresAt).getTime() >= new Date(NOW).getTime()
    && revision.version === revision.currentVersion
    && revision.approvals[2]?.status === 'Menunggu'
    && revision.approvals[1]?.status === 'Disetujui'
    && proposals.some((proposal) => proposal.id === revision.proposalId),
  );

export { NOW, PERIODS, PROGRAMS };
