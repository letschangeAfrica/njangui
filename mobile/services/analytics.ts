/**
 * Analytics — funnel/event tracking stub.
 *
 * No analytics SDK is wired up yet, so `track()` just logs in dev. Screens
 * should call it at decision points (CTA taps, screen views) now, so that
 * wiring in a real provider (Segment, Amplitude, PostHog…) later is a
 * one-file change instead of hunting down every call site.
 */

type EventProps = Record<string, string | number | boolean | undefined>;

export function track(event: string, props?: EventProps): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props ?? {});
  }
  // TODO: forward to a real analytics provider once one is chosen.
}
