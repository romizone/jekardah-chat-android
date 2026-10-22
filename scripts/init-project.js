// Membuat proyek Android (Trusted Web Activity) untuk chat.jekardah.com dengan Bubblewrap.
// Aplikasi memakai mesin Chrome di HP, jadi login Google, notifikasi, dan semua fitur web berjalan sama persis.
// Jalankan ulang setelah mengubah konfigurasi di bawah: npm run init-project
const path = require('node:path');
const fs = require('node:fs');
const { TwaManifest, TwaGenerator, ConsoleLog } = require('@bubblewrap/core');

const KEYSTORE = path.join(require('node:os').homedir(), '.jekardah-android', 'keystore', 'jekardah-release.jks');
const OUT = path.join(__dirname, '..', 'twa');
const VERSION = require('../package.json').version;
// versionCode harus selalu naik di setiap rilis: 1.2.3 -> 10203
const VERSION_CODE = VERSION.split('.').reduce((n, p) => n * 100 + Number(p), 0);

(async () => {
  const base = (await TwaManifest.fromWebManifest('https://chat.jekardah.com/manifest.webmanifest')).toJson();
  const twa = new TwaManifest({
    ...base,
    packageId: 'com.jekardah.chat',
    host: 'chat.jekardah.com',
    name: 'Jekardah Chat',
    launcherName: 'Jekardah',
    startUrl: '/?source=android',
    iconUrl: 'https://chat.jekardah.com/icons/icon-512.png',
    maskableIconUrl: 'https://chat.jekardah.com/icons/icon-maskable-512.png',
    monochromeIconUrl: undefined,
    themeColor: '#2556BC',
    themeColorDark: '#12161C',
    navigationColor: '#E7F1F9',
    navigationColorDark: '#12161C',
    navigationDividerColor: '#E7F1F9',
    navigationDividerColorDark: '#12161C',
    backgroundColor: '#E7F1F9',
    appVersion: VERSION,
    appVersionCode: VERSION_CODE,
    enableNotifications: true, // notifikasi web tampil sebagai notifikasi aplikasi Jekardah
    enableSiteSettingsShortcut: false,
    fallbackType: 'customtabs',
    orientation: 'default',
    minSdkVersion: 24, // Android 7.0+ (syarat pustaka androidbrowserhelper)
    signingKey: { path: KEYSTORE, alias: 'jekardah' },
  });

  const errors = twa.validate();
  if (errors) throw new Error(`Konfigurasi tidak valid: ${errors}`);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  await twa.saveToFile(path.join(OUT, 'twa-manifest.json'));
  await new TwaGenerator().createTwaProject(OUT, twa, new ConsoleLog('init'));
  console.log(`Proyek Android siap di ${OUT} (versi ${VERSION}, versionCode ${VERSION_CODE})`);
})().catch((e) => { console.error(e); process.exit(1); });
