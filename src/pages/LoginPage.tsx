import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { IsttsLogo } from '../components/ui/IsttsLogo';
import { UserRole } from '../types/portal';

const SIMULATION_ROLES: Array<{
  role: UserRole;
  title: string;
  name: string;
  identifier: string;
  username: string;
  studentId?: string;
}> = [
  {
    role: 'mahasiswa',
    title: 'Mahasiswa',
    name: 'Kevin Hartanto',
    identifier: 'NRP 221116942 — S1 Informatika',
    username: 'kevin.hartanto',
  },
  {
    role: 'mahasiswa',
    title: 'Mahasiswa — Belum Upload Proposal',
    name: 'Budi Santoso',
    identifier: 'NRP 221116950 — S1 Informatika',
    username: 'budi.santoso',
    studentId: 'usr-mhs-new-01',
  },
  {
    role: 'mahasiswa',
    title: 'Mahasiswa — Kuota Pembimbing Penuh',
    name: 'Raka Pratama',
    identifier: 'NRP 221116951 — S1 Informatika',
    username: 'raka.pratama',
    studentId: 'usr-mhs-quota-01',
  },
  {
    role: 'mahasiswa',
    title: 'Mahasiswa — Terlambat Upload Proposal',
    name: 'Dina Putri',
    identifier: 'NRP 221116952 — S1 Informatika',
    username: 'dina.putri',
    studentId: 'usr-mhs-late-01',
  },
  {
    role: 'mahasiswa',
    title: 'Mahasiswa — Terlambat Upload Revisi',
    name: 'Fira Anindya',
    identifier: 'NRP 221116953 — S1 Informatika',
    username: 'fira.anindya',
    studentId: 'usr-mhs-late-revision-01',
  },
  {
    role: 'dosen',
    title: 'Dosen Pembimbing / Penguji / Promotor',
    name: 'Ir. Hendra Wijaya, S.Kom., M.Kom.',
    identifier: 'NIDN 0722058501 — S1 Informatika',
    username: 'hendra.wijaya',
  },
  {
    role: 'kaprodi',
    title: 'Ketua Program Studi (Kaprodi)',
    name: 'Dr. Ir. Gunawan Santoso, M.T.',
    identifier: 'NIDN 0714088102 — S1 Informatika',
    username: 'gunawan.santoso',
  },
];

export const LoginPage: React.FC = () => {
  const { login, loginAsRole, resetDemoData } = usePortal();
  const [identifier, setIdentifier] = useState('hendra.wijaya');
  const [password, setPassword] = useState('istts2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password.trim()) {
      setError('Masukkan username, NRP/NIDN, atau surel dan kata sandi terlebih dahulu.');
      return;
    }
    const username = identifier.trim().toLowerCase();
    // The merged demos share Budi's username and use distinct student/admin passwords.
    if (username === 'andi.wijaya' || (username === 'budi.santoso' && password !== 'istts2026')) {
      if (Date.now() < lockedUntil) {
        const remainingMinutes = Math.ceil((lockedUntil - Date.now()) / 60000);
        setError(`E-AUTH-002 — Akun terkunci setelah 5 kali percobaan masuk yang gagal. Coba lagi dalam ${remainingMinutes} menit atau hubungi Departemen IT.`);
        return;
      }
      if (password !== 'Demo#2026') {
        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);
        if (attempts >= 5) {
          setLockedUntil(Date.now() + 5 * 60 * 1000);
          setFailedAttempts(0);
          setError('E-AUTH-002 — Akun terkunci setelah 5 kali percobaan masuk yang gagal. Coba lagi dalam 5 menit atau hubungi Departemen IT.');
        } else {
          const remaining = 5 - attempts;
          setError(`E-AUTH-001 — Username/NRP atau kata sandi tidak sesuai. Periksa kembali data yang dimasukkan.${attempts >= 3 ? ` Sisa percobaan: ${remaining}.` : ''}`);
        }
        return;
      }
      setFailedAttempts(0);
      setLockedUntil(0);
      localStorage.setItem('tuntas-proto-v2:persona', username === 'andi.wijaya' ? 'andi' : 'budi');
      localStorage.setItem('tuntas-proto-v2:role', username === 'andi.wijaya' ? 'KAPRODI' : 'DEKAN');
      loginAsRole('kaprodi');
      return;
    }
    if (username === 'dosen.nonaktif') {
      setError('Akun tidak aktif. Hubungi Departemen IT untuk mengaktifkan kembali akun Anda.');
      return;
    }
    localStorage.removeItem('tuntas-proto-v2:persona');
    localStorage.removeItem('tuntas-proto-v2:role');
    const ok = login(identifier, password);
    if (!ok) {
      setError('Identitas atau kata sandi tidak sesuai.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between px-4 py-10">
      <div className="my-auto mx-auto w-full max-w-[460px]">
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
                Username / NRP / NIDN / Surel Institusi
              </label>
              <input
                id="login-id"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Contoh: hendra.wijaya atau 221116942"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="login-pw" className="block label-md text-[#0B1C30] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="login-pw"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-[#475569] hover:text-[#0F2A66] cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 stroke-[1.5]" /> : <Eye className="w-4 h-4 stroke-[1.5]" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="body-base text-[#B91C1C]" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full">
              Masuk
            </button>
            <p className="body-base text-[#475569]">
              Jika lupa kata sandi, hubungi Departemen IT.
            </p>
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
                  key={item.studentId ?? item.role}
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('tuntas-proto-v2:persona');
                    localStorage.removeItem('tuntas-proto-v2:role');
                    loginAsRole(item.role, item.studentId);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-[#F8FAFC] text-left transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="body-semibold text-[#0B1C30]">{item.title}</p>
                    <p className="code-meta text-[#475569] truncate">
                      {item.name} — @{item.username} ({item.identifier})
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
