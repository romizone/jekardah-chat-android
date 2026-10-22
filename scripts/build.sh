#!/bin/bash
# Compile & tanda tangani APK (untuk dipasang langsung) dan AAB (untuk Google Play) Jekardah Chat.
# Butuh JDK 17 & Android SDK di ~/.jekardah-android (lihat README) dan kunci di ~/.jekardah-android/keystore.
set -euo pipefail
cd "$(dirname "$0")/.."
T="$HOME/.jekardah-android"
export JAVA_HOME="${JAVA_HOME:-$T/jdk/Contents/Home}" ANDROID_HOME="${ANDROID_HOME:-$T/sdk}"
export PATH="$JAVA_HOME/bin:$PATH"
BT="$ANDROID_HOME/build-tools/35.0.0"
KS="$T/keystore/jekardah-release.jks"
PW=$(grep '^password=' "$T/keystore/keystore.properties" | cut -d= -f2)
VERSION=$(node -p "require('./package.json').version")
OUT="${OUT_DIR:-$PWD/dist}"
mkdir -p "$OUT"

echo "sdk.dir=$ANDROID_HOME" > twa/local.properties
(cd twa && ./gradlew --no-daemon -q assembleRelease bundleRelease)

APK_IN=twa/app/build/outputs/apk/release/app-release-unsigned.apk
APK="$OUT/Jekardah-Chat-$VERSION.apk"
"$BT/zipalign" -f -p 4 "$APK_IN" "$OUT/aligned.apk"
"$BT/apksigner" sign --ks "$KS" --ks-key-alias jekardah --ks-pass "pass:$PW" --key-pass "pass:$PW" --out "$APK" "$OUT/aligned.apk"
rm -f "$OUT/aligned.apk" "$APK.idsig"
"$BT/apksigner" verify --print-certs "$APK" | grep -E "SHA-256|DN" | head -2

AAB="$OUT/Jekardah-Chat-$VERSION.aab"
cp twa/app/build/outputs/bundle/release/app-release.aab "$AAB"
jarsigner -keystore "$KS" -storepass "$PW" -keypass "$PW" -sigalg SHA256withRSA -digestalg SHA-256 "$AAB" jekardah >/dev/null
(cd "$OUT" && shasum -a 256 "Jekardah-Chat-$VERSION.apk" "Jekardah-Chat-$VERSION.aab" > SHA256SUMS.txt && cat SHA256SUMS.txt)
echo "Selesai: $OUT"
