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

---

## 5. (Optional) Provisioning Google sign-in

The Profile screen offers a "Continue with Google" button. It only works once
you've created an OAuth client in Google Cloud Console and pasted the IDs into
`app/app.json` → `extra.googleClientIds`. Until then the button shows a
localized hint and does nothing destructive.

### 5a. Find your Android signing fingerprint

Google needs the SHA-1 of the keystore that signed the APK.

- **EAS-managed keystore (Option A above):**
  ```bash
  eas credentials
  # → Android → production → Show keystore information
  ```
  Copy the line beginning with `SHA1 Fingerprint:`.

- **Local keystore (Option B):**
  ```bash
  keytool -list -v \
    -keystore app/android/app/release.keystore \
    -alias "${KEYSTORE_ALIAS:-wordscapes}" \
    -storepass "${KEYSTORE_PASSWORD:-wordscapes-zh}"
  ```
  Copy the `SHA1` line.

### 5b. Create OAuth clients in GCP

1. Open https://console.cloud.google.com/apis/credentials and pick (or create)
   a project.
2. Click **+ Create credentials → OAuth client ID** and create three clients:
   - **Android**
     - Package name: `com.icy45325.wordscapeszh`
     - SHA-1: the value from 5a
   - **iOS** (only if you'll ship to iOS)
     - Bundle ID: `com.icy45325.wordscapeszh`
   - **Web application** — required by `expo-auth-session/providers/google`
     even on native; just save it without redirect URIs for now.
3. Copy each client's `…apps.googleusercontent.com` ID.

### 5c. Paste IDs into `app.json`

```jsonc
"extra": {
  "googleClientIds": {
    "android": "PASTE_HERE.apps.googleusercontent.com",
    "ios": "PASTE_HERE.apps.googleusercontent.com",
    "web": "PASTE_HERE.apps.googleusercontent.com"
  }
}
```

Rebuild the APK after the change (the IDs are baked into the binary at build
time). Then on first sign-in, the in-app browser hands the user to Google,
returns an access token, and `AnonymousAuth.linkWithIdentity` migrates local
progress / economy / scores / friends / learnedWords into the new
`google:<sub>` userId namespace.

If you change the keystore SHA-1 (e.g. switching from EAS-managed to local
keystore), re-add the new SHA-1 to the Android OAuth client in GCP — the old
one stops working immediately.

---

## 6. (Optional) Provisioning AdMob (rewarded video / interstitial)

> ⚠️ **Current state (May 2026):** the `react-native-google-mobile-ads`
> package is **not installed** in `package.json` and not declared as an
> Expo plugin in `app.json`. The `MobileAdsService` source still ships,
> but `isAdMobLoaded()` returns false at runtime, so `ServicesProvider`
> picks `NoopAds` and the app just no-ops the ad calls. This keeps EAS
> builds clean on Expo SDK 51 (where `react-native-google-mobile-ads@14+`
> needs RN 0.75 / Kotlin 2.x that the SDK doesn't ship, and the older
> v13 line dropped the Expo config plugin). Re-install when you're ready
> to actually monetize — steps below.

### Re-enabling AdMob

1. **Bump Expo SDK first.** AdMob v14+ requires Expo SDK 52 (RN 0.76). On
   SDK 51 you'd have to pin v13.x and write a manual native config — not
   worth it. Run `npx expo upgrade` and resolve any peer warnings.
2. Install the package: `npm i react-native-google-mobile-ads expo-build-properties`.
3. Add the plugin back to `app.json`:

```jsonc
"plugins": [
  ["expo-build-properties", {
    "android": { "kotlinVersion": "2.0.21" },
    "ios": { "useFrameworks": "static" }
  }],
  ["react-native-google-mobile-ads", {
    "androidAppId": "ca-app-pub-XXXX~YYYY",
    "iosAppId":     "ca-app-pub-XXXX~YYYY"
  }]
]
```

Once that's in, the service layer requires no changes — `isAdMobLoaded()`
will start returning true on the next build and the existing
HintInsufficientSheet "看广告 +1 提示" path lights up automatically.

The `MobileAdsService` is wired into `ServicesProvider` and is preferred over
`NoopAds` whenever the native module is linked (i.e. in any EAS build, dev
build, or production APK — **not** in Expo Go). Out of the box it ships with
`ads.enabled: false` and uses Google's **test** ad unit IDs, so installing /
running the app costs nothing and never serves a real ad until you flip the
switch.

### 6a. Make a test build

The native module ships with `react-native-google-mobile-ads` and is bundled
during the prebuild step of `eas build` / `gradlew assembleRelease`. You don't
need to do anything beyond `npm install` and a fresh build — Expo's config
plugin reads `app.json → plugins → react-native-google-mobile-ads` and writes
the AdMob app IDs into `AndroidManifest.xml` / `Info.plist`.

The default `androidAppId` / `iosAppId` in `app.json` are Google's
**sample/test** app IDs. Real ads will not show until you:

1. Replace those two values with your own AdMob app IDs (created in step 6b).
2. Set `ads.enabled = true` in
   `src/data/remoteConfigDefaults.json` (or via the future remote config
   service).

### 6b. Get your AdMob app IDs and ad unit IDs

1. Sign in at https://apps.admob.com.
2. **Apps → Add app** twice (Android + iOS) — pick "No, the app is not yet
   listed on a supported store" if you haven't published yet. AdMob prints
   each app's ID in the format `ca-app-pub-XXXX~YYYY`.
3. Inside each app, **Ad units → Add ad unit**. Create at minimum:
   - One **Rewarded** unit (for `rewarded_extra_coins`,
     `rewarded_free_hint`, `rewarded_reveal_letter`).
   - One **Interstitial** unit (for `level_complete_interstitial`).
4. Each unit produces an ID in the form `ca-app-pub-XXXX/ZZZZ`.

### 6c. Wire the IDs into the app

```jsonc
// app/app.json
"plugins": [
  ["react-native-google-mobile-ads", {
    "androidAppId": "ca-app-pub-XXXX~YYYY",   // from 6b
    "iosAppId":     "ca-app-pub-XXXX~YYYY"
  }]
]
```

```jsonc
// app/src/data/remoteConfigDefaults.json
{
  "ads.enabled": true,
  "ads.useTestIds": false,
  "ads.unitId.android.rewarded":     "ca-app-pub-XXXX/ZZZZ",
  "ads.unitId.android.interstitial": "ca-app-pub-XXXX/ZZZZ",
  "ads.unitId.ios.rewarded":         "ca-app-pub-XXXX/ZZZZ",
  "ads.unitId.ios.interstitial":     "ca-app-pub-XXXX/ZZZZ"
}
```

Leave `ads.useTestIds: true` and the unit ID fields empty during development;
the service falls back to Google's official test unit IDs which always serve
fake "Test Ad" creatives. Set both `ads.enabled = true` and
`ads.useTestIds = false` (and provide real unit IDs) to serve real
revenue-eligible ads.

### 6d. Verify

1. Build once: `eas build -p android --profile preview` (or local Gradle).
2. Install the APK. In-game, force a rewarded path (e.g. burn all hints,
   tap 💡 → "看广告 +1 提示" in the insufficient-hint sheet).
3. With test IDs you should see Google's "Test Ad" overlay; the
   `EARNED_REWARD` callback fires automatically when the test video
   completes, and `economy.grant({ type: 'ad_rewarded' })` adds a hint.
4. With real IDs and `ads.enabled = true`, AdMob's matching engine takes a
   few hours after the first request to start serving — newly-created units
   often show "no fill" for a short period, that's normal.

### 6e. App-ads.txt (publisher integrity, recommended)

Once your app is live in stores, add an `app-ads.txt` to your developer
website (URL listed in your AdMob → Settings → App-ads.txt) — it pairs your
domain with your AdMob publisher ID and prevents inventory spoofing. AdMob's
console gives you the exact line to paste.

---

## 7. (Optional) Provisioning In-App Purchases

> ⚠️ **Current state:** the `react-native-iap` package is **not installed**.
> `LocalIap` (persistent, mock-fulfillment) is the active implementation, so
> the Store screen + Profile entry are visible and clickable, but tapping
> "buy" runs a mock flow that just grants coins / sets entitlements
> locally — no real billing happens. The `RealIap` source ships and
> auto-activates the moment the native module is linked.

### 7a. Install react-native-iap

Use the v12.x line — it matches Expo SDK 51 / RN 0.74. v13+ requires RN 0.75
(SDK 52+), which we're not on yet.

```bash
cd app
npm i react-native-iap@^12
```

react-native-iap autolinks; no config plugin needed. Rebuild your APK:

```bash
npx eas build -p android --profile preview
```

`ServicesProvider`'s `isIapLoaded()` check will now return true and pick
`RealIap` automatically.

### 7b. Create products in the stores

The SKU strings in `app/src/services/iap/skus.ts` are what we send to the
store APIs. Register matching managed products in each store you ship to:

**Google Play Console**
1. Play Console → your app → **Monetize → Products → In-app products**
2. Create one product per SKU with the exact same ID string
   (`coin_pack_small`, `coin_pack_medium`, `coin_pack_large`, `remove_ads`,
   `pro_dictionary`). Subscriptions go under **Subscriptions** with id
   `subscription_monthly`.
3. Set price, default language, description. Activate each.
4. Upload at least one closed/internal-test build before Google will let
   you fetch products at runtime — that's their gate, not ours.

**App Store Connect** (when shipping iOS)
1. App Store Connect → your app → **Features → In-App Purchases**
2. Create the same SKU IDs with the same types (Consumable for coin packs,
   Non-Consumable for remove_ads / pro_dictionary, Auto-Renewable Subscription
   for subscription_monthly).
3. Submit them with the app build for review.

### 7c. Flip `iap.enabled` on

Already true in `remoteConfigDefaults.json` so the catalog renders
immediately. With `react-native-iap` installed:

- `RealIap.listProducts()` will query the store for live prices + display
  them in `priceDisplay` (overriding our placeholder strings).
- `RealIap.purchase(sku)` triggers the system purchase sheet.
- On success, fulfillment delegates through `LocalIap`, which writes
  entitlements to `ws:{userId}:entitlements` and grants coin packs via
  `economy.grant({type:'iap_grant', sku, coins})`.

### 7d. Server-side receipt verification (production)

The current `RealIap.purchase` resolves on the client-side `requestPurchase`
promise; production should send the purchase receipt to a backend that
verifies with Google Play / App Store, then grants entitlement. Until then,
treat the IAP layer as launch-ready for managed sandbox testing only.

### 7e. Sandbox testing

- **Google Play**: add testers in Play Console → **License testing**, install
  your app via the closed-test track, and purchases will use the sandbox
  account without charging real money.
- **App Store**: configure a Sandbox Apple ID in App Store Connect →
  **Users and Access → Sandbox**, then sign in on the device under
  Settings → App Store → Sandbox Account.
