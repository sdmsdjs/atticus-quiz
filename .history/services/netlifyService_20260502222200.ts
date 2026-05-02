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
  site_id?: string;
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

export type NetlifyDeployResult = {
  siteId: string;
  deployId: string;
  siteName: string;
  state: string;
  url: string;
  deployUrl: string;
  adminUrl: string;
};

export type DeployQuizToNetlifyOptions = {
  accessToken: string;
  html: string;
  title: string;
  siteName?: string;
};

export type DeployQuizWithDefaultTokenOptions = Omit<DeployQuizToNetlifyOptions, 'accessToken'>;

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => window.setTimeout(resolve, ms));

const limitSiteName = (value: string): string => {
  const trimmed = value.slice(0, NETLIFY_SITE_NAME_MAX_LENGTH).replace(/^-+|-+$/g, '');
  return trimmed || 'atticus-quiz';
};

export const toNetlifySiteName = (value: string): string => {
  const normalized = (value || 'quiz')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return limitSiteName(normalized || 'quiz');
};

export const createSuggestedNetlifySiteName = (label: string): string => {
  const slug = toNetlifySiteName(label || 'quiz');
  const base = slug.startsWith('atticus-') ? slug : `atticus-${slug}`;
  const suffix = Date.now().toString(36);
  const maxBaseLength = NETLIFY_SITE_NAME_MAX_LENGTH - suffix.length - 1;
  const safeBase = limitSiteName(base.slice(0, Math.max(1, maxBaseLength)));
  return `${safeBase}-${suffix}`;
};

const mergeHeaders = (headers?: HeadersInit): Record<string, string> => {
  const result: Record<string, string> = {};

  if (!headers) return result;

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      result[key] = value;
    });
    return result;
  }

  return { ...headers };
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
  accessToken: string,
  init: RequestInit = {}
): Promise<T> => {
  const token = accessToken.trim();

  if (!token) {
    throw new Error('Hay nhap Netlify personal access token.');
  }

  const response = await fetch(`${NETLIFY_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...mergeHeaders(init.headers),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) return {} as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
};

const createSite = async (
  accessToken: string,
  siteName: string
): Promise<NetlifySiteResponse> =>
  requestNetlify<NetlifySiteResponse>('/sites', accessToken, {
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

const sha1Hex = async (bytes: Uint8Array): Promise<string> => {
  if (!window.crypto?.subtle) {
    throw new Error('Trinh duyet nay khong ho tro crypto.subtle de tao SHA-1.');
  }

  const digest = await window.crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

const createDeploy = async (
  accessToken: string,
  siteId: string,
  fileHash: string
): Promise<NetlifyDeployResponse> =>
  requestNetlify<NetlifyDeployResponse>(`/sites/${encodeURIComponent(siteId)}/deploys`, accessToken, {
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
  accessToken: string,
  deployId: string,
  htmlBytes: Uint8Array
): Promise<void> => {
  await requestNetlify<unknown>(`/deploys/${encodeURIComponent(deployId)}/files/index.html`, accessToken, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: new Blob([htmlBytes], { type: 'text/html;charset=utf-8' }),
  });
};

const hasFailedDeployState = (state?: string): boolean =>
  Boolean(state && /^(error|failed|rejected)$/i.test(state));

const pollDeployReady = async (
  accessToken: string,
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
      accessToken
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

export const deployQuizWithDefaultNetlifyToken = async ({
  html,
  title,
  siteName,
}: DeployQuizWithDefaultTokenOptions): Promise<NetlifyDeployResult> => {
  const response = await fetch('https://atticus-quiz.netlify.app/api/deploy-quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html, title, siteName }),
  });

  const text = await response.text();
  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      'Netlify token mac dinh chua duoc cau hinh tren server. Hay deploy app len Netlify va dat bien NETLIFY_ACCESS_TOKEN.'
    );
  }

  return data as NetlifyDeployResult;
};

export const deployQuizToNetlify = async ({
  accessToken,
  html,
  title,
  siteName,
}: DeployQuizToNetlifyOptions): Promise<NetlifyDeployResult> => {
  const effectiveSiteName = siteName?.trim()
    ? toNetlifySiteName(siteName)
    : createSuggestedNetlifySiteName(title);

  const site = await createSite(accessToken, effectiveSiteName);
  const siteId = site.id || site.site_id || site.name;

  if (!siteId) {
    throw new Error('Netlify khong tra ve site id.');
  }

  const htmlBytes = new TextEncoder().encode(html);
  const fileHash = await sha1Hex(htmlBytes);
  const deploy = await createDeploy(accessToken, siteId, fileHash);
  const deployId = deploy.id || deploy.deploy_id;

  if (!deployId) {
    throw new Error('Netlify khong tra ve deploy id.');
  }

  if (!Array.isArray(deploy.required) || deploy.required.includes(fileHash)) {
    await uploadIndexHtml(accessToken, deployId, htmlBytes);
  }

  const readyDeploy = await pollDeployReady(accessToken, deployId, deploy);

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
