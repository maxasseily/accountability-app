// Verifies that Supabase env vars point to a reachable production project.
// Fails fast during EAS builds if the anon key or URL are misconfigured.

import { createHash } from 'crypto';

const appEnv = process.env.APP_ENV ?? 'development';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const rawAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// Trim whitespace and strip surrounding quotes if present
let anonKey = rawAnonKey ? String(rawAnonKey).trim() : rawAnonKey;
// Resolve EAS-style placeholder like ${SUPABASE_ANON_KEY}
const placeholderMatch = anonKey && /^\$\{([A-Z0-9_]+)\}$/.exec(anonKey);
if (placeholderMatch) {
  const ref = placeholderMatch[1];
  const resolved = process.env[ref];
  if (resolved) {
    anonKey = String(resolved).trim();
    if (
      (anonKey.startsWith('"') && anonKey.endsWith('"')) ||
      (anonKey.startsWith("'") && anonKey.endsWith("'"))
    ) {
      anonKey = anonKey.slice(1, -1);
    }
    console.log(`[verify-supabase-env] Resolved placeholder \${${ref}} from environment`);
  }
}
if (anonKey && ((anonKey.startsWith('"') && anonKey.endsWith('"')) || (anonKey.startsWith("'") && anonKey.endsWith("'")))) {
  anonKey = anonKey.slice(1, -1);
}
const verbose = process.env.VERIFY_SUPABASE_VERBOSE === '1';
const skip = process.env.VERIFY_SUPABASE_SKIP === '1';

const isProdLike = appEnv === 'preview' || appEnv === 'production' || appEnv === 'testing';

const fatal = (message) => {
  console.error(`[verify-supabase-env] ${message}`);
  process.exit(1);
};

if (skip) {
  console.log('[verify-supabase-env] Skipping check due to VERIFY_SUPABASE_SKIP=1');
  process.exit(0);
}

if (!isProdLike) {
  console.log(`[verify-supabase-env] Skipping check for APP_ENV=${appEnv}`);
  process.exit(0);
}

if (!url) {
  fatal(
    `Missing EXPO_PUBLIC_SUPABASE_URL for APP_ENV=${appEnv}. Set it in eas.json or the build environment.`
  );
}

if (!anonKey) {
  fatal(
    `Missing EXPO_PUBLIC_SUPABASE_ANON_KEY for APP_ENV=${appEnv}. Ensure the SUPABASE_ANON_KEY secret is configured.`
  );
}

if (rawAnonKey && rawAnonKey !== anonKey && verbose) {
  console.log('[verify-supabase-env] Trimmed whitespace from anon key value');
}

const looksLocal = /(127\.0\.0\.1|localhost|^http:\/\/192\.|^http:\/\/10\.|^http:\/\/172\.)/.test(url);
if (looksLocal || !/^https:\/\/.+\.supabase\.co/.test(url)) {
  fatal(
    `EXPO_PUBLIC_SUPABASE_URL must point to production. Received: ${url}. Expected https://<project>.supabase.co`
  );
}

const restUrl = `${url.replace(/\/$/, '')}/rest/v1/`;
const sample = (s) => (s ? `${s.slice(0, 4)}…${s.slice(-4)}` : '<none>');
const hash = anonKey ? createHash('sha256').update(anonKey).digest('hex').slice(0, 12) : '<nohash>';
console.log(
  `[verify-supabase-env] Env url=${url} env=${appEnv} keyLen=${anonKey.length} keySample=${sample(
    anonKey
  )} keyHash=${hash}`
);

const ensureFetch = async () => {
  if (typeof fetch === 'function') {
    return fetch;
  }

  try {
    const { default: nodeFetch } = await import('node-fetch');
    return nodeFetch;
  } catch (error) {
    fatal(`Global fetch unavailable and failed to load node-fetch: ${error.message}`);
  }
};

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10_000);

(async () => {
  const fetchFn = await ensureFetch();
  try {
    const response = await fetchFn(restUrl, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: controller.signal,
    });

    // Optionally read a small response body for diagnostics
    const bodyPreview = async () => {
      try {
        const text = await response.text();
        return text.length > 200 ? text.slice(0, 200) + '…' : text;
      } catch {
        return '<no-body>';
      }
    };

    if (response.status === 401) {
      const preview = verbose ? await bodyPreview() : undefined;
      fatal(
        `Supabase rejected the anon key (HTTP 401). Verify SUPABASE_ANON_KEY belongs to project ${url}.` +
          (verbose ? ` Body: ${preview}` : '')
      );
    }

    if (response.status >= 500) {
      const preview = verbose ? await bodyPreview() : undefined;
      fatal(
        `Supabase returned ${response.status}. Check project availability.` +
          (verbose ? ` Body: ${preview}` : '')
      );
    }

    // Treat other statuses (200/204/404/403, etc.) as OK for key+URL validation
    const preview = verbose ? await bodyPreview() : undefined;
    console.log(
      `[verify-supabase-env] Supabase connectivity OK for ${url} (status ${response.status}).` +
        (verbose ? ` Body: ${preview}` : '')
    );
    process.exit(0);
  } catch (error) {
    if (error.name === 'AbortError') {
      fatal(`Timed out reaching Supabase at ${restUrl}.`);
    }
    fatal(`Error verifying Supabase env: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
})();
