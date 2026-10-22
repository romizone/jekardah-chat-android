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
    // Wajib true: pustaka TWA selalu memakai ManageDataLauncherActivity saat aplikasi dibuka; bila false,
    // aktivitas itu tidak terdaftar dan aplikasi langsung crash ("Component class ... does not exist").
    enableSiteSettingsShortcut: true,
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
  preferChrome();
  console.log(`Proyek Android siap di ${OUT} (versi ${VERSION}, versionCode ${VERSION_CODE})`);
})().catch((e) => { console.error(e); process.exit(1); });

/**
 * Selalu buka aplikasi di Google Chrome bila terpasang, walaupun browser default HP adalah browser lain
 * (mis. Samsung Internet di Galaxy S24). Bawaan Bubblewrap memakai browser default, dan di Samsung Internet
 * aplikasi bisa gagal terbuka; notifikasi aplikasi (delegasi notifikasi TWA) juga hanya didukung Chrome.
 * Tanpa Chrome, aplikasi tetap memakai browser default seperti biasa.
 */
function preferChrome() {
  const java = path.join(OUT, 'app/src/main/java/com/jekardah/chat/LauncherActivity.java');
  let src = fs.readFileSync(java, 'utf8');
  src = src.replace('public class LauncherActivity', `import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import com.google.androidbrowserhelper.trusted.TwaLauncher;

public class LauncherActivity`);
  const hook = `
    private static final String[] CHROME_PACKAGES = {
        "com.android.chrome", "com.chrome.beta", "com.chrome.dev", "com.chrome.canary"
    };

    /** Chrome (atau versi beta/dev) yang terpasang & aktif, atau null. */
    private String installedChrome() {
        PackageManager pm = getPackageManager();
        for (String pkg : CHROME_PACKAGES) {
            try {
                ApplicationInfo info = pm.getApplicationInfo(pkg, 0);
                if (info.enabled) return pkg;
            } catch (PackageManager.NameNotFoundException ignored) {
                // tidak terpasang
            }
        }
        return null;
    }

    @Override
    protected TwaLauncher createTwaLauncher() {
        String chrome = installedChrome();
        return chrome != null ? new TwaLauncher(this, chrome) : super.createTwaLauncher();
    }
`;
  src = src.replace(/(extends com\.google\.androidbrowserhelper\.trusted\.LauncherActivity \{)/, `$1\n${hook}`);
  if (!src.includes('createTwaLauncher')) throw new Error('Gagal menambahkan preferensi Chrome ke LauncherActivity');
  fs.writeFileSync(java, src);

  // Android 11+: aplikasi hanya boleh "melihat" paket lain yang dideklarasikan di <queries>
  const manifest = path.join(OUT, 'app/src/main/AndroidManifest.xml');
  let xml = fs.readFileSync(manifest, 'utf8');
  const queries = `    <queries>\n${CHROME_LIST.map((p) => `        <package android:name="${p}" />`).join('\n')}\n    </queries>\n`;
  xml = xml.replace(/(\s*)<application/, `\n${queries}$1<application`);
  fs.writeFileSync(manifest, xml);
}
const CHROME_LIST = ['com.android.chrome', 'com.chrome.beta', 'com.chrome.dev', 'com.chrome.canary'];
