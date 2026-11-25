import React, { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { formatDateId } from '../../utils/format';

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

export const SinkronisasiJadwalPage: React.FC = () => {
  const { baaRoomSlots, lecturerSchedules, addLecturerScheduleBlock, showToast } = usePortal();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [newDate, setNewDate] = useState('2026-12-01');
  const [newDay, setNewDay] = useState('Selasa');
  const [newStart, setNewStart] = useState('13:00');
  const [newEnd, setNewEnd] = useState('14:30');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Mengajar' | 'Bimbingan'>('Mengajar');
  const [newRoom, setNewRoom] = useState('Ruang Kuliah B-201');

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

  const sortedAgenda = useMemo(
    () =>
      [...lecturerSchedules].sort((a, b) =>
        `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`),
      ),
    [lecturerSchedules],
  );

  const freeCount = scannedSlots.filter((s) => s.isFree).length;

  const handleAddBusyBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Nama agenda jadwal wajib diisi.', 'error');
      return;
    }
    if (toMinutes(newStart) >= toMinutes(newEnd)) {
      showToast('Jam selesai harus lebih akhir dari jam mulai.', 'error');
      return;
    }
    addLecturerScheduleBlock({
      dayOfWeek: newDay,
      date: newDate,
      startTime: newStart,
      endTime: newEnd,
      title: newTitle.trim(),
      category: newCategory,
      room: newRoom.trim(),
    });
    setNewTitle('');
    setAddModalOpen(false);
  };

  const handleExportIcs = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ISTTS//Portal Tugas Akhir//ID',
      ...sortedAgenda.flatMap((item) => {
        const dateCompact = item.date.replace(/-/g, '');
        const startCompact = item.startTime.replace(':', '') + '00';
        const endCompact = item.endTime.replace(':', '') + '00';
        return [
          'BEGIN:VEVENT',
          `UID:${item.id}@istts.ac.id`,
          `DTSTART:${dateCompact}T${startCompact}`,
          `DTEND:${dateCompact}T${endCompact}`,
          `SUMMARY:[${item.category}] ${item.title}`,
          `LOCATION:${item.room}`,
          'END:VEVENT',
        ];
      }),
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'agenda-sidang-dosen-istts.ics';
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Agenda kalender berhasil diekspor ke berkas .ICS');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Kalender &amp; Ketersediaan Jadwal Dosen</h1>
          <p className="body-base text-[#475569] mt-1">
            Pemindaian ketersediaan mengajar dan bimbingan terhadap alokasi ruang sidang BAA serta
            agenda sidang terkonfirmasi dari Kaprodi
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="btn-primary shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[1.75]" />
          Tambah Jadwal Mengajar / Bimbingan
        </button>
      </div>

      <AlertBanner
        variant="info"
        title={`Status Ketersediaan Otomatis: ${freeCount} dari ${scannedSlots.length} slot ruang sidang BAA dinyatakan Bebas Bentrok`}
        description="Penentuan dewan penguji dan mahasiswa dilakukan oleh Kaprodi pada menu Penjadwalan Sidang; jadwal yang diterbitkan Kaprodi otomatis masuk ke agenda kalender ini."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Confirmed Calendar Agenda */}
        <section className="lg:col-span-6 rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="headline-sm text-[#0B1C30]">Agenda Kalender Dosen</h2>
            <button
              type="button"
              onClick={handleExportIcs}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[1.5]" />
              Ekspor .ICS
            </button>
          </div>

          {sortedAgenda.length === 0 ? (
            <EmptyState message="Belum ada agenda pada kalender dosen." />
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {sortedAgenda.map((item) => (
                <div key={item.id} className="px-6 py-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 label-sm ${
                        item.category === 'Sidang Terkonfirmasi'
                          ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                          : item.category === 'Mengajar'
                            ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                            : 'bg-[#FFEDD5] text-[#C2410C] border-[#FDBA74]'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="code-meta text-[#475569]">
                      {item.dayOfWeek}, {formatDateId(item.date)}
                    </span>
                  </div>
                  <p className="body-semibold text-[#0B1C30]">{item.title}</p>
                  <p className="code-meta text-[#475569]">
                    {item.startTime} - {item.endTime} WIB — {item.room}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right 6 Columns: Read-Only Cross-Check Against BAA Rooms */}
        <section className="lg:col-span-6 rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="headline-sm text-[#0B1C30]">
              Status Cross-Check Slot Ruang Sidang BAA
            </h2>
            <span className="code-meta text-[#475569]">{freeCount} bebas bentrok</span>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {scannedSlots.map(({ slot, conflict, isFree }, idx) => (
              <div
                key={slot.id}
                className={`p-5 flex items-start justify-between gap-4 ${
                  idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'
                }`}
              >
                <div className="space-y-1">
                  <p className="body-semibold text-[#0B1C30]">
                    {slot.dayOfWeek}, {formatDateId(slot.date)} — {slot.startTime} - {slot.endTime}{' '}
                    WIB
                  </p>
                  <p className="code-meta text-[#475569]">{slot.room}</p>
                  {conflict && (
                    <p className="code-meta text-[#B91C1C]">
                      Bentrok dengan [{conflict.category}] {conflict.title} ({conflict.startTime} -{' '}
                      {conflict.endTime})
                    </p>
                  )}
                </div>
                <StatusBadge status={isFree ? 'Bebas Bentrok' : 'Bentrok'} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Add Schedule Block Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Jadwal Mengajar / Bimbingan"
      >
        <form onSubmit={handleAddBusyBlock} className="space-y-4">
          <div>
            <label htmlFor="blk-title" className="block label-md text-[#0B1C30] mb-1.5">
              Nama Mata Kuliah / Kegiatan Bimbingan
            </label>
            <input
              id="blk-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Contoh: Kuliah Deep Learning (INF-412)"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="blk-cat" className="block label-md text-[#0B1C30] mb-1.5">
                Kategori
              </label>
              <select
                id="blk-cat"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as 'Mengajar' | 'Bimbingan')}
                className="input-field"
              >
                <option value="Mengajar">Mengajar</option>
                <option value="Bimbingan">Bimbingan</option>
              </select>
            </div>
            <div>
              <label htmlFor="blk-room" className="block label-md text-[#0B1C30] mb-1.5">
                Ruangan
              </label>
              <input
                id="blk-room"
                type="text"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="blk-date" className="block label-md text-[#0B1C30] mb-1.5">
                Tanggal
              </label>
              <input
                id="blk-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="blk-day" className="block label-md text-[#0B1C30] mb-1.5">
                Hari
              </label>
              <select
                id="blk-day"
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="input-field"
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="blk-start" className="block label-md text-[#0B1C30] mb-1.5">
                Jam Mulai
              </label>
              <input
                id="blk-start"
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="blk-end" className="block label-md text-[#0B1C30] mb-1.5">
                Jam Selesai
              </label>
              <input
                id="blk-end"
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary">
              Simpan ke Jadwal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
