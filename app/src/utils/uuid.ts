// Small RFC4122 v4 generator without pulling a dependency. Good enough for
// client IDs; swap with react-native-get-random-values + uuid if needed.
export function uuidv4(): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else if (i === 14) {
      out += '4';
    } else if (i === 19) {
      out += hex[(Math.random() * 4) | (8 & 0x3)];
    } else {
      out += hex[(Math.random() * 16) | 0];
    }
  }
  return out;
}
