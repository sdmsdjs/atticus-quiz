import { createHash } from 'node:crypto';

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';
const DEPLOY_POLL_INTERVAL_MS = 1500;
const DEPLOY_POLL_ATTEMPTS = 24;
const NETLIFY_SITE_NAME_MAX_LENGTH = 63;

type NetlifySiteResponse = {
  id?: string;
  site_id?: string;
  name?: string;
  url?: string;
  ssl_url?: string;
  admin_url?: string;
};

type NetlifyDeployResponse = {
  id?: string;
  deploy_id?: string;
  site_name?: string;
  name?: string;
  state?: string;
  url?: string;
  ssl_url?: string;
  deploy_url?: string;
  deploy_ssl_url?: string;
  admin_url?: string;
  error_message?: string;
  required?: string[];
};

type NetlifyFunctionEvent = {
  httpMethod?: string;
  body?: string | null;
};

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: responseHeaders,
  body: JSON.stringify(body),
});

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const getNetlifyToken = (): string => {
  const token = process.env.NETLIFY_ACCESS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';

  if (!token.trim()) {
    throw new Error('Server chua cau hinh NETLIFY_ACCESS_TOKEN.');
  }

  return token.trim();
};

const limitSiteName = (value: string): string => {
  const trimmed = value.slice(0, NETLIFY_SITE_NAME_MAX_LENGTH).replace(/^-+|-+$/g, '');
  return trimmed || 'atticus-quiz';
};

const toNetlifySiteName = (value: string): string => {
  const normalized = (value || 'quiz')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return limitSiteName(normalized || 'quiz');
};

const createSuggestedNetlifySiteName = (label: string): string => {
  const slug = toNetlifySiteName(label || 'quiz');
  const base = slug.startsWith('atticus-') ? slug : `atticus-${slug}`;
  const suffix = Date.now().toString(36);
  const maxBaseLength = NETLIFY_SITE_NAME_MAX_LENGTH - suffix.length - 1;
  const safeBase = limitSiteName(base.slice(0, Math.max(1, maxBaseLength)));
  return `${safeBase}-${suffix}`;
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const fallback = `Netlify API loi ${response.status}`;

  try {
    const text = await response.text();
    if (!text) return fallback;

    try {
      const data = JSON.parse(text);
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;
      if (typeof data.msg === 'string') return data.msg;
      if (Array.isArray(data.errors)) return data.errors.join(', ');
      if (data.errors && typeof data.errors === 'object') {
        return Object.entries(data.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
          .join('; ');
      }
      return text;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
};

const requestNetlify = async <T,>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${NETLIFY_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) return {} as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
};

const createSite = async (token: string, siteName: string): Promise<NetlifySiteResponse> =>
  requestNetlify<NetlifySiteResponse>('/sites', token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: toNetlifySiteName(siteName),
      processing_settings: {
        html: {
          pretty_urls: false,
        },
      },
    }),
  });

const createDeploy = async (
  token: string,
  siteId: string,
  fileHash: string
): Promise<NetlifyDeployResponse> =>
  requestNetlify<NetlifyDeployResponse>(`/sites/${encodeURIComponent(siteId)}/deploys`, token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        '/index.html': fileHash,
      },
    }),
  });

const uploadIndexHtml = async (
  token: string,
  deployId: string,
  htmlBytes: Uint8Array
): Promise<void> => {
  await requestNetlify<unknown>(`/deploys/${encodeURIComponent(deployId)}/files/index.html`, token, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: htmlBytes,
  });
};

const hasFailedDeployState = (state?: string): boolean =>
  Boolean(state && /^(error|failed|rejected)$/i.test(state));

const pollDeployReady = async (
  token: string,
  deployId: string,
  initialDeploy: NetlifyDeployResponse
): Promise<NetlifyDeployResponse> => {
  let latest = initialDeploy;

  for (let attempt = 0; attempt < DEPLOY_POLL_ATTEMPTS; attempt += 1) {
    if (latest.state === 'ready') return latest;

    if (hasFailedDeployState(latest.state)) {
      throw new Error(latest.error_message || `Netlify deploy dung o trang thai ${latest.state}.`);
    }

    await sleep(DEPLOY_POLL_INTERVAL_MS);
    latest = await requestNetlify<NetlifyDeployResponse>(
      `/deploys/${encodeURIComponent(deployId)}`,
      token
    );
  }

  return latest;
};

const pickPublicUrl = (site: NetlifySiteResponse, deploy: NetlifyDeployResponse): string => {
  const siteName = site.name || deploy.site_name || deploy.name || '';
  const url = site.ssl_url || site.url || deploy.ssl_url || deploy.deploy_ssl_url || deploy.url || deploy.deploy_url;

  if (url) return url.replace(/^http:\/\//i, 'https://');
  return siteName ? `https://${siteName}.netlify.app` : '';
};

const pickDeployUrl = (site: NetlifySiteResponse, deploy: NetlifyDeployResponse): string => {
  const url = deploy.deploy_ssl_url || deploy.deploy_url || deploy.ssl_url || deploy.url || site.ssl_url || site.url;
  return url ? url.replace(/^http:\/\//i, 'https://') : pickPublicUrl(site, deploy);
};

const pickAdminUrl = (site: NetlifySiteResponse, deploy: NetlifyDeployResponse): string => {
  const siteName = site.name || deploy.site_name || deploy.name || '';
  return siteName ? `https://app.netlify.com/sites/${siteName}/overview` : (site.admin_url || deploy.admin_url || '');
};

const deployQuiz = async (input: { html: string; title?: string; siteName?: string }) => {
  if (!input.html || typeof input.html !== 'string') {
    throw new Error('Noi dung HTML khong hop le.');
  }

  const token = getNetlifyToken();
  const title = input.title || 'quiz';
  const effectiveSiteName = input.siteName?.trim()
    ? toNetlifySiteName(input.siteName)
    : createSuggestedNetlifySiteName(title);

  const site = await createSite(token, effectiveSiteName);
  const siteId = site.id || site.site_id || site.name;

  if (!siteId) {
    throw new Error('Netlify khong tra ve site id.');
  }

  const htmlBytes = new TextEncoder().encode(input.html);
  const fileHash = createHash('sha1').update(htmlBytes).digest('hex');
  const deploy = await createDeploy(token, siteId, fileHash);
  const deployId = deploy.id || deploy.deploy_id;

  if (!deployId) {
    throw new Error('Netlify khong tra ve deploy id.');
  }

  if (!Array.isArray(deploy.required) || deploy.required.includes(fileHash)) {
    await uploadIndexHtml(token, deployId, htmlBytes);
  }

  const readyDeploy = await pollDeployReady(token, deployId, deploy);

  return {
    siteId,
    deployId,
    siteName: site.name || readyDeploy.site_name || readyDeploy.name || effectiveSiteName,
    state: readyDeploy.state || deploy.state || 'uploaded',
    url: pickPublicUrl(site, readyDeploy),
    deployUrl: pickDeployUrl(site, readyDeploy),
    adminUrl: pickAdminUrl(site, readyDeploy),
  };
};

export const handler = async (event: NetlifyFunctionEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const input = JSON.parse(event.body || '{}');
    const result = await deployQuiz(input);
    return jsonResponse(200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Khong the tao link Netlify.';
    return jsonResponse(500, { error: message });
  }
};
