#!/usr/bin/env bash
# One-shot Android release APK build for WordScapes ZH.
#
# Prerequisites (one-time setup on your machine):
#   1. Node.js >= 18 and npm
#   2. JDK 17 (RN 0.74 standard). Set JAVA_HOME if not auto-detected.
#   3. Android command-line tools with platform-34 and build-tools 34.0.0 installed.
#      Set ANDROID_HOME (or ANDROID_SDK_ROOT) to its root.
#
# Usage:
#   cd app && ./scripts/build-apk.sh
#
# First run will:
#   - install JS deps (npm ci)
#   - run `expo prebuild` to generate android/
#   - generate a release keystore (android/app/release.keystore) using a default
#     password unless one already exists. THE KEYSTORE IS LOCAL — DO NOT COMMIT.
#   - build a signed release APK with Gradle.
#
# Output:
#   android/app/build/outputs/apk/release/app-release.apk

set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "[build-apk] working directory: $ROOT"

# ---- 1. JS deps -------------------------------------------------------------
if [ ! -d node_modules ]; then
  echo "[build-apk] installing JS dependencies..."
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
fi

# ---- 2. Generate android/ if missing ---------------------------------------
if [ ! -d android ]; then
  echo "[build-apk] running expo prebuild (android only)..."
  npx --yes expo prebuild --platform android --no-install
fi

# ---- 3. Release keystore ----------------------------------------------------
KEYSTORE_PATH="android/app/release.keystore"
PROPS_PATH="android/keystore.properties"

if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "[build-apk] generating release keystore at $KEYSTORE_PATH"
  : "${KEYSTORE_PASSWORD:=wordscapes-zh}"
  : "${KEYSTORE_ALIAS:=wordscapes}"
  : "${KEYSTORE_DNAME:=CN=WordScapes ZH, OU=Local, O=Local, L=Local, S=Local, C=CN}"

  keytool -genkeypair -v \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEYSTORE_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEYSTORE_PASSWORD" \
    -dname "$KEYSTORE_DNAME" >/dev/null

  cat > "$PROPS_PATH" <<EOF
storeFile=app/release.keystore
storePassword=$KEYSTORE_PASSWORD
keyAlias=$KEYSTORE_ALIAS
keyPassword=$KEYSTORE_PASSWORD
EOF
  echo "[build-apk] wrote $PROPS_PATH"
  echo "[build-apk] !!! keep $KEYSTORE_PATH and $PROPS_PATH safe — they sign your app !!!"
fi

# ---- 4. Wire release signing into build.gradle -----------------------------
node scripts/patch-android-release-signing.mjs

# ---- 5. Gradle assemble release --------------------------------------------
echo "[build-apk] starting gradle assembleRelease (this can take a while on first run)..."
cd android
chmod +x ./gradlew
./gradlew --no-daemon assembleRelease

APK="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK" ]; then
  ABS="$(pwd)/$APK"
  echo
  echo "[build-apk] SUCCESS"
  echo "[build-apk] APK: $ABS"
  echo "[build-apk] install with: adb install -r \"$ABS\""
else
  echo "[build-apk] gradle finished but APK not found at $APK" >&2
  exit 1
fi
