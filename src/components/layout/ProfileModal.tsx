import React, { useEffect, useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Modal } from '../ui/Modal';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose }) => {
  const { currentUser, updateProfile } = usePortal();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (currentUser && open) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setPhone(currentUser.phone);
    }
  }, [currentUser, open]);

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    updateProfile({ name, email, phone });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Ubah Profil Pengguna" maxWidthClass="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block label-md text-[#0B1C30] mb-1.5">
            {currentUser.role === 'mahasiswa' ? 'NIM' : 'NIDN'}
          </label>
          <input
            type="text"
            value={currentUser.identifier}
            disabled
            className="input-field bg-[#F1F5F9] text-[#475569]"
          />
        </div>

        <div>
          <label className="block label-md text-[#0B1C30] mb-1.5">Program Studi / Unit</label>
          <input
            type="text"
            value={currentUser.department}
            disabled
            className="input-field bg-[#F1F5F9] text-[#475569]"
          />
        </div>

        <div>
          <label htmlFor="profile-name" className="block label-md text-[#0B1C30] mb-1.5">
            Nama Lengkap
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="profile-email" className="block label-md text-[#0B1C30] mb-1.5">
            Surel Institusi
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="block label-md text-[#0B1C30] mb-1.5">
            Nomor Telepon
          </label>
          <input
            id="profile-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button type="submit" className="btn-primary">
            Simpan Perubahan
          </button>
        </div>
      </form>
    </Modal>
  );
};
