export const DASHBOARD_TABS = [
  'Overview',
  'Profile & Goals',
  'Health Preferences',
  'Scan Menu',
  'Recommendations',
  'History',
  'Saved Meals',
  'Account & Security',
] as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[number];
