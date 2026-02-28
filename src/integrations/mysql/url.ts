export const normalizeMysqlUrl = (rawUrl?: string) => {
  if (!rawUrl) {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return rawUrl;
  }
};

export const getFunctionsBaseUrl = (rawUrl?: string) => {
  const normalizedUrl = normalizeMysqlUrl(rawUrl);
  return normalizedUrl ? `${normalizedUrl}/functions/v1` : '';
};
