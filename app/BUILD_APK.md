# Building a standalone Android APK (offline / sideload)

This produces a signed release APK you can copy to your phone and run without
any network or Expo Go.

> Output: `app/android/app/build/outputs/apk/release/app-release.apk`

There are two paths. Pick whichever fits — both produce the same kind of
sideloadable APK and the app runs fully offline once installed.

---

## Option A — EAS Build (cloud, no SDK required) — recommended

If you don't want to install Android Studio / JDK locally, let Expo's build
servers do it. The project is already wired to EAS project
`03dbff27-1493-4159-9fab-ab9b79202c73` (see `app/app.json` →
`expo.extra.eas.projectId` and `app/eas.json`).

```bash
cd app
npm install -g eas-cli         # or: use `npx eas-cli@latest` everywhere below
eas login                      # one-time, free Expo account
eas build -p android --profile preview
```

When the build finishes (~10 min), the CLI prints a download URL — open it on
your phone and tap install (or `adb install` the file). The `preview` profile
in `eas.json` is configured to emit an APK with `distribution: internal`,
which is exactly what you want for sideloading.

First-ever build will ask whether to generate a new Android keystore on EAS —
say yes; Expo will manage and reuse it for every subsequent build under that
project ID, so updates install over the previous version cleanly.

---

## Option B — Local Gradle build (fully offline / no Expo account)

## 1. One-time toolchain setup

You need three things on your machine:

| Tool | Version | Notes |
|---|---|---|
| Node.js | >= 18 | RN 0.74 / Expo SDK 51 baseline |
| JDK | **17** | RN 0.74 does NOT support JDK 21 cleanly; install OpenJDK 17 |
| Android SDK | platform-34, build-tools 34.0.0 | Either install Android Studio, or use the standalone command-line tools |

### macOS (Homebrew)

```bash
brew install node openjdk@17
brew install --cask android-commandlinetools
export ANDROID_HOME="$(brew --prefix)/share/android-commandlinetools"
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Linux (Debian/Ubuntu)

```bash
sudo apt install -y openjdk-17-jdk unzip
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Android command-line tools
mkdir -p ~/Android/Sdk/cmdline-tools && cd ~/Android/Sdk/cmdline-tools
curl -L -o cmdtools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip cmdtools.zip && mv cmdline-tools latest && rm cmdtools.zip
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### Windows

Install Android Studio, then in `Tools > SDK Manager` install **Android 14
(API 34)** and **Android SDK Build-Tools 34.0.0**. Set `ANDROID_HOME` and
`JAVA_HOME` (point to a JDK 17 — Android Studio ships one under
`Contents/jbr` on macOS or the install directory on Windows).

---

## 2. Build the APK (one command)

```bash
cd app
./scripts/build-apk.sh
```

What the script does:

1. `npm install` if needed
2. `npx expo prebuild --platform android` to (re)generate `app/android/`
3. Generates `app/android/app/release.keystore` with a default password
   (`wordscapes-zh`) on first run, plus `app/android/keystore.properties`.
   **Both files are gitignored — they live only on your machine.**
4. Patches `android/app/build.gradle` to wire that keystore into the `release`
   build type.
5. Runs `./gradlew assembleRelease`.

First Gradle run downloads ~500 MB of dependencies and takes 5–15 minutes.
Subsequent runs are much faster.

### Override the keystore password

```bash
KEYSTORE_PASSWORD='your-strong-password' KEYSTORE_ALIAS='wordscapes' \
  ./scripts/build-apk.sh
```

If you want to bring your own keystore, drop it at
`app/android/app/release.keystore` and write
`app/android/keystore.properties` yourself (see the script for the format),
then run the script — it will skip generation and use yours.

---

## 3. Install on your phone

Pick whichever you have handy:

- **USB + adb** (developer options + USB debugging on the phone):
  ```bash
  adb install -r app/android/app/build/outputs/apk/release/app-release.apk
  ```
- **Sideload**: copy the APK to the phone (USB / cloud / email) and tap it.
  You will be prompted to allow installs from unknown sources for the file
  manager / browser you used.

The app is fully offline:

- Levels and dictionary are bundled (`src/data/levels.json`,
  `src/data/dictionary.json`).
- Remote config has only baked-in defaults (`src/data/remoteConfigDefaults.json`,
  ads/IAP/leaderboard all disabled).
- No network calls at runtime; AsyncStorage holds progress and coins locally.

---

## 4. Troubleshooting

- **`Unsupported class file major version 65`** — Gradle picked up JDK 21.
  Force JDK 17: `export JAVA_HOME=/path/to/jdk-17`.
- **`SDK location not found`** — `ANDROID_HOME` not set. Either export it or
  create `app/android/local.properties` with `sdk.dir=/path/to/Android/Sdk`.
- **`Failed to install the following Android SDK packages... licenses`** —
  Run `yes | sdkmanager --licenses` once.
- **`No matching variant of com.android.tools.build:gradle...`** — JDK
  version mismatch; use 17.
- **Phone refuses to install** — some OEMs block APKs not from Play Store;
  enable "Install unknown apps" for the file manager / browser doing the
  install, or use `adb install -r`.
- **Need to rebuild from a clean slate** — delete `app/android/` and run the
  script again. Keep `release.keystore` and `keystore.properties` if you want
  to keep signing the same identity (Android refuses to update an installed
  app whose APK is signed by a different key).
