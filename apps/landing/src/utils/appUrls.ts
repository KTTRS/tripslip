export function getAppUrl(app: 'venue' | 'teacher' | 'parent' | 'school'): string {
  return `/${app}/`;
}
