import React, { useState } from 'react';
import { Footer } from './components/layout/Footer';
import { ProfileModal } from './components/layout/ProfileModal';
import { TopAppBar } from './components/layout/TopAppBar';
import { PdfPreviewModal } from './components/ui/PdfPreviewModal';
import { Toast } from './components/ui/Toast';
import { PortalProvider, usePortal } from './context/PortalContext';
import { LoginPage } from './pages/LoginPage';
import { DosenDashboard } from './pages/dosen/DosenDashboard';
import { DosenRekomendasiPage } from './pages/dosen/DosenRekomendasiPage';
import { PromotorS3Page } from './pages/dosen/PromotorS3Page';
import { SidangPenilaianPage } from './pages/dosen/SidangPenilaianPage';
import { SinkronisasiJadwalPage } from './pages/dosen/SinkronisasiJadwalPage';
import { TulisReviewPage } from './pages/dosen/TulisReviewPage';
import { KaprodiDashboard } from './pages/kaprodi/KaprodiDashboard';
import { LaporanKaprodiPage } from './pages/kaprodi/LaporanKaprodiPage';
import { PenjadwalanSidangPage } from './pages/kaprodi/PenjadwalanSidangPage';
import { PlottingReviewerPage } from './pages/kaprodi/PlottingReviewerPage';
import { SettingMaksimumPage } from './pages/kaprodi/SettingMaksimumPage';
import { CariProposalPage } from './pages/mahasiswa/CariProposalPage';
import { DownloadProposalPage } from './pages/mahasiswa/DownloadProposalPage';
import { HasilSidangPage } from './pages/mahasiswa/HasilSidangPage';
import { MahasiswaDashboard } from './pages/mahasiswa/MahasiswaDashboard';
import { RekomendasiJudulPage } from './pages/mahasiswa/RekomendasiJudulPage';
const UploadProposalPage = React.lazy(() => import('./pages/mahasiswa/UploadProposalPage').then(module => ({ default: module.UploadProposalPage })));
const UploadRevisiPage = React.lazy(() => import('./pages/mahasiswa/UploadRevisiPage').then(module => ({ default: module.UploadRevisiPage })));

const PortalShell: React.FC = () => {
  const { currentUser, activeTab, focusedThesisId } = usePortal();
  const [profileOpen, setProfileOpen] = useState(false);

  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <Toast />
      </>
    );
  }

  const renderPage = () => {
    if (currentUser.role === 'mahasiswa') {
      switch (activeTab) {
        case 'upload-proposal':
          return <React.Suspense fallback={<p role="status">Memuat formulir proposal…</p>}><UploadProposalPage /></React.Suspense>;
        case 'upload-revisi':
          return <React.Suspense fallback={<p role="status">Memuat halaman revisi…</p>}><UploadRevisiPage /></React.Suspense>;
        case 'hasil-sidang':
          return <HasilSidangPage key={focusedThesisId} />;
        case 'download-proposal':
          return <DownloadProposalPage key={focusedThesisId} />;
        case 'cari-proposal':
          return <CariProposalPage />;
        case 'rekomendasi-judul':
          return <RekomendasiJudulPage />;
        default:
          return <MahasiswaDashboard />;
      }
    }

    if (currentUser.role === 'dosen') {
      switch (activeTab) {
        case 'tulis-review':
          return <TulisReviewPage />;
        case 'sidang-proposal':
          return <SidangPenilaianPage />;
        case 'rekomendasi-judul':
          return <DosenRekomendasiPage />;
        case 'cari-dokumen':
          return <CariProposalPage pageTitle="Cari Dokumen TA & Tesis" />;
        case 'promotor-s3':
          return <PromotorS3Page />;
        case 'sinkronisasi-jadwal':
          return <SinkronisasiJadwalPage />;
        default:
          return <DosenDashboard />;
      }
    }

    switch (activeTab) {
      case 'plotting-reviewer':
        return <PlottingReviewerPage />;
      case 'penjadwalan-sidang':
        return <PenjadwalanSidangPage />;
      case 'setting-maksimum':
        return <SettingMaksimumPage />;
      case 'laporan':
        return <LaporanKaprodiPage />;
      case 'cari-dokumen':
        return <CariProposalPage pageTitle="Cari Dokumen TA & Tesis" />;
      default:
        return <KaprodiDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <TopAppBar onOpenProfile={() => setProfileOpen(true)} />
      <main className="flex-1 pt-[104px] pb-12 px-4 sm:px-6">
        <div className="mx-auto max-w-[1320px]">{renderPage()}</div>
      </main>
      <Footer />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <PdfPreviewModal />
      <Toast />
    </div>
  );
};

export const App: React.FC = () => (
  <PortalProvider>
    <PortalShell />
  </PortalProvider>
);

export default App;
