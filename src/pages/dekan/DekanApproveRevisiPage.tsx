import React, { useEffect, useMemo, useState } from 'react';
import { AdminRevision, RevisionApproval, RevisionStatus } from '../../types/adminPortal';
import { usePortal } from '../../context/PortalContext';
import { formatDateId } from '../../utils/format';
import { DekanEmpty, DekanError, DekanPanel, DekanPill } from './DekanPageParts';
import {
  getDekanPendingRevisions,
  loadDekanProposals,
  loadDekanRevisions,
  NOW,
  saveDekanRevisions,
} from './dekanData';

type Decision = 'Disetujui' | 'Ditolak';
type StoredDecision = { code: string; decision: Decision; at: string };

function downloadRevision(nrp: string, version: number): void {
  const blob = new Blob([`Dokumen revisi v${version}\nNRP: ${nrp}`], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${nrp}_Revisi_v${version}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const DekanApproveRevisiPage: React.FC = () => {
  const { currentUser, showToast } = usePortal();
  const [proposals] = useState(loadDekanProposals);
  const [revisions, setRevisions] = useState<AdminRevision[]>(loadDekanRevisions);
  const [code, setCode] = useState(() => localStorage.getItem('tuntas-proto-v2:dekan:revision-code') ?? '');
  const [selectedCode, setSelectedCode] = useState('');
  const [decision, setDecision] = useState<Decision>('Disetujui');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [failedCodes, setFailedCodes] = useState<string[]>([]);
  const pending = useMemo(() => getDekanPendingRevisions(revisions, proposals), [proposals, revisions]);
  const revision = revisions.find((item) => item.code === selectedCode);
  const proposal = revision ? proposals.find((item) => item.id === revision.proposalId) : undefined;
  const activeStage = revision?.approvals[2];
  const canDecide = activeStage?.status === 'Menunggu'
    && revision?.approvals[1]?.status === 'Disetujui'
    && revision.version === revision.currentVersion;

  useEffect(() => {
    saveDekanRevisions(revisions);
  }, [revisions]);

  const checkCode = (candidate: string) => {
    const normalized = candidate.trim().toUpperCase();
    setCode(candidate);
    setSelectedCode('');
    setError('');
    setSaveMessage('');
    setNote('');
    localStorage.setItem('tuntas-proto-v2:dekan:revision-code', normalized);
    const found = revisions.find((item) => item.code === normalized);
    if (!found) {
      setError(`E-REV-001 — Kode ${normalized || '(kosong)'} tidak dikenali. Periksa kode revisi, lalu coba lagi.`);
      return;
    }
    if (new Date(found.expiresAt).getTime() < new Date(NOW).getTime()) {
      setError(`E-REV-002 — Kode ${normalized} telah kedaluwarsa pada ${formatDateId(found.expiresAt)}. Mintalah kode baru kepada mahasiswa atau pembimbing.`);
      return;
    }
    if (found.approvals[2]?.status !== 'Menunggu') {
      setError(`E-REV-003 — Tahap Dekan untuk revisi ini telah ${found.approvals[2]?.status.toLowerCase()} oleh ${found.approvals[2]?.by ?? 'approver sebelumnya'}${found.approvals[2]?.at ? ` pada ${formatDateId(found.approvals[2].at)}` : ''}.`);
      return;
    }
    if (found.approvals[1]?.status !== 'Disetujui') {
      setError('E-REV-006 — Persetujuan tahap Kaprodi belum selesai. Dekan dapat memproses revisi setelah tahap tersebut disetujui.');
      return;
    }
    if (found.version !== found.currentVersion) {
      setError(`E-REV-005 — Versi dokumen yang terhubung ke kode ini adalah v${found.version}, sedangkan versi terbaru adalah v${found.currentVersion}. Mintalah kode revisi terbaru.`);
      return;
    }
    setSelectedCode(found.code);
    localStorage.removeItem('tuntas-proto-v2:dekan:revision-code');
  };

  useEffect(() => {
    const savedCode = localStorage.getItem('tuntas-proto-v2:dekan:revision-code');
    if (savedCode) checkCode(savedCode);
  }, []);

  const retryDecision = () => {
    const stored = localStorage.getItem('tuntas-proto-v2:dekan:last-decision');
    if (!stored) {
      setError('E-NET-001 — Keputusan belum tersimpan. Periksa koneksi, lalu kirim ulang.');
      return;
    }
    let previous: StoredDecision;
    try {
      previous = JSON.parse(stored) as StoredDecision;
    } catch {
      localStorage.removeItem('tuntas-proto-v2:dekan:last-decision');
      setError('E-NET-001 — Status keputusan tidak dapat dibaca. Periksa antrean sebelum mengirim ulang.');
      return;
    }
    if (previous.code !== selectedCode) {
      setError('E-NET-001 — Keputusan belum tersimpan. Periksa koneksi, lalu kirim ulang.');
      return;
    }
    setError('');
    setSaveMessage(`Keputusan Anda telah tersimpan pada ${formatDateId(previous.at)}.`);
  };

  const saveDecision = () => {
    if (!revision || !proposal || !canDecide) return;
    if (decision === 'Ditolak' && (note.trim().length < 10 || note.trim().length > 500)) {
      setError('E-VAL-003 — Catatan penolakan wajib berisi 10 sampai 500 karakter.');
      setConfirmationOpen(false);
      return;
    }
    if (
      revision.simulateServerFailure
      && !failedCodes.includes(revision.code)
      && new URLSearchParams(window.location.search).get('simulate') !== 'skip-server-failure'
    ) {
      setFailedCodes((current) => [...current, revision.code]);
      setError('E-SRV-001 — Keputusan revisi gagal disimpan karena server tidak tersedia. Periksa koneksi, lalu coba lagi.');
      return;
    }

    const at = NOW;
    const approval: RevisionApproval = {
      role: 'DEKAN',
      status: decision,
      by: currentUser?.name ?? 'Dekan',
      at,
      note: note.trim() || undefined,
    };
    const updatedRevision: AdminRevision = {
      ...revision,
      status: (decision === 'Disetujui' ? 'Disetujui' : 'Ditolak') as RevisionStatus,
      approvals: revision.approvals.map((item, index) => index === 2 ? approval : item),
    };
    setRevisions((current) => current.map((item) => item.code === revision.code ? updatedRevision : item));
    setConfirmationOpen(false);
    setError('');
    localStorage.setItem(
      'tuntas-proto-v2:dekan:last-decision',
      JSON.stringify({ code: revision.code, decision, at } satisfies StoredDecision),
    );

    const simulateTimeout = new URLSearchParams(window.location.search).get('simulate') === 'timeout-after-commit'
      && revision.code === 'REV-2026-0108';
    if (simulateTimeout) {
      setError('E-NET-002 — Server tidak merespons setelah keputusan tersimpan. Periksa status keputusan sebelum mengirim ulang.');
      return;
    }
    setSaveMessage(`Keputusan ${decision.toLowerCase()} tersimpan pada ${formatDateId(at)}.`);
    setSelectedCode('');
    showToast(`Revisi ${decision.toLowerCase()} disimpan.`);
  };

  return (
    <div className="space-y-6">
      <h1 className="headline-lg text-[#0B1C30]">Approve Revisi (QR)</h1>
      <DekanPanel title="Periksa Kode Revisi">
        <form className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); checkCode(code); }}>
          <div className="flex-1">
            <label htmlFor="dekan-revision-code" className="mb-1.5 block label-md">Kode Revisi</label>
            <input id="dekan-revision-code" className="input-field" placeholder="Masukkan kode revisi" value={code} onChange={(event) => setCode(event.target.value)} />
          </div>
          <button type="submit" className="btn-primary">Periksa Kode</button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
          <p className="body-base text-[#475569]">Pindai kode QR atau masukkan kode secara manual.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                stream.getTracks().forEach((track) => track.stop());
                setError('Pemindai QR belum tersedia. Masukkan kode revisi secara manual.');
              } catch {
                setError('E-CAM-001 — Kamera tidak dapat diakses. Izinkan akses kamera atau masukkan kode secara manual.');
              }
            }}
          >
            Aktifkan Pemindai Kamera
          </button>
        </div>
      </DekanPanel>

      {error && (
        <DekanError
          message={error}
          onRetry={error.startsWith('E-NET-002') ? retryDecision : error.startsWith('E-SRV-001') ? saveDecision : undefined}
        />
      )}
      {saveMessage && <div role="status" className="rounded-lg border border-[#86EFAC] bg-[#DCFCE7] px-4 py-3 text-[#15803D]">{saveMessage}</div>}

      {revision && proposal && (
        <DekanPanel title="Detail Persetujuan Revisi">
          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            <div><dt className="label-md text-[#475569]">Mahasiswa</dt><dd className="body-medium">{proposal.studentName} · {proposal.nrp}</dd></div>
            <div><dt className="label-md text-[#475569]">Jurusan</dt><dd className="body-medium">{proposal.program}</dd></div>
            <div className="sm:col-span-2"><dt className="label-md text-[#475569]">Judul</dt><dd className="body-medium">{proposal.title}</dd></div>
            <div><dt className="label-md text-[#475569]">Versi dokumen</dt><dd className="body-medium">v{revision.version}</dd></div>
            <div><dt className="label-md text-[#475569]">Status revisi</dt><dd className="mt-1"><DekanPill>{revision.status}</DekanPill></dd></div>
            <div><dt className="label-md text-[#475569]">Kode dan kedaluwarsa</dt><dd className="body-medium">{revision.code} · {formatDateId(revision.expiresAt)}</dd></div>
            <div><dt className="label-md text-[#475569]">Berkas</dt><dd><button type="button" className="body-semibold text-[#0284C7]" onClick={() => downloadRevision(proposal.nrp, revision.version)}>Unduh Dokumen</button></dd></div>
          </dl>
          <div className="border-t border-[#E2E8F0] px-5 py-4">
            <h2 className="headline-sm">Rantai Persetujuan</h2>
            <ol className="mt-4 grid gap-3 md:grid-cols-3">
              {revision.approvals.map((approval) => (
                <li key={approval.role} className="border-l-2 border-[#E2E8F0] pl-3">
                  <p className="label-md text-[#475569]">{approval.role === 'PEMBIMBING' ? 'Pembimbing' : approval.role === 'KAPRODI' ? 'Kaprodi' : 'Dekan'}</p>
                  <div className="mt-1"><DekanPill>{approval.status === 'Menunggu' ? 'Menunggu Persetujuan' : approval.status}</DekanPill></div>
                  {approval.by && <p className="code-meta mt-1 text-[#475569]">{approval.by} · {formatDateId(approval.at ?? NOW)}</p>}
                </li>
              ))}
            </ol>
          </div>
          {canDecide && (
            <div className="border-t border-[#E2E8F0] px-5 py-4">
              <label htmlFor="dekan-revision-note" className="mb-1.5 block label-md">Catatan</label>
              <textarea id="dekan-revision-note" className="textarea-field" rows={3} maxLength={500} placeholder="Catatan wajib untuk penolakan, opsional untuk persetujuan." value={note} onChange={(event) => setNote(event.target.value)} />
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button type="button" className="btn-secondary text-[#B91C1C]" onClick={() => { setDecision('Ditolak'); setConfirmationOpen(true); }}>Tolak Revisi</button>
                <button type="button" className="btn-primary" onClick={() => { setDecision('Disetujui'); setConfirmationOpen(true); }}>Setujui Revisi</button>
              </div>
            </div>
          )}
        </DekanPanel>
      )}

      <DekanPanel title="Antrean Persetujuan">
        {pending.length === 0 ? (
          <DekanEmpty message="Tidak ada permintaan persetujuan revisi yang menunggu." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-[#F1F5F9]">{['Mahasiswa', 'Jurusan', 'Judul', 'Versi', 'Batas Kedaluwarsa', 'Aksi'].map((heading) => <th key={heading} className="px-5 py-3 label-md uppercase text-[#475569]">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {pending.map((item) => {
                  const pendingProposal = proposals.find((candidate) => candidate.id === item.proposalId);
                  if (!pendingProposal) return null;
                  return (
                    <tr key={item.code}>
                      <td className="px-5 py-4 body-medium">{pendingProposal.studentName}<div className="code-meta text-[#475569]">{pendingProposal.nrp}</div></td>
                      <td className="px-5 py-4 body-base">{pendingProposal.program}</td>
                      <td className="min-w-64 px-5 py-4 body-base">{pendingProposal.title}</td>
                      <td className="px-5 py-4 body-base">v{item.version}</td>
                      <td className="px-5 py-4 code-meta">{formatDateId(item.expiresAt)}</td>
                      <td className="px-5 py-4 text-right"><button type="button" className="btn-secondary" onClick={() => checkCode(item.code)}>Buka</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DekanPanel>

      {confirmationOpen && revision && proposal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(15,42,102,0.5)] p-4" role="dialog" aria-modal="true" aria-labelledby="dekan-confirm-title">
          <div className="w-full max-w-lg rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-level-4">
            <h2 id="dekan-confirm-title" className="headline-sm">Konfirmasi Keputusan Revisi</h2>
            <p className="mt-3 body-base">Simpan keputusan {decision.toLowerCase()} untuk {proposal.studentName}, versi {revision.version}?</p>
            {error.startsWith('E-VAL-003') && <p role="alert" className="mt-3 body-base text-[#B91C1C]">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setConfirmationOpen(false)}>Batal</button>
              <button type="button" className="btn-primary" onClick={saveDecision}>Ya, Simpan Keputusan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
