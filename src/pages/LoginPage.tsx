import React, { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { IsttsLogo } from '../components/ui/IsttsLogo';
import { UserRole } from '../types/portal';

const SIMULATION_ROLES: Array<{
  role: UserRole;
  title: string;
  name: string;
  identifier: string;
}> = [
  {
    role: 'mahasiswa',
    title: 'Mahasiswa',
    name: 'Kevin Hartanto',
    identifier: 'NIM 221116942 — S1 Informatika',
  },
  {
    role: 'dosen',
    title: 'Dosen Pembimbing / Penguji',
    name: 'Ir. Hendra Wijaya, S.Kom., M.Kom.',
    identifier: 'NIDN 0722058501 — S1 Informatika',
  },
  {
    role: 'kaprodi',
    title: 'Ketua Program Studi (Kaprodi)',
    name: 'Dr. Ir. Gunawan Santoso, M.T.',
    identifier: 'NIDN 0714088102 — S1 Informatika',
  },
];

export const LoginPage: React.FC = () => {
  const { login, loginAsRole, resetDemoData } = usePortal();
  const [identifier, setIdentifier] = useState('221116942');
  const [password, setPassword] = useState('istts2026');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password.trim()) {
      setError('Masukkan NIM/NIDN/Surel dan kata sandi terlebih dahulu.');
      return;
    }
    const ok = login(identifier);
    if (!ok) {
      setError('Akun tidak ditemukan. Gunakan akun simulasi yang tersedia di bawah.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between px-4 py-10">
      <div className="my-auto mx-auto w-full max-w-[440px]">
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-[#E2E8F0]">
            <IsttsLogo className="w-10 h-10 shrink-0" />
            <div>
              <h1 className="headline-md text-[#0F2A66]">Portal Upload Tugas Akhir</h1>
              <p className="code-meta text-[#475569]">
                Institut Sains dan Teknologi Terpadu Surabaya
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label htmlFor="login-id" className="block label-md text-[#0B1C30] mb-1.5">
                NIM / NIDN / Surel Institusi
              </label>
              <input
                id="login-id"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Contoh: 221116942 atau 0722058501"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="login-pw" className="block label-md text-[#0B1C30] mb-1.5">
                Kata Sandi
              </label>
              <input
                id="login-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="input-field"
              />
            </div>

            {error && (
              <p className="body-base text-[#B91C1C]" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full">
              Masuk ke Portal
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <span className="label-md uppercase text-[#475569]">Akses Cepat Simulasi</span>
              <button
                type="button"
                onClick={resetDemoData}
                className="inline-flex items-center gap-1 label-md text-[#0284C7] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
                Reset Data
              </button>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden">
              {SIMULATION_ROLES.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => loginAsRole(item.role)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-[#F8FAFC] text-left transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="body-semibold text-[#0B1C30]">{item.title}</p>
                    <p className="code-meta text-[#475569] truncate">
                      {item.name} ({item.identifier})
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#0284C7] shrink-0 stroke-[1.75]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center body-base text-[#475569] mt-8">© ISTTS - Departemen IT</p>
    </div>
  );
};
