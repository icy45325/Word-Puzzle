#!/usr/bin/env node
// Patches android/app/build.gradle so that the `release` build type is signed
// with a keystore declared in android/keystore.properties.
//
// Idempotent: safe to run on every build. If the file already contains the
// release signing block we wrote, this script is a no-op.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gradlePath = resolve(here, '..', 'android', 'app', 'build.gradle');

if (!existsSync(gradlePath)) {
  console.error(`[patch-signing] missing ${gradlePath}; run \`expo prebuild --platform android\` first.`);
  process.exit(1);
}

let src = readFileSync(gradlePath, 'utf8');
const MARKER = '// >>> release-signing-patch';

if (src.includes(MARKER)) {
  console.log('[patch-signing] already patched, skipping.');
  process.exit(0);
}

const releaseSigningBlock = `        ${MARKER}
        release {
            def ksPropsFile = rootProject.file("keystore.properties")
            if (ksPropsFile.exists()) {
                def ksProps = new Properties()
                ksProps.load(new FileInputStream(ksPropsFile))
                storeFile file(ksProps['storeFile'] ?: 'release.keystore')
                storePassword ksProps['storePassword']
                keyAlias ksProps['keyAlias']
                keyPassword ksProps['keyPassword']
            }
        }
        // <<< release-signing-patch
`;

src = src.replace(
  /signingConfigs\s*\{\s*\n(\s*)debug\s*\{/,
  (m, indent) => `signingConfigs {\n${releaseSigningBlock}${indent}debug {`,
);

src = src.replace(
  /release\s*\{\s*\n(\s*)\/\/ Caution! In production[\s\S]*?signingConfig\s+signingConfigs\.debug/,
  (m, indent) =>
    `release {\n${indent}// Use release keystore when keystore.properties is present, otherwise fall back to debug signing.\n${indent}signingConfig rootProject.file("keystore.properties").exists() ? signingConfigs.release : signingConfigs.debug`,
);

writeFileSync(gradlePath, src);
console.log('[patch-signing] android/app/build.gradle patched.');
