function getBaseUrl(): string {
  const host = window.location.hostname;
  const protocol = window.location.protocol;

  if (host.includes('.replit.dev') || host.includes('.repl.co')) {
    const parts = host.split('-');
    const restOfDomain = parts.slice(1).join('-');
    return `${protocol}//{port}-${restOfDomain}`;
  }

  return `${protocol}//${host.split(':')[0]}:{port}`;
}

export function getAppUrl(app: 'venue' | 'teacher' | 'parent' | 'school'): string {
  const portMap = {
    venue: 3001,
    teacher: 3002,
    parent: 3003,
    school: 4200,
  };

  const template = getBaseUrl();
  return template.replace('{port}', String(portMap[app]));
}
