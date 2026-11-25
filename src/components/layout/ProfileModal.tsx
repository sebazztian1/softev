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

  useEffect(() => {
    if (currentUser && open) {
      setName(currentUser.name);
      setEmail(currentUser.email);
    }
  }, [currentUser, open]);

  if (!currentUser) return null;

  const isMahasiswa = currentUser.role === 'mahasiswa';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || (!isMahasiswa && !name.trim())) return;
    updateProfile({ name, email });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Ubah Profil Pengguna" maxWidthClass="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block label-md text-[#0B1C30] mb-1.5">Username</label>
            <input
              type="text"
              value={currentUser.username}
              disabled
              className="input-field bg-[#F1F5F9] text-[#475569]"
            />
          </div>
          <div>
            <label className="block label-md text-[#0B1C30] mb-1.5">
              {isMahasiswa ? 'NRP / NIM' : 'NIDN'}
            </label>
            <input
              type="text"
              value={currentUser.identifier}
              disabled
              className="input-field bg-[#F1F5F9] text-[#475569]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block label-md text-[#0B1C30] mb-1.5">Jurusan / Program Studi</label>
            <input
              type="text"
              value={currentUser.department}
              disabled
              className="input-field bg-[#F1F5F9] text-[#475569]"
            />
          </div>
          {isMahasiswa && (
            <div>
              <label className="block label-md text-[#0B1C30] mb-1.5">IPK</label>
              <input
                type="text"
                value={currentUser.ipk?.toFixed(2) ?? '-'}
                disabled
                className="input-field bg-[#F1F5F9] text-[#475569]"
              />
            </div>
          )}
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
            disabled={isMahasiswa}
            required
            className={`input-field ${isMahasiswa ? 'bg-[#F1F5F9] text-[#475569]' : ''}`}
          />
          {isMahasiswa && (
            <p className="code-meta text-[#64748B] mt-1">
              Data username, nama, jurusan, dan IPK dikelola otomatis oleh sistem akademik.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="profile-email" className="block label-md text-[#0B1C30] mb-1.5">
            Alamat Email
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

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button type="submit" className="btn-primary">
            Submit
          </button>
        </div>
      </form>
    </Modal>
  );
};
