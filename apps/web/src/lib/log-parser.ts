import type { LogFormat, ParsedLogEntry } from '@linkrescue/types';

const NGINX_REGEX = /^\S+ \S+ \S+ \[.*?\] "(?:GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH) (\S+) HTTP\/\S+" (\d+) \d+ "([^"]*)" /;
const APACHE_REGEX = /^\S+ \S+ \S+ \[.*?\] "(?:GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH) (\S+) HTTP\/\S+" (\d+) \d+/;

function parseNginxLine(line: string): ParsedLogEntry | null {
  const m = line.match(NGINX_REGEX);
  if (!m) return null;
  const statusCode = parseInt(m[2]!, 10);
  if (statusCode < 400) return null;
  return { url: m[1]!, source_page: m[3] === '-' ? null : m[3]!, status_code: statusCode };
}

function parseApacheLine(line: string): ParsedLogEntry | null {
  const m = line.match(APACHE_REGEX);
  if (!m) return null;
  const statusCode = parseInt(m[2]!, 10);
  if (statusCode < 400) return null;
  return { url: m[1]!, source_page: null, status_code: statusCode };
}

function parseCloudflareJson(line: string): ParsedLogEntry | null {
  try {
    const obj = JSON.parse(line);
    const statusCode = obj.EdgeResponseStatus ?? obj.status ?? 0;
    if (statusCode < 400) return null;
    return {
      url: obj.ClientRequestURI ?? obj.url ?? '',
      source_page: obj.ClientRefererHeader ?? null,
      status_code: statusCode,
    };
  } catch {
    return null;
  }
}

function parseCustomJson(line: string): ParsedLogEntry | null {
  try {
    const obj = JSON.parse(line);
    const statusCode = obj.status_code ?? obj.status ?? 0;
    if (statusCode < 400) return null;
    return {
      url: obj.url ?? obj.path ?? '',
      source_page: obj.referer ?? obj.source_page ?? null,
      status_code: statusCode,
    };
  } catch {
    return null;
  }
}

export function parseLogBatch(text: string, format: LogFormat): ParsedLogEntry[] {
  const lines = text.split('\n').filter(Boolean);
  const parser =
    format === 'nginx' ? parseNginxLine
    : format === 'apache' ? parseApacheLine
    : format === 'cloudflare' ? parseCloudflareJson
    : parseCustomJson;

  return lines.map(parser).filter((e): e is ParsedLogEntry => e !== null);
}
