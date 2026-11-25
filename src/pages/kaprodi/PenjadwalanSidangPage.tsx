import React, { useMemo, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { ThesisRecord } from '../../types/portal';
import { formatDateId, getLecturerName } from '../../utils/format';

export const PenjadwalanSidangPage: React.FC = () => {
  const { theses, lecturers, kaprodiScheduleDefense, showToast } = usePortal();
  const [tab, setTab] = useState<'unscheduled' | 'scheduled'>('unscheduled');
  const [selected, setSelected] = useState<ThesisRecord | null>(null);
  const [date, setDate] = useState('2026-12-03');
  const [time, setTime] = useState('09:30 - 10:30 WIB');
  const [room, setRoom] = useState('Ruang Sidang B-302');
  const [examiner1Id, setExaminer1Id] = useState(lecturers[0]?.id ?? '');
  const [examiner2Id, setExaminer2Id] = useState(lecturers[2]?.id ?? '');

  const unscheduled = useMemo(
    () =>
      theses.filter(
        (t) => t.stage === 'Verifikasi Kaprodi' && t.status === 'Diterima' && !t.defenseSchedule,
      ),
    [theses],
  );

  const scheduled = useMemo(
    () => theses.filter((t) => Boolean(t.defenseSchedule)),
    [theses],
  );

  const openScheduleModal = (record: ThesisRecord) => {
    setSelected(record);
    if (record.defenseSchedule) {
      setDate(record.defenseSchedule.date);
      setTime(record.defenseSchedule.time);
      setRoom(record.defenseSchedule.room);
      setExaminer1Id(record.defenseSchedule.examiner1Id);
      setExaminer2Id(record.defenseSchedule.examiner2Id);
    } else {
      const available = lecturers.filter(
        (l) => l.id !== record.advisor1Id && l.id !== record.advisor2Id,
      );
      setDate('2026-12-03');
      setTime('09:30 - 10:30 WIB');
      setRoom('Ruang Sidang B-302');
      setExaminer1Id(available[0]?.id ?? lecturers[0]?.id ?? '');
      setExaminer2Id(available[1]?.id ?? lecturers[1]?.id ?? '');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!date || !time.trim() || !room.trim()) {
      showToast('Tanggal, waktu, dan ruang sidang wajib diisi.', 'error');
      return;
    }
    if (examiner1Id === examiner2Id) {
      showToast('Penguji 1 dan Penguji 2 harus berbeda.', 'error');
      return;
    }
    kaprodiScheduleDefense(selected.id, {
      date,
      time: time.trim(),
      room: room.trim(),
      examiner1Id,
      examiner2Id,
    });
    setSelected(null);
  };

  const activeRows = tab === 'unscheduled' ? unscheduled : scheduled;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline-lg text-[#0B1C30]">Penjadwalan Sidang</h1>
        <p className="body-base text-[#475569] mt-1">
          Penetapan jadwal, ruang pelaksanaan, dan dewan penguji Sidang Proposal
        </p>
      </div>

      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        {/* Tabs inside Level 1 Card */}
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
            Belum Terjadwal ({unscheduled.length})
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
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul &amp; Pembimbing</th>
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
                        Pembimbing 1: {getLecturerName(lecturers, item.advisor1Id)}
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
                        {item.defenseSchedule ? 'Ubah Jadwal' : 'Atur Jadwal'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Atur Jadwal Sidang Proposal"
      >
        {selected && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="pb-3 border-b border-[#E2E8F0]">
              <p className="code-meta text-[#475569]">
                {selected.studentName} ({selected.studentNim})
              </p>
              <h3 className="headline-sm text-[#0B1C30] mt-1">{selected.title}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sch-date" className="block label-md text-[#0B1C30] mb-1.5">
                  Tanggal Sidang
                </label>
                <input
                  id="sch-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label htmlFor="sch-time" className="block label-md text-[#0B1C30] mb-1.5">
                  Waktu Pelaksanaan
                </label>
                <input
                  id="sch-time"
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="09:30 - 10:30 WIB"
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="sch-room" className="block label-md text-[#0B1C30] mb-1.5">
                Ruang Sidang / Tautan
              </label>
              <input
                id="sch-room"
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ruang Sidang B-302"
                className="input-field"
                required
              />
            </div>

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

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Simpan Jadwal
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
