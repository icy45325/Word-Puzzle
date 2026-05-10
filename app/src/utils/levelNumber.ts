// Convert a level id like "L01" / "L42" into its 1-based level number.
// All ids in levels.json are zero-padded "L<NN>" strings; we just parse the
// digits. Falls back to 0 when an unknown id is passed in.
export function levelNumberOf(id: string): number {
  const m = id.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}
