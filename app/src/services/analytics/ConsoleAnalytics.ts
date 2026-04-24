import type { AnalyticsEvent, AnalyticsService, Uuid } from '../types';

export class ConsoleAnalytics implements AnalyticsService {
  private traits: Record<string, unknown> = {};

  identify(userId: Uuid, traits?: Record<string, unknown>): void {
    this.traits = { userId, ...traits };
    // eslint-disable-next-line no-console
    console.log('[analytics] identify', this.traits);
  }

  track(event: AnalyticsEvent): void {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event.name, {
      ...this.traits,
      ...('props' in event ? event.props : {}),
      ts: Date.now(),
    });
  }
}
