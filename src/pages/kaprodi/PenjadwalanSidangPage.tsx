import React, { useMemo, useState } from 'react';
import { CalendarCheck, CalendarPlus } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { BaaRoomSlot, ThesisRecord } from '../../types/portal';
import { formatDateId, getLecturerName } from '../../utils/format';

function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(':').map(Number);
  return hh * 60 + mm;
}

function isTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

export const PenjadwalanSidangPage: React.FC = () => {
  const {
    theses,
    lecturers,
    baaRoomSlots,
    lecturerSchedules,
    kaprodiScheduleDefense,
    showToast,
  } = usePortal();

  const [tab, setTab] = useState<'unscheduled' | 'scheduled'>('unscheduled');
  const [selected, setSelected] = useState<ThesisRecord | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [examiner1Id, setExaminer1Id] = useState(lecturers[0]?.id ?? '');
  const [examiner2Id, setExaminer2Id] = useState(lecturers[1]?.id ?? '');

  const unscheduled = useMemo(
    () =>
      theses.filter(
        (t) =>
          (t.stage === 'Verifikasi Kaprodi' || t.stage === 'Pengajuan Proposal') &&
          !t.defenseSchedule &&
          t.status !== 'Ditolak',
      ),
    [theses],
  );

  const scheduled = useMemo(
    () => theses.filter((t) => Boolean(t.defenseSchedule)),
    [theses],
  );

  const scannedSlots = useMemo(() => {
    return baaRoomSlots.map((slot) => {
      const conflict = lecturerSchedules.find(
        (item) =>
          item.date === slot.date &&
          isTimeOverlap(slot.startTime, slot.endTime, item.startTime, item.endTime),
      );
      return {
        slot,
        conflict,
        isFree: !conflict,
      };
    });
  }, [baaRoomSlots, lecturerSchedules]);

  const openScheduleModal = (record: ThesisRecord) => {
    setSelected(record);
    const firstFree = scannedSlots.find((s) => s.isFree)?.slot ?? baaRoomSlots[0];
    setSelectedSlotId(firstFree?.id ?? '');
    if (record.defenseSchedule) {
      setExaminer1Id(record.defenseSchedule.examiner1Id);
      setExaminer2Id(record.defenseSchedule.examiner2Id);
    } else {
      const revPool =
        record.proposalReviewers.length >= 2
          ? record.proposalReviewers
          : lecturers.map((l) => l.id);
      setExaminer1Id(revPool[0] ?? lecturers[0]?.id ?? '');
      setExaminer2Id(revPool[1] ?? lecturers[1]?.id ?? '');
    }
  };

  const handleConfirmSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const chosen: BaaRoomSlot | undefined = baaRoomSlots.find((s) => s.id === selectedSlotId);
    if (!chosen) {
      showToast('Pilih slot waktu sidang dari hasil pemindaian.', 'error');
      return;
    }
    if (examiner1Id === examiner2Id) {
      showToast('Dosen Penguji 1 dan Penguji 2 harus berbeda.', 'error');
      return;
    }
    kaprodiScheduleDefense(selected.id, {
      date: chosen.date,
      time: `${chosen.startTime} - ${chosen.endTime} WIB`,
      room: chosen.room,
      examiner1Id,
      examiner2Id,
    });
    setSelected(null);
  };

  const activeRows = tab === 'unscheduled' ? unscheduled : scheduled;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline-lg text-[#0B1C30]">
          Penjadwalan Otomatis Berbasis Ketersediaan
        </h1>
        <p className="body-base text-[#475569] mt-1">
          Pemindaian silang jadwal mengajar dosen, jadwal bimbingan, dan alokasi ruang sidang dari
          BAA
        </p>
      </div>

      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="flex items-center border-b border-[#E2E8F0] px-6 gap-6">
          <button
            type="button"
            onClick={() => setTab('unscheduled')}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'unscheduled'
                ? 'text-[#0F2A66]'
                : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Siap Dijadwalkan ({unscheduled.length})
            {tab === 'unscheduled' && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('scheduled')}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'scheduled'
                ? 'text-[#0F2A66]'
                : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Terjadwal ({scheduled.length})
            {tab === 'scheduled' && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]" />
            )}
          </button>
        </div>

        {activeRows.length === 0 ? (
          <EmptyState
            message={
              tab === 'unscheduled'
                ? 'Tidak ada proposal yang menunggu penjadwalan Sidang Proposal.'
                : 'Belum ada jadwal Sidang Proposal yang diterbitkan.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">
                    Judul &amp; Pembimbing
                  </th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">
                    {tab === 'unscheduled' ? 'Status' : 'Jadwal & Penguji'}
                  </th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {activeRows.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                      <p className="code-meta text-[#475569]">{item.studentNim}</p>
                    </td>
                    <td className="py-4 px-4 max-w-md">
                      <p className="body-medium text-[#0B1C30]">{item.title}</p>
                      <p className="code-meta text-[#475569] mt-0.5">
                        Pembimbing: {getLecturerName(lecturers, item.advisor1Id)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      {!item.defenseSchedule ? (
                        <StatusBadge status={item.status} />
                      ) : (
                        <div>
                          <p className="body-semibold text-[#0B1C30]">
                            {formatDateId(item.defenseSchedule.date)}, {item.defenseSchedule.time}
                          </p>
                          <p className="code-meta text-[#475569]">{item.defenseSchedule.room}</p>
                          <p className="code-meta text-[#475569]">
                            Penguji: {getLecturerName(lecturers, item.defenseSchedule.examiner1Id)}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openScheduleModal(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 stroke-[1.5]" />
                        {item.defenseSchedule ? 'Sesuaikan Slot' : 'Pindai & Jadwalkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Auto-Schedule Modal */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Rekomendasi Slot Sidang Bebas Bentrok"
        maxWidthClass="max-w-3xl"
      >
        {selected && (
          <form onSubmit={handleConfirmSlot} className="space-y-5">
            <div className="pb-3 border-b border-[#E2E8F0]">
              <p className="code-meta text-[#475569]">
                {selected.studentName} ({selected.studentNim}) — {selected.programStudi}
              </p>
              <h3 className="headline-sm text-[#0B1C30] mt-1">{selected.title}</h3>
            </div>

            <AlertBanner
              variant="info"
              title="Hasil Cross-Check Jadwal Mengajar, Bimbingan, & Ruang BAA"
              description="Pilih salah satu slot bertanda Bebas Bentrok di bawah. Jadwal yang diterbitkan otomatis muncul pada kalender dosen penguji dan pemberitahuan mahasiswa."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sch-ex1" className="block label-md text-[#0B1C30] mb-1.5">
                  Dosen Penguji 1
                </label>
                <select
                  id="sch-ex1"
                  value={examiner1Id}
                  onChange={(e) => setExaminer1Id(e.target.value)}
                  className="input-field"
                >
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sch-ex2" className="block label-md text-[#0B1C30] mb-1.5">
                  Dosen Penguji 2
                </label>
                <select
                  id="sch-ex2"
                  value={examiner2Id}
                  onChange={(e) => setExaminer2Id(e.target.value)}
                  className="input-field"
                >
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0]">
              {scannedSlots.map(({ slot, conflict, isFree }) => (
                <label
                  key={slot.id}
                  className={`p-4 flex items-start justify-between gap-3 ${
                    isFree ? 'cursor-pointer hover:bg-[#F8FAFC]' : 'bg-[#F8FAFC] opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="slot-choice"
                      value={slot.id}
                      checked={selectedSlotId === slot.id}
                      disabled={!isFree}
                      onChange={() => setSelectedSlotId(slot.id)}
                      className="mt-1 h-4 w-4 accent-[#0F2A66]"
                    />
                    <div>
                      <p className="body-semibold text-[#0B1C30]">
                        {slot.dayOfWeek}, {formatDateId(slot.date)} — {slot.startTime} -{' '}
                        {slot.endTime} WIB
                      </p>
                      <p className="code-meta text-[#475569]">{slot.room} (Alokasi BAA)</p>
                      {conflict && (
                        <p className="code-meta text-[#B91C1C] mt-0.5">
                          Bentrok dengan [{conflict.category}] {conflict.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={isFree ? 'Bebas Bentrok' : 'Bentrok'} />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary">
                <CalendarCheck className="w-4 h-4 stroke-[1.5]" />
                Terbitkan Jadwal
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
