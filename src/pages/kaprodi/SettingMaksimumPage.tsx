import React, { useEffect, useState } from 'react';
import { usePortal } from '../../context/PortalContext';

export const SettingMaksimumPage: React.FC = () => {
  const { maxQuotas, lecturers, theses, updateMaxQuotaSetting } = usePortal();

  const [department, setDepartment] = useState(maxQuotas[0]?.department ?? 'S1 Informatika');
  const [maxPerPeriod, setMaxPerPeriod] = useState(maxQuotas[0]?.maxPerPeriod ?? 4);
  const [maxPerSemester, setMaxPerSemester] = useState(maxQuotas[0]?.maxPerSemester ?? 6);

  useEffect(() => {
    const found = maxQuotas.find((q) => q.department === department);
    if (found) {
      setMaxPerPeriod(found.maxPerPeriod);
      setMaxPerSemester(found.maxPerSemester);
    }
  }, [department, maxQuotas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMaxQuotaSetting(department, maxPerPeriod, maxPerSemester);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline-lg text-[#0B1C30]">Setting Maksimum Proposal</h1>
        <p className="body-base text-[#475569] mt-1">
          Pemerataan batas maksimum mahasiswa bimbingan per dosen dalam setiap periode dan
          semester
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6 sm:p-8 space-y-5"
        >
          <h2 className="headline-md text-[#0F2A66] pb-4 border-b border-[#E2E8F0]">
            Pengaturan Batas Bimbingan per Jurusan
          </h2>

          <div>
            <label htmlFor="quota-dept" className="block label-md text-[#0B1C30] mb-1.5">
              Pilih Jurusan
            </label>
            <select
              id="quota-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="input-field"
            >
              {maxQuotas.map((q) => (
                <option key={q.department} value={q.department}>
                  {q.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quota-period" className="block label-md text-[#0B1C30] mb-1.5">
                Maksimum Bimbingan / Periode
              </label>
              <input
                id="quota-period"
                type="number"
                min={1}
                max={15}
                value={maxPerPeriod}
                onChange={(e) => setMaxPerPeriod(Number(e.target.value))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="quota-sem" className="block label-md text-[#0B1C30] mb-1.5">
                Maksimum Bimbingan / Semester
              </label>
              <input
                id="quota-sem"
                type="number"
                min={1}
                max={20}
                value={maxPerSemester}
                onChange={(e) => setMaxPerSemester(Number(e.target.value))}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
            <button type="submit" className="btn-primary">
              Simpan Batas Maksimum
            </button>
          </div>
        </form>

        <section className="lg:col-span-6 rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E2E8F0]">
            <h2 className="headline-sm text-[#0B1C30]">Beban Bimbingan Dosen Saat Ini</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Dosen</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                    Aktif
                  </th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                    Batas Maksimum
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {lecturers.map((lec, idx) => {
                  const count = theses.filter(
                    (t) => t.advisor1Id === lec.id || t.advisor2Id === lec.id,
                  ).length;
                  return (
                    <tr key={lec.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                      <td className="py-3.5 px-6">
                        <p className="body-semibold text-[#0B1C30]">{lec.name}</p>
                        <p className="code-meta text-[#475569]">{lec.expertise}</p>
                      </td>
                      <td className="py-3.5 px-4 body-semibold text-[#0F2A66] text-right">
                        {count}
                      </td>
                      <td className="py-3.5 px-6 body-base text-[#475569] text-right">
                        {lec.maxQuota} mahasiswa
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
