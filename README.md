# Jekardah Chat untuk Android

Aplikasi Android untuk **[Jekardah Chat](https://chat.jekardah.com)** — chat ala WhatsApp dengan alamat email Gmail.

Dibuat sebagai **Trusted Web Activity (TWA)** dengan [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap):
aplikasi memakai mesin Chrome di HP, jadi **login Google, notifikasi, kamera, unduhan, reaksi, edit/hapus pesan**
dan semua fitur web berjalan sama persis, tampil layar penuh tanpa address bar, dan selalu versi terbaru
(tampilan & fitur dimuat dari chat.jekardah.com — tidak perlu update APK untuk fitur baru).

## Pasang

1. Unduh `Jekardah-Chat-<versi>.apk` dari halaman Releases.
2. Buka file-nya di HP. Bila diminta, izinkan **Pasang aplikasi tidak dikenal** untuk browser / File Manager.
3. Buka **Jekardah** dari layar utama, login dengan Google, lalu ketuk **Aktifkan notifikasi**.

Butuh Android 7.0+ dengan Google Chrome (bawaan hampir semua HP Android).

## Detail teknis

| | |
|---|---|
| Package | `com.jekardah.chat` |
| Mulai dari | `https://chat.jekardah.com/?source=android` |
| Verifikasi domain | `https://chat.jekardah.com/.well-known/assetlinks.json` (sidik jari SHA-256 kunci rilis) |
| Notifikasi | Delegasi notifikasi TWA: notifikasi web tampil sebagai notifikasi aplikasi Jekardah |
| Min / target SDK | 24 (Android 7.0) / 36 |

## Build

Butuh JDK 17 & Android SDK (build-tools 35, platform 36) di `~/.jekardah-android`, dan kunci rilis di
`~/.jekardah-android/keystore/` (`jekardah-release.jks` + `keystore.properties`).

```bash
npm install
npm run init-project   # buat ulang proyek Android dari konfigurasi di scripts/init-project.js
npm run build          # compile + tanda tangani: dist/Jekardah-Chat-<versi>.apk (pasang langsung) & .aab (Google Play)
```

Rilis baru: naikkan `version` di `package.json` (versionCode dihitung otomatis), lalu `npm run init-project && npm run build`.

> **Simpan cadangan kunci rilis** (`~/.jekardah-android/keystore/`) di tempat aman. Tanpa kunci yang sama,
> versi baru tidak bisa dipasang di atas versi lama, dan sidik jarinya terdaftar di `assetlinks.json`.
