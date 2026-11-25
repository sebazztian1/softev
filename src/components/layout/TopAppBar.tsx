import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, User, Users, X } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { UserRole } from '../../types/portal';
import { formatDateTimeId } from '../../utils/format';
import { IsttsLogo } from '../ui/IsttsLogo';

interface NavItem {
  id: string;
  label: string;
}

const MAHASISWA_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'upload-proposal', label: 'Upload Proposal' },
  { id: 'upload-revisi', label: 'Upload Revisi' },
  { id: 'hasil-sidang', label: 'Hasil Sidang Proposal' },
  { id: 'download-proposal', label: 'Download Proposal' },
  { id: 'cari-proposal', label: 'Cari Proposal & TA' },
  { id: 'rekomendasi-judul', label: 'Rekomendasi Judul' },
];

const KAPRODI_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'verifikasi-proposal', label: 'Verifikasi Proposal' },
  { id: 'penjadwalan-sidang', label: 'Penjadwalan Sidang' },
  { id: 'monitoring-ta', label: 'Monitoring TA' },
  { id: 'pengaturan-periode', label: 'Pengaturan Periode' },
];

const ROLE_LABEL: Record<UserRole, string> = {
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen',
  kaprodi: 'Kaprodi',
};

interface TopAppBarProps {
  onOpenProfile: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ onOpenProfile }) => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    navigateWithContext,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    switchRole,
    logout,
  } = usePortal();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const navItems = useMemo<NavItem[]>(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'mahasiswa') return MAHASISWA_NAV;
    if (currentUser.role === 'kaprodi') return KAPRODI_NAV;

    const roles = currentUser.structuralRoles ?? [];
    const items: NavItem[] = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'tulis-review', label: 'Tulis Review' },
      { id: 'sidang-proposal', label: 'Sidang Proposal' },
      { id: 'rekomendasi-judul', label: 'Rekomendasi Judul' },
      { id: 'cari-dokumen', label: 'Cari Dokumen' },
    ];
    if (roles.includes('promotor-s3')) {
      items.push({ id: 'promotor-s3', label: 'Promotor S3' });
    }
    if (roles.includes('koordinator-jadwal')) {
      items.push({ id: 'sinkronisasi-jadwal', label: 'Sinkronisasi Jadwal' });
    }
    return items;
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSelectNav = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-[72px] bg-white border-b border-[#E2E8F0]">
      <div className="mx-auto max-w-[1320px] h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: ISTTS Crest + Portal Title */}
        <button
          type="button"
          onClick={() => handleSelectNav('dashboard')}
          className="flex items-center gap-3 shrink-0 text-left cursor-pointer"
        >
          <IsttsLogo className="w-9 h-9 shrink-0" />
          <div className="leading-tight">
            <span className="block font-['Manrope'] text-[15px] font-bold text-[#0F2A66] tracking-[-0.01em] whitespace-nowrap">
              Portal Upload Tugas Akhir
            </span>
            <span className="hidden sm:block label-sm text-[#475569]">
              ISTTS — {ROLE_LABEL[currentUser.role]}
            </span>
          </div>
        </button>

        {/* Center: Horizontal Navigation Links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden lg:flex items-center justify-center gap-3 xl:gap-5 h-full overflow-x-auto"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`relative h-full inline-flex items-center px-1 text-[13px] xl:text-[14px] whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'font-semibold text-[#0F2A66]'
                    : 'font-medium text-[#475569] hover:text-[#0F2A66]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Notification Bell + User Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setProfileOpen(false);
              }}
              className="relative p-2 rounded-lg text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F2A66] cursor-pointer"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5 stroke-[1.5]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D97706] text-white text-[11px] font-semibold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E2E8F0] bg-white shadow-level-3 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
                  <span className="body-semibold text-[#0B1C30]">Notifikasi Interaktif</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="label-md text-[#0284C7] hover:underline cursor-pointer"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]">
                  {notifications.length === 0 ? (
                    <p className="body-base text-[#475569] px-4 py-6 text-center">
                      Belum ada notifikasi terbaru.
                    </p>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.targetTab) {
                            navigateWithContext(n.targetTab, n.targetSubTab, n.targetThesisId);
                          }
                          setNotifOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                          n.read ? 'bg-white' : 'bg-[#EFF6FF]/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="body-semibold text-[#0B1C30]">{n.title}</p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="body-base text-[#475569] mt-0.5">{n.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="code-meta text-[#64748B]">
                            {formatDateTimeId(n.createdAt)}
                          </p>
                          {n.targetTab && (
                            <span className="label-sm text-[#0284C7]">Buka halaman terkait</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#F1F5F9] cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#0F2A66] text-white flex items-center justify-center label-md shrink-0">
                {currentUser.initials}
              </div>
              <div className="hidden sm:block text-left max-w-[150px]">
                <p className="body-semibold text-[#0B1C30] truncate">{currentUser.name}</p>
                <p className="code-meta text-[#475569] truncate">@{currentUser.username}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-[#475569] stroke-[1.5]" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#E2E8F0] bg-white shadow-level-3 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <p className="body-semibold text-[#0B1C30] truncate">{currentUser.name}</p>
                  <p className="code-meta text-[#475569] truncate">
                    @{currentUser.username} — {currentUser.identifier}
                  </p>
                </div>

                <div className="py-1.5 border-b border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 body-medium text-[#0B1C30] hover:bg-[#F1F5F9] cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#475569] stroke-[1.5]" />
                    Ubah Profil
                  </button>
                </div>

                <div className="py-1.5 border-b border-[#E2E8F0]">
                  <p className="px-4 py-1 label-sm uppercase text-[#64748B]">
                    Simulasi Ganti Peran
                  </p>
                  {(['mahasiswa', 'dosen', 'kaprodi'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        switchRole(role);
                        setProfileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 body-medium hover:bg-[#F1F5F9] cursor-pointer ${
                        currentUser.role === role ? 'text-[#0F2A66] font-semibold' : 'text-[#0B1C30]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-[#475569] stroke-[1.5]" />
                        {ROLE_LABEL[role]}
                      </span>
                      {currentUser.role === role && (
                        <span className="label-sm text-[#0284C7]">Aktif</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 body-medium text-[#B91C1C] hover:bg-[#FEE2E2]/50 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 stroke-[1.5]" />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
            aria-label="Menu navigasi"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 stroke-[1.5]" />
            ) : (
              <Menu className="w-5 h-5 stroke-[1.5]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E2E8F0] bg-white shadow-level-2 px-4 py-3">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg body-medium cursor-pointer ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#0F2A66] font-semibold'
                      : 'text-[#475569] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
