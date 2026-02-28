const toSupabaseHostname = (hostname: string) => {
  if (hostname.endsWith('.mysql.co')) {
    return hostname.replace(/\.mysql\.co$/, '.supabase.co');
  }

  return hostname;
};

export const normalizeMysqlUrl = (rawUrl?: string) => {
  if (!rawUrl) {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);
    parsed.hostname = toSupabaseHostname(parsed.hostname);
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return rawUrl;
  }
};

export const getFunctionsBaseUrl = (rawUrl?: string) => {
  const normalizedUrl = normalizeMysqlUrl(rawUrl);
  return normalizedUrl ? `${normalizedUrl}/functions/v1` : '';
};
