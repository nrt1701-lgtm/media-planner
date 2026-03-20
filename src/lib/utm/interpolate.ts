export function interpolateUtm(pattern: string, variables: Record<string, string>): string {
  return pattern.replace(/\{([^}]+)\}/g, (_, key) => variables[key] ?? '')
}
