type QuizKvNamespace = {
  get: (key: string) => Promise<string | null>;
};

type Env = {
  QUIZ_KV?: QuizKvNamespace;
};

type PagesContext = {
  env: Env;
  params: {
    slug?: string | string[];
  };
};

const htmlResponse = (status: number, html: string): Response =>
  new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer-when-downgrade',
    },
  });

const getSlug = (value?: string | string[]): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw || '').trim();
};

export const onRequestGet = async ({ env, params }: PagesContext): Promise<Response> => {
  if (!env.QUIZ_KV) {
    return htmlResponse(500, '<!doctype html><title>KV missing</title><p>Cloudflare KV binding QUIZ_KV chua duoc cau hinh.</p>');
  }

  const slug = getSlug(params.slug);
  if (!/^[a-z0-9-]{1,100}$/i.test(slug)) {
    return htmlResponse(404, '<!doctype html><title>Not found</title><p>Quiz khong ton tai.</p>');
  }

  const html = await env.QUIZ_KV.get(`quiz:${slug}`);
  if (!html) {
    return htmlResponse(404, '<!doctype html><title>Not found</title><p>Quiz khong ton tai hoac da bi xoa.</p>');
  }

  return htmlResponse(200, html);
};
