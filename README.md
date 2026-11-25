# Portal Upload Tugas Akhir ISTTS

Prototype React/Vite untuk alur Mahasiswa, Dosen, Kaprodi, dan Dekan. Data disimpan secara lokal di browser dan tidak memerlukan backend.

## Menjalankan aplikasi

```sh
npm install
npm run dev
```

Bangun versi produksi dengan `npm run build`.

## Akun demo Kaprodi dan Dekan

Untuk skenario terlambat revisi, gunakan **Fira Anindya**, username `fira.anindya` atau NRP `221116953`, sandi `istts2026`. Proposal periode Genap 2025/2026 membutuhkan revisi dengan tenggat **24 November 2026 pukul 23.59 WIB**. Halaman Upload Revisi menampilkan tenggat berakhir dan catatan penilai.

Untuk skenario terlambat unggah proposal, gunakan **Dina Putri**, username `dina.putri` atau NRP `221116952`, sandi `istts2026`. Tenggat pengajuan akun ini adalah **24 November 2026 pukul 23.59 WIB**. Halaman Upload Proposal menampilkan batas waktu berakhir dan menutup formulir. Pengajuan dan reservasi topik setelah tenggat ditolak. Tenggat akun ini berlaku khusus untuk simulasi Dina.

Untuk skenario mahasiswa dengan pembimbing penuh, gunakan **Raka Pratama**, username `raka.pratama` atau NRP `221116951`, sandi `istts2026`. Buka **Upload Proposal** dan periksa Hendra Wijaya yang kuotanya sudah 4/4. Skenario menggunakan satu pengajuan pendukung Andreas Wijaya dari arsip dummy. Pilihan pembimbing penuh ditandai dan pengajuan dengan pembimbing tersebut ditahan oleh validasi.

| Username | Kata sandi | Peran awal |
|---|---|---|
| `andi.wijaya` | `Demo#2026` | Kaprodi S1-INFORMATIKA |
| `budi.santoso` | `Demo#2026` | Dekan; dapat beralih ke Kaprodi S1-ELEKTRO |
| `dosen.nonaktif` | `Demo#2026` | Akun nonaktif untuk pengujian |

Kredensial ini hanya untuk demonstrasi. Autentikasi dan penyimpanan aplikasi bukan untuk produksi.

Akun mahasiswa Budi Santoso menggunakan username `budi.santoso` atau NRP `221116950` dengan kata sandi `istts2026`. Username ini juga digunakan akun demo Dekan pada tabel di atas. Kata sandi demo menentukan akun yang dibuka. Tombol akses cepat mahasiswa membuka akun mahasiswa.

Tambahkan `?reset=1` ke URL untuk mengembalikan data prototype ke kondisi awal. Parameter `?simulate=network`, `?simulate=server`, dan `?simulate=timeout-after-commit` mensimulasikan kegagalan operasi tulis.
