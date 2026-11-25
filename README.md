# Portal Upload Tugas Akhir ISTTS

Prototype React/Vite untuk alur Mahasiswa, Dosen, Kaprodi, dan Dekan. Data disimpan secara lokal di browser dan tidak memerlukan backend.

## Menjalankan aplikasi

```sh
npm install
npm run dev
```

Bangun versi produksi dengan `npm run build`.

## Akun demo Kaprodi dan Dekan

| Username | Kata sandi | Peran awal |
|---|---|---|
| `andi.wijaya` | `Demo#2026` | Kaprodi S1-INFORMATIKA |
| `budi.santoso` | `Demo#2026` | Dekan; dapat beralih ke Kaprodi S1-ELEKTRO |
| `dosen.nonaktif` | `Demo#2026` | Akun nonaktif untuk pengujian |

Kredensial ini hanya untuk demonstrasi. Autentikasi dan penyimpanan aplikasi bukan untuk produksi.

Tambahkan `?reset=1` ke URL untuk mengembalikan data prototype ke kondisi awal. Parameter `?simulate=network`, `?simulate=server`, dan `?simulate=timeout-after-commit` mensimulasikan kegagalan operasi tulis.
