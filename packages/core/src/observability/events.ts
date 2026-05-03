// Telemetry event taxonomy. Architecture §4.9.
// Keep this file the single source of truth — every emitter imports from here.

export const EVENTS = {
  searchPerformed: 'search_performed',
  listingViewed: 'listing_viewed',
  installAttempted: 'install_attempted',
  installSucceeded: 'install_succeeded',
  installFailed: 'install_failed',
  agentPublished: 'agent_published',
  listingClaimed: 'listing_claimed',
  reportSubmitted: 'report_submitted',
  installCommandCopied: 'install_command_copied',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export interface EventProperties {
  readonly [key: string]: string | number | boolean | null | undefined;
}
