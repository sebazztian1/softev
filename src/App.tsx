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
import { MahasiswaBimbinganPage } from './pages/dosen/MahasiswaBimbinganPage';
import { SidangPenilaianPage } from './pages/dosen/SidangPenilaianPage';
import { KaprodiDashboard } from './pages/kaprodi/KaprodiDashboard';
import { MonitoringTaPage } from './pages/kaprodi/MonitoringTaPage';
import { PengaturanPeriodePage } from './pages/kaprodi/PengaturanPeriodePage';
import { PenjadwalanSidangPage } from './pages/kaprodi/PenjadwalanSidangPage';
import { VerifikasiProposalPage } from './pages/kaprodi/VerifikasiProposalPage';
import { CariProposalPage } from './pages/mahasiswa/CariProposalPage';
import { DownloadProposalPage } from './pages/mahasiswa/DownloadProposalPage';
import { HasilSidangPage } from './pages/mahasiswa/HasilSidangPage';
import { MahasiswaDashboard } from './pages/mahasiswa/MahasiswaDashboard';
import { RekomendasiJudulPage } from './pages/mahasiswa/RekomendasiJudulPage';
import { UploadProposalPage } from './pages/mahasiswa/UploadProposalPage';
import { UploadRevisiPage } from './pages/mahasiswa/UploadRevisiPage';

const PortalShell: React.FC = () => {
  const { currentUser, activeTab } = usePortal();
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
          return <UploadProposalPage />;
        case 'upload-revisi':
          return <UploadRevisiPage />;
        case 'hasil-sidang':
          return <HasilSidangPage />;
        case 'download-proposal':
          return <DownloadProposalPage />;
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
        case 'mahasiswa-bimbingan':
          return <MahasiswaBimbinganPage />;
        case 'sidang-penilaian':
          return <SidangPenilaianPage />;
        case 'rekomendasi-judul':
          return <DosenRekomendasiPage />;
        case 'arsip-proposal':
          return <CariProposalPage pageTitle="Arsip Proposal & TA" />;
        default:
          return <DosenDashboard />;
      }
    }

    switch (activeTab) {
      case 'verifikasi-proposal':
        return <VerifikasiProposalPage />;
      case 'penjadwalan-sidang':
        return <PenjadwalanSidangPage />;
      case 'monitoring-ta':
        return <MonitoringTaPage />;
      case 'pengaturan-periode':
        return <PengaturanPeriodePage />;
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
