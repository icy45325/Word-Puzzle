import type { RemoteConfig } from '../types';
import defaults from '../../data/remoteConfigDefaults.json';

type ConfigMap = Record<string, boolean | number | string>;

export class StaticRemoteConfig implements RemoteConfig {
  private values: ConfigMap = { ...(defaults as ConfigMap) };

  getBool(key: string, fallback: boolean): boolean {
    const v = this.values[key];
    return typeof v === 'boolean' ? v : fallback;
  }

  getNumber(key: string, fallback: number): number {
    const v = this.values[key];
    return typeof v === 'number' ? v : fallback;
  }

  getString(key: string, fallback: string): string {
    const v = this.values[key];
    return typeof v === 'string' ? v : fallback;
  }

  async refresh(): Promise<void> {
    // MVP serves the bundled JSON. A Firebase-RC / custom endpoint
    // implementation would fetch here and merge into this.values.
  }
}
