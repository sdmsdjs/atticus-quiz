type QuizKvNamespace = {
  put: (
    key: string,
    value: string,
    options?: {
      metadata?: Record<string, unknown>;
    }
  ) => Promise<void>;
};

type Env = {
  QUIZ_KV?: QuizKvNamespace;
  CLOUDFLARE_PUBLISH_TOKEN?: string;
  PUBLIC_BASE_URL?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

const MAX_HTML_BYTES = 20 * 1024 * 1024;

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Quiz-Publish-Token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });

const getBearerToken = (request: Request): string => {
  const auth = request.headers.get('Authorization') || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return (match?.[1] || request.headers.get('X-Quiz-Publish-Token') || '').trim();
};

const safeEqual = (left: string, right: string): boolean => {
  if (!left || !right || left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
};

const toSlug = (value: string): string => {
  const normalized = (value || 'quiz')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/^-+|-+$/g, '');

  return normalized || 'quiz';
};

const getPublicBaseUrl = (request: Request, env: Env): string => {
  const configured = env.PUBLIC_BASE_URL?.trim().replace(/\/+$/g, '');
  if (configured) return configured;
  return new URL(request.url).origin;
};

export const onRequestOptions = async (): Promise<Response> => jsonResponse(204, {});

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    if (!env.QUIZ_KV) {
      return jsonResponse(500, { error: 'Cloudflare KV binding QUIZ_KV chua duoc cau hinh.' });
    }

    const expectedToken = env.CLOUDFLARE_PUBLISH_TOKEN?.trim() || '';
    if (!expectedToken) {
      return jsonResponse(500, { error: 'Chua cau hinh CLOUDFLARE_PUBLISH_TOKEN tren Cloudflare Pages.' });
    }

    if (!safeEqual(getBearerToken(request), expectedToken)) {
      return jsonResponse(401, { error: 'Cloudflare publish token khong dung.' });
    }

    let input: { html?: unknown; title?: unknown; slug?: unknown };
    try {
      input = await request.json();
    } catch {
      return jsonResponse(400, { error: 'Body JSON khong hop le.' });
    }

    if (typeof input.html !== 'string' || !input.html.trim()) {
      return jsonResponse(400, { error: 'Noi dung HTML khong hop le.' });
    }

    const size = new TextEncoder().encode(input.html).byteLength;
    if (size > MAX_HTML_BYTES) {
      return jsonResponse(413, { error: 'HTML qua lon de luu vao KV.' });
    }

    const title = typeof input.title === 'string' && input.title.trim()
      ? input.title.trim()
      : 'quiz';
    const hasCustomSlug = typeof input.slug === 'string' && input.slug.trim().length > 0;
    const baseSlug = toSlug(hasCustomSlug ? String(input.slug) : title);
    const slug = hasCustomSlug ? baseSlug : `${baseSlug}-${Date.now().toString(36)}`;
    const createdAt = new Date().toISOString();

    await env.QUIZ_KV.put(`quiz:${slug}`, input.html, {
      metadata: {
        title,
        createdAt,
        size,
      },
    });

    return jsonResponse(200, {
      slug,
      url: `${getPublicBaseUrl(request, env)}/q/${slug}`,
      title,
      createdAt,
      size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Khong the luu quiz vao Cloudflare KV.';
    return jsonResponse(500, { error: message });
  }
};
