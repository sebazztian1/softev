import type { AcademicStatus, ThesisRecord } from '../types/portal';

export type RevisionDetails = Pick<ThesisRecord, 'submissionType' | 'advisor1Id' | 'advisor2Id'> & {
  title: string;
};

export function needsRevision(status: AcademicStatus): boolean {
  return status === 'Perlu Revisi' || status === 'Diperbaiki' || status === 'Perbaikan Bersyarat';
}

export function getRevisionDetails(thesis: ThesisRecord): RevisionDetails {
  return {
    submissionType: thesis.submissionType,
    title: thesis.newTitle ?? thesis.title,
    advisor1Id: thesis.advisor1Id,
    advisor2Id: thesis.advisor2Id,
  };
}

export function nextRevisionToken(records: ThesisRecord[], thesis: ThesisRecord): string {
  const prefix = `ISTTS-REV-${thesis.studentNim}-V`;
  let highestVersion = 0;
  for (const record of records) {
    if (record.studentNim !== thesis.studentNim) continue;
    const tokens = [record.revisionQrToken, ...record.submissions.map((item) => item.revisionQrToken)];
    for (const token of tokens) {
      if (!token?.toUpperCase().startsWith(prefix)) continue;
      const version = Number(token.slice(prefix.length));
      if (Number.isSafeInteger(version)) highestVersion = Math.max(highestVersion, version);
    }
  }
  return prefix + (highestVersion + 1);
}
