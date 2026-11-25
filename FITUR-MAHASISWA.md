# Fitur Mahasiswa Portal Tugas Akhir ISTTS

Dokumentasi implementasi dan pengujian per 25 November 2026. Portal berjalan sebagai aplikasi frontend dengan data simulasi dan penyimpanan peramban.

## Rujukan

- Spesifikasi PDF 29 halaman tersedia di [docs](docs/Software%20Evolution%20(sebastian,tegar,nicho)%20(1).pdf).
- Ringkasan kebutuhan ada pada [software-evolution.md](docs/software-evolution.md). Nomor halaman pada ringkasan mengikuti PDF versi 27 halaman.
- Tampilan mengikuti palet, tipografi, tombol, garis pembatas, dan badge status yang sudah digunakan proyek. Rancangan awal tersedia pada [design(1).md](design(1).md).

## Akun mahasiswa

| Nama | Username | NRP | Kata sandi demo | Kondisi awal |
| --- | --- | --- | --- | --- |
| Kevin Hartanto | kevin.hartanto | 221116942 | istts2026 | Memiliki proposal, catatan sidang, dan riwayat revisi dari data dummy proyek |
| Budi Santoso | budi.santoso | 221116950 | istts2026 | Belum mengunggah proposal |
| Raka Pratama | raka.pratama | 221116951 | istts2026 | Belum mengunggah proposal, mencoba pembimbing yang kuotanya penuh |
| Dina Putri | dina.putri | 221116952 | istts2026 | Terlambat mengunggah proposal, tenggat 24 November 2026 pukul 23.59 WIB |
| Fira Anindya | fira.anindya | 221116953 | istts2026 | Proposal periode Genap 2025/2026 membutuhkan revisi, tenggat revisi sudah berakhir |

Akun Fira memakai proposal periode lama dari materi dummy dengan identitas serta ID berkas tersendiri. Tenggat revisinya **24 November 2026 pukul 23.59 WIB**. Halaman Upload Revisi menampilkan batas waktu berakhir dan catatan penilai, sementara berkas proposal serta hasil sidang tetap dapat dibaca. Akun tersedia pada akses cepat **Mahasiswa — Terlambat Upload Revisi**.

Akun Dina memakai tenggat pengajuan khusus untuk skenario terlambat. Dasbor menampilkan pengajuan ditutup, halaman unggah menutup formulir, dan penyimpanan serta reservasi topik memeriksa tenggat yang sama. Tenggat khusus mengambil batas yang lebih awal antara batas akun dan periode. Akun tersedia otomatis saat penyimpanan lama dimuat, serta melalui akses cepat **Mahasiswa — Terlambat Upload Proposal**.

Akun Raka tersedia melalui akses cepat **Mahasiswa — Kuota Pembimbing Penuh**. Hendra Wijaya mempunyai 4/4 mahasiswa aktif setelah penambahan pengajuan pendukung Andreas Wijaya memakai identitas, judul, dan abstrak dari arsip dummy. Pembimbing penuh ditandai pada pilihan dan ditolak oleh validasi pengajuan. Pembimbing dengan kuota tersedia dapat dipilih untuk melanjutkan. Akun dan pengajuan pendukung ditambahkan saat penyimpanan lama dimuat.

Akun Budi ditambahkan sesuai permintaan untuk mencoba pengajuan perdana. Nama dan NRP akun baru dipilih untuk kebutuhan simulasi. Akun ini juga tersedia pada tombol akses cepat **Mahasiswa — Belum Upload Proposal**. Penyimpanan lama otomatis memperoleh akun tambahan saat aplikasi dimuat. Pengajuan, email profil, dan notifikasi terkait proposal mengikuti mahasiswa yang sedang masuk.

Setelah Budi mengirim proposal, akun tersebut menyimpan pengajuannya saat halaman dimuat ulang atau pengguna masuk kembali. Tombol **Reset Data** pada halaman login mengembalikan seluruh simulasi ke kondisi awal, termasuk pengajuan akun lain.

## Login, profil, dan navigasi

- Masuk menggunakan username, NRP, atau email akun. Sandi mahasiswa diperiksa terhadap sandi demo.
- Menampilkan atau menyembunyikan kata sandi, pesan validasi login, dan petunjuk menghubungi Departemen IT saat lupa sandi.
- Sesi tersimpan setelah memuat ulang halaman. Menu profil menyediakan aksi keluar.
- Profil mahasiswa menampilkan identitas, program studi, dan IPK. Email dapat diperbarui dengan validasi format dan tersimpan per akun.
- Tujuh tujuan navigasi tersedia melalui tab desktop atau menu ponsel. Logo kembali ke dasbor dan menu aktif ditandai.
- Notifikasi menampilkan jumlah belum dibaca, membuka halaman terkait, dan dapat ditandai seluruhnya sebagai sudah dibaca.

## Dashboard

- Identitas mahasiswa, judul terbaru, pembimbing, periode, dan status pengajuan.
- Tombol tindakan sesuai kondisi pengajuan, seperti mengunggah proposal, mengirim revisi, atau melihat hasil sidang.
- Jadwal sidang yang sudah tercatat, termasuk tanggal, jam, dan ruangan.
- Kalender berupa daftar agenda akademik mahasiswa yang memuat sidang dan tenggat proposal serta revisi.
- Tabel periode dengan status buka/tutup, batas akhir, sisa waktu, dan tautan halaman unggah.
- Berkas terbaru dengan tanggal, versi, pratinjau PDF, dan akses ke semua berkas.
- Catatan penilai terbaru dan akses hasil sidang.
- Detail tahap pengerjaan, judul awal sebelum penyesuaian, dan pedoman pengajuan tersedia dalam bagian yang dapat dibuka.
- Kondisi kosong menyediakan jalan untuk memulai pengajuan pertama.

## Upload Proposal

1. Unduh formulir pengajuan langsung dari halaman.
2. Isi jenis pengajuan **Judul Baru** atau **Perpanjangan**, judul, bidang minat, abstrak, tag, pembimbing utama, dan co-pembimbing opsional.
3. Lanjut ke tahap unggah. Data tetap tersedia ketika kembali ke langkah sebelumnya selama formulir masih terbuka.
4. Pilih PDF melalui pemilih berkas atau seret-lepas. Berkas dapat dihapus dan dipilih ulang.
5. Centang konfirmasi kebenaran berkas dan persetujuan pembimbing.
6. Kirim pengajuan dan lihat bukti berisi identitas, judul, pembimbing, periode, waktu, nama berkas, dan ukurannya.

Formulir menggunakan PDF F-048 v6 yang tersedia secara lokal. Ukurannya 88.728 byte dan sidik SHA-256-nya `9b72f9e2d5c4e561e674071b75de187bc6f5f9333c3908c81e96e800498f2501`. PDF dapat dipratinjau dan diunduh dari menu berkas.

Validasi pengajuan mencakup isian wajib, minimal satu tag, pembimbing yang berbeda, kuota bimbingan, konfirmasi, ekstensi PDF, awalan isi PDF, dan ukuran maksimal 20 MiB atau 20.971.520 byte. UI menuliskan batas tersebut sebagai 20 MB.

Kuota mengikuti pengaturan periode, semester, dan dosen yang tersedia dalam data proyek. Perhitungan memasukkan pembimbing serta co-pembimbing dan menghitung mahasiswa unik untuk program studi dan periode terkait.

Tenggat diperiksa saat pengajuan disimpan, termasuk ketika formulir dibuka sebelum tenggat. Judul dan pembimbing perpanjangan terkunci setelah pengajuan dikirim. Pengajuan judul baru memiliki catatan dan hasil sidang sendiri. Hasil serta berkas pengajuan sebelumnya tersedia melalui pilihan riwayat.

Bukti pengajuan disimpan sebagai notifikasi lokal yang membuka berkas pengajuan terkait.

## Upload Revisi

- Formulir terbuka ketika status meminta revisi, termasuk **Perlu Revisi**, **Diperbaiki**, dan **Perbaikan Bersyarat**.
- Halaman menampilkan periode, status, tenggat, sisa waktu, catatan perbaikan, dan profil mahasiswa yang dapat dibuka.
- Pengajuan yang memenuhi ketentuan dapat menyesuaikan jenis pengerjaan, judul, pembimbing, dan co-pembimbing. Kuota serta ketentuan perpanjangan diterapkan kembali saat menyimpan.
- Ringkasan perubahan dan PDF wajib diisi. Pemilihan, seret-lepas, penghapusan berkas, format, dan batas ukuran mengikuti validasi unggah.
- Tenggat menutup formulir dan diperiksa kembali pada proses penyimpanan.
- Unggahan berhasil menambahkan versi revisi, menyimpan ringkasan serta waktu, dan mengubah status menjadi **Menunggu Verifikasi**.
- QR dapat dipindai dan memuat token revisi yang ditampilkan. Nomor token terus meningkat untuk mahasiswa yang sama, termasuk setelah membuat pengajuan baru.
- Berkas revisi dapat diakses melalui menu Download Proposal.

## Hasil Sidang Proposal

- Identitas, periode, judul terbaru, pembimbing, status keputusan, nilai, dan jadwal sidang.
- Judul sebelum penyesuaian tersedia dalam detail yang dapat dibuka.
- Empat status keputusan mengikuti data, yaitu **Diterima**, **Diperbaiki**, **Perbaikan Bersyarat**, dan **Ditolak**.
- Maksimal empat penilai berbeda ditampilkan beserta status, catatan, saran, waktu penilaian, dan lampiran koreksi yang tersedia.
- Daftar syarat perbaikan dapat dibuka dari ringkasan.
- Tindakan mengarah ke unggah revisi untuk pengajuan aktif yang membutuhkan revisi atau ke berkas pengajuan yang dipilih.
- Pilihan riwayat memungkinkan pembacaan hasil pengajuan sebelumnya.
- Keadaan belum mengajukan dan belum dinilai memiliki pesan serta tindakan yang sesuai.

## Download Proposal

- Menampilkan proposal awal, koreksi, dan setiap versi revisi milik mahasiswa yang masuk.
- Memilih pengajuan aktif atau pengajuan lama melalui riwayat.
- Menampilkan nama, versi, tanggal, keterangan, dan ukuran berkas.
- Pratinjau PDF dan unduhan menggunakan sumber berkas yang sama.
- Berkas unggahan tersimpan dengan isi asli dan dapat diunduh setelah muat ulang.
- Formulir dan pedoman mencakup F-048, panduan sitasi IEEE, formulir berita acara/matriks revisi, dan rubrik penilaian dari data yang tersedia.
- Dialog pratinjau menyediakan unduhan dan dapat ditutup melalui tombol atau Escape.
- Kegagalan mengambil berkas unggahan dari penyimpanan peramban ditampilkan kepada pengguna.

## Cari Proposal & TA

- Arsip menggunakan delapan dokumen dummy yang sudah ada.
- Pencarian mencakup judul, NRP, nama, kata kunci, bidang, isi abstrak yang tersedia, dan metadata terkait.
- Filter utama mencakup dosen pembimbing dan jenis dokumen.
- Filter lanjutan mencakup periode, jurusan/program studi, perpanjangan, dan tag. Seluruh tag terpilih harus cocok.
- Hasil menggunakan kombinasi filter yang diisi dan menyediakan tombol menghapus semua filter.
- Tabel memuat sembilan kolom, yaitu NRP, nama, IPK, judul, pembimbing, co-pembimbing, periode, perpanjangan, dan unduhan.
- Jumlah baris dapat dipilih 5, 10, atau 25. Input nomor halaman dibatasi ke rentang halaman yang tersedia.
- Detail dokumen memuat metadata dan abstrak serta tindakan pratinjau dan unduh.
- Hasil kosong ditampilkan dengan pesan yang jelas.

Program studi arsip berasal dari data yang tersedia. Entri yang belum memiliki data program studi ditandai **Belum tercatat**. Pencarian isi memanfaatkan abstrak arsip yang tersedia.

## Rekomendasi Judul

- Melihat judul, bidang, dosen pengusul, status, dan sisa kuota topik.
- Memfilter bidang serta status dan membuka deskripsi serta prasyarat teknis.
- Mengambil topik yang tersedia untuk mengisi judul, bidang, abstrak, dan pembimbing pada formulir proposal.
- Pilihan topik bertahan setelah memuat ulang dan menggunakan satu jatah selama proses pengajuan.
- Mengganti topik atau memilih **Bersihkan Pilihan** melepas jatah pilihan sebelumnya.
- Perpindahan ke akun mahasiswa lain juga melepas reservasi draf akun sebelumnya.
- Topik penuh atau sudah direservasi dibatasi sesuai data.

## Penyimpanan dan batas simulasi

Metadata akun, sesi, pengajuan, reservasi, dan notifikasi menggunakan `localStorage` dengan kunci `istts_portal_ta_state_v3`. Berkas unggahan memakai fasilitas IndexedDB peramban yang sudah terdapat pada proyek melalui `fileStorage.ts`. Semua data tersebut berada di peramban dan perangkat yang digunakan.

Login menggunakan kredensial demo lokal. Konfirmasi unggah menggunakan bukti dan notifikasi portal lokal. Integrasi akun institusi, pengiriman email, sinkronisasi antarperangkat, serta layanan server memerlukan integrasi tersendiri.

Sebagian PDF dummy merupakan ringkasan yang dibuat dari metadata dan isi contoh proyek. F-048 menggunakan aset PDF asli. Dokumen yang diunggah pengguna menggunakan byte berkas unggahan. Ukuran pada daftar berkas mengikuti PDF yang dihasilkan atau berkas unggahan tersebut.

## Pemeriksaan ulang

Hasil akhir pada 25 November 2026 adalah **62 skenario lulus, 0 gagal** dalam 55,7 detik pada Microsoft Edge. Build TypeScript dan Vite berhasil. Vite memberikan peringatan ukuran bundle JavaScript utama sebesar sekitar 594,5 kB sebelum gzip.

Perintah pengujian membangun aplikasi dengan TypeScript dan Vite, kemudian menjalankan Playwright melalui alur antarmuka mahasiswa.

```powershell
npm.cmd run test:mahasiswa
```

Windows menggunakan Microsoft Edge secara default. Browser lain dapat dipilih melalui `PORTAL_TEST_BROWSER` jika tersedia pada Playwright. Port bawaan preview adalah 4387. Bila port digunakan proses lain, jalankan dengan port lokal kosong.

```powershell
$env:PORTAL_TEST_PORT='46375'
npm.cmd run test:mahasiswa
```

| Kelompok | Jumlah skenario | Berkas pengujian |
| --- | --- | --- |
| Login, profil, navigasi, dashboard, hasil sidang, kalender, dan kondisi kosong | 20 | [akses-dan-sidang.spec.mjs](tests/mahasiswa/akses-dan-sidang.spec.mjs) |
| Pengajuan, PDF resmi, kuota, perpanjangan, rekomendasi, tenggat, bukti lokal | 16 | [pengajuan.spec.mjs](tests/mahasiswa/pengajuan.spec.mjs) |
| Revisi, perubahan data, PDF, tenggat, versi, dan pembacaan QR | 8 | [revisi.spec.mjs](tests/mahasiswa/revisi.spec.mjs) |
| Berkas, pratinjau, unduhan, pencarian, dan pagination | 7 | [berkas.spec.mjs](tests/mahasiswa/berkas.spec.mjs) |
| Akun baru, penyimpanan lama, keadaan kosong, dan pemisahan data | 3 | [akun-baru.spec.mjs](tests/mahasiswa/akun-baru.spec.mjs) |
| Integrasi login mahasiswa, dekan, dan kaprodi setelah merge | 2 | [integrasi-login.spec.mjs](tests/mahasiswa/integrasi-login.spec.mjs) |
| Akun skenario kuota penuh, migrasi data, penolakan, dan pembimbing alternatif | 2 | [kuota-penuh.spec.mjs](tests/mahasiswa/kuota-penuh.spec.mjs) |
| Akun terlambat, penutupan formulir, reservasi, dan pengiriman setelah tenggat | 2 | [terlambat.spec.mjs](tests/mahasiswa/terlambat.spec.mjs) |
| Akun revisi terlambat, migrasi data, catatan, dan berkas pengajuan lama | 2 | [terlambat-revisi.spec.mjs](tests/mahasiswa/terlambat-revisi.spec.mjs) |
| Total | 62 | Antarmuka mahasiswa dan integrasi login |

Pengujian navigasi mencakup viewport desktop 1440 px dan ponsel 390 px. PDF unggahan dibandingkan byte demi byte dengan unduhannya. F-048 diperiksa ukuran serta sidik berkasnya. QR pada layar didekode untuk memeriksa token. Tenggat diuji pada formulir tertutup dan formulir yang sudah terbuka. Skenario kuota, status, dan batas waktu menggunakan variasi terisolasi dari data proyek pada konteks browser pengujian.

Skenario konfirmasi nomor 46 menggunakan bukti lokal sesuai batas aplikasi frontend. Kebutuhan pengiriman email pada PDF dicatat sebagai integrasi lanjutan.
