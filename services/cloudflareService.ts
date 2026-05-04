export type CloudflarePublishResult = {
  slug: string;
  url: string;
  title: string;
  createdAt: string;
  size: number;
};

export type PublishQuizToCloudflareOptions = {
  publishToken: string;
  html: string;
  title: string;
  slug?: string;
};

const DEFAULT_CLOUDFLARE_API_BASE = 'https://atticus-quiz.pages.dev';

const getCloudflareApiBase = (): string => {
  const meta = import.meta as ImportMeta & {
    env?: {
      VITE_CLOUDFLARE_API_BASE?: string;
    };
  };
  const configuredBase = (meta.env?.VITE_CLOUDFLARE_API_BASE || DEFAULT_CLOUDFLARE_API_BASE)
    .trim()
    .replace(/\/+$/g, '');

  if (configuredBase) return configuredBase;
  return window.location.origin;
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const fallback = `Cloudflare API loi ${response.status}`;

  try {
    const text = await response.text();
    if (!text) return fallback;

    try {
      const data = JSON.parse(text);
      if (typeof data.error === 'string') return data.error;
      if (typeof data.message === 'string') return data.message;
      return text;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
};

export const publishQuizToCloudflare = async ({
  publishToken,
  html,
  title,
  slug,
}: PublishQuizToCloudflareOptions): Promise<CloudflarePublishResult> => {
  const token = publishToken.trim();

  if (!token) {
    throw new Error('Hay nhap Cloudflare publish token.');
  }

  const response = await fetch(`${getCloudflareApiBase()}/api/cloudflare-quizzes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ html, title, slug }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<CloudflarePublishResult>;
};
