import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Question, QuestionType, ParsedQuestion } from './types';
import type { NetlifyDeployResult } from './services/netlifyService';
import { DEFAULT_GEMINI_MODEL } from './services/geminiConstants';
import { makeExportBaseName, sanitizeFileName } from './utils/fileName';
import FileUpload from './components/FileUpload';
import QuestionTable from './components/QuestionTable';
import { MagicWandIcon, DownloadIcon, UploadIcon, CloudUploadIcon, ExternalLinkIcon } from './components/icons';

const DOCX_ACCEPT = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx';
const OUTPUT_ACCEPT = '.xlsx,.xls,.html,.htm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/html';
const API_KEY_STORAGE_KEY = 'quiz-helper-gemini-api-key';
const AI_MODEL_STORAGE_KEY = 'quiz-helper-ai-model';
const API_DELAY_STORAGE_KEY = 'quiz-helper-api-delay-ms';
const RETRY_COUNT_STORAGE_KEY = 'quiz-helper-retry-count';
const RETRY_DELAY_STORAGE_KEY = 'quiz-helper-retry-delay-ms';
const SOLVE_BATCH_SIZE_STORAGE_KEY = 'quiz-helper-solve-batch-size';
const SPLIT_MODE_STORAGE_KEY = 'quiz-helper-split-mode';
const QUESTIONS_PER_CHUNK_STORAGE_KEY = 'quiz-helper-questions-per-chunk';
const SECTIONS_PER_CHUNK_STORAGE_KEY = 'quiz-helper-sections-per-chunk';
const EXPORT_SPLIT_MODE_STORAGE_KEY = 'quiz-helper-export-split-mode';
const EXPORT_QUESTIONS_PER_FILE_STORAGE_KEY = 'quiz-helper-export-questions-per-file';
const NETLIFY_TOKEN_STORAGE_KEY = 'quiz-helper-netlify-token';
const NETLIFY_SITE_NAME_STORAGE_KEY = 'quiz-helper-netlify-site-name';
const NETLIFY_DEPLOY_MODE_STORAGE_KEY = 'quiz-helper-netlify-deploy-mode';
const NETLIFY_SITE_NAME_MAX_LENGTH = 63;
const MAMMOTH_CDN_URL = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';

type MammothBrowser = {
  extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value?: string }>;
};

declare global {
  interface Window {
    mammoth?: MammothBrowser;
  }
}

let mammothPromise: Promise<MammothBrowser> | null = null;

const loadMammoth = (): Promise<MammothBrowser> => {
  if (window.mammoth) return Promise.resolve(window.mammoth);
  if (mammothPromise) return mammothPromise;

  mammothPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${MAMMOTH_CDN_URL}"]`);

    const finish = () => {
      if (window.mammoth) resolve(window.mammoth);
      else {
        mammothPromise = null;
        reject(new Error('Khong tai duoc Mammoth de doc file DOCX.'));
      }
    };

    const fail = () => {
      mammothPromise = null;
      reject(new Error('Khong tai duoc Mammoth de doc file DOCX.'));
    };

    if (existingScript) {
      existingScript.addEventListener('load', finish, { once: true });
      existingScript.addEventListener('error', fail, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = MAMMOTH_CDN_URL;
    script.async = true;
    script.onload = finish;
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return mammothPromise;
};

type InputSplitMode = 'none' | 'questions' | 'sections';
type ExportSplitMode = 'none' | 'questionCount' | 'sourceFile' | 'processingChunk';
type NetlifyDeployMode = 'default' | 'custom';

type TextChunk = {
  label: string;
  text: string;
};

type ParseTask = {
  fileName: string;
  groupName: string;
  chunk: TextChunk;
  chunkIndex: number;
  chunkCount: number;
};

type ExportGroup = {
  name: string;
  questions: Question[];
};

type NetlifyDeployListItem = NetlifyDeployResult & {
  groupName: string;
};

type ApiKeyIssueKind = 'quota-limit' | 'temporary' | 'auth' | 'other';

type ApiKeyDisplayStatus = {
  index: number;
  label: string;
  state: 'ready' | 'running' | 'limited' | 'invalid' | 'error';
  successCount: number;
  failureCount: number;
  lastError?: string;
  lastErrorKind?: ApiKeyIssueKind;
  lastUsedAt?: number;
};

type SolveTask = {
  id: string;
  index: number;
  question: Question;
};

class ApiKeyUnavailableError extends Error {}

class NoAvailableApiKeyError extends Error {}

const runWithConcurrency = async <T, R,>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }));

  return results;
};

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => window.setTimeout(resolve, ms));

const parseApiKeys = (value: string): string[] =>
  Array.from(new Set(
    value
      .split(/[\s,;]+/)
      .map(key => key.trim())
      .filter(Boolean)
  ));

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;

  try {
    return JSON.stringify(err);
  } catch {
    return 'loi khong xac dinh';
  }
};

const maskApiKey = (key: string): string => {
  if (key.length <= 8) return `${key.slice(0, 2)}...${key.slice(-2)}`;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

const createApiKeyStatus = (key: string, index: number): ApiKeyDisplayStatus => ({
  index,
  label: `Key ${index + 1} (${maskApiKey(key)})`,
  state: 'ready',
  successCount: 0,
  failureCount: 0,
});

const classifyAiError = (err: unknown): ApiKeyIssueKind => {
  const message = getErrorMessage(err);

  if (/(?:401|403|API_KEY_INVALID|invalid api key|api key not valid|permission denied|unauthorized)/i.test(message)) {
    return 'auth';
  }

  if (/(?:429|RESOURCE_EXHAUSTED|quota|rate|limit)/i.test(message)) {
    return 'quota-limit';
  }

  if (/(?:503|UNAVAILABLE|high demand|overloaded|temporar|timeout)/i.test(message)) {
    return 'temporary';
  }

  return 'other';
};

const createApiKeyPool = (
  apiKeys: string[],
  delayMs: number,
  onStatusChange?: (statuses: ApiKeyDisplayStatus[]) => void
) => {
  const states = apiKeys.map((key, index) => ({
    key,
    readyAt: 0,
    chain: Promise.resolve() as Promise<void>,
    disabled: false,
    ...createApiKeyStatus(key, index),
  }));
  let cursor = 0;

  const publish = () => {
    onStatusChange?.(states.map(state => ({
      index: state.index,
      label: state.label,
      state: state.state,
      successCount: state.successCount,
      failureCount: state.failureCount,
      lastError: state.lastError,
      lastErrorKind: state.lastErrorKind,
      lastUsedAt: state.lastUsedAt,
    })));
  };

  const nextState = () => {
    for (let i = 0; i < states.length; i += 1) {
      const state = states[cursor % states.length];
      cursor += 1;
      if (!state.disabled) return state;
    }

    return null;
  };

  return {
    size: states.length,
    hasAvailableKey: () => states.some(state => !state.disabled),
    run: async <R,>(worker: (apiKey: string) => Promise<R>): Promise<R> => {
      if (states.length === 0) {
        throw new Error('Hay nhap it nhat 1 Gemini API key.');
      }

      const state = nextState();
      if (!state) {
        throw new NoAvailableApiKeyError('Tat ca API key dang tam dung trong lan chay nay. Xem bang trang thai key de biet key nao can thay.');
      }

      const current = state.chain.then(async () => {
        if (state.disabled) {
          throw new ApiKeyUnavailableError(`${state.label} da bi tam dung, chuyen sang key khac.`);
        }

        const waitMs = Math.max(0, state.readyAt - Date.now());
        if (waitMs > 0) {
          await sleep(waitMs);
        }

        state.readyAt = Date.now() + delayMs;
        state.state = 'running';
        state.lastUsedAt = Date.now();
        publish();

        try {
          const result = await worker(state.key);
          state.successCount += 1;
          state.state = 'ready';
          publish();
          return result;
        } catch (err) {
          const kind = classifyAiError(err);
          const message = getErrorMessage(err);

          state.failureCount += 1;
          state.lastError = message;
          state.lastErrorKind = kind;

          if (kind === 'quota-limit' || kind === 'auth') {
            state.disabled = true;
            state.state = kind === 'auth' ? 'invalid' : 'limited';
          } else {
            state.state = 'error';
          }

          publish();
          throw new Error(`${state.label}: ${message}`);
        }
      });

      state.chain = current.then(() => undefined, () => undefined);
      return current;
    },
  };
};

type ApiKeyPool = ReturnType<typeof createApiKeyPool>;

const isRetryableAiError = (err: unknown): boolean => {
  if (err instanceof ApiKeyUnavailableError) return true;
  if (err instanceof NoAvailableApiKeyError) return false;

  const kind = classifyAiError(err);
  if (kind === 'quota-limit' || kind === 'temporary') return true;

  const message = getErrorMessage(err);
  return /(?:503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|rate|quota|overloaded|temporar)/i.test(message);
};

const runAiWithRetries = async <R,>(
  pool: ApiKeyPool,
  worker: (apiKey: string) => Promise<R>,
  retryCount: number,
  retryDelayMs: number
): Promise<R> => {
  let lastError: unknown;
  const effectiveRetryCount = Math.max(retryCount, Math.max(0, pool.size - 1));

  for (let attempt = 0; attempt <= effectiveRetryCount; attempt += 1) {
    try {
      return await pool.run(worker);
    } catch (err) {
      lastError = err;
      const errorKind = classifyAiError(err);
      const canSwitchKey = pool.hasAvailableKey() && (
        errorKind === 'quota-limit' ||
        errorKind === 'auth' ||
        err instanceof ApiKeyUnavailableError
      );

      if ((!isRetryableAiError(err) && !canSwitchKey) || attempt >= effectiveRetryCount) {
        throw err;
      }

      if (pool.hasAvailableKey()) {
        const isKeySwitch = errorKind === 'quota-limit' || errorKind === 'auth' || err instanceof ApiKeyUnavailableError;
        const backoff = isKeySwitch ? 250 : retryDelayMs * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * Math.min(1000, retryDelayMs));
        await sleep(backoff + jitter);
      }
    }
  }

  throw lastError;
};

const getStorageNumber = (key: string, fallback: number): number => {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const getStorageOption = <T extends string>(key: string, fallback: T, allowed: T[]): T => {
  const value = localStorage.getItem(key) as T | null;
  return value && allowed.includes(value) ? value : fallback;
};

const getBaseName = (fileName: string): string =>
  fileName.replace(/\.[^.]+$/, '');

const chunkArray = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const splitTextByPattern = (text: string, pattern: RegExp): string[] => {
  const matches = Array.from(text.matchAll(pattern));
  if (matches.length <= 1) return [];

  return matches.map((match, index) => {
    const start = match.index || 0;
    const end = matches[index + 1]?.index ?? text.length;
    return text.slice(start, end).trim();
  }).filter(Boolean);
};

const splitTextByCharacters = (text: string, maxLength = 22000): string[] => {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > maxLength) {
    const windowText = remaining.slice(0, maxLength);
    const breakAt = Math.max(
      windowText.lastIndexOf('\n\n'),
      windowText.lastIndexOf('\n'),
      Math.floor(maxLength * 0.75)
    );

    chunks.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
};

const chunkDocxText = (
  text: string,
  splitMode: InputSplitMode,
  questionsPerChunk: number,
  sectionsPerChunk: number
): TextChunk[] => {
  const normalizedText = text.replace(/\r\n/g, '\n').trim();

  if (!normalizedText || splitMode === 'none') {
    return [{ label: 'full', text: normalizedText }];
  }

  if (splitMode === 'sections') {
    const sectionBlocks = splitTextByPattern(
      normalizedText,
      /^\s*(?:bài|bai|phần|phan|chủ đề|chu de)\s+\d+[\s:.-]*/gim
    );

    if (sectionBlocks.length > 0) {
      return chunkArray(sectionBlocks, Math.max(1, sectionsPerChunk)).map((items, index) => ({
        label: `nhom-bai-${index + 1}`,
        text: items.join('\n\n'),
      }));
    }
  }

  const questionBlocks = splitTextByPattern(
    normalizedText,
    /^\s*(?:câu|cau|question)\s*\d+[\s:.)-]*/gim
  );

  if (questionBlocks.length > 0) {
    return chunkArray(questionBlocks, Math.max(1, questionsPerChunk)).map((items, index) => ({
      label: `nhom-cau-${index + 1}`,
      text: items.join('\n\n'),
    }));
  }

  return splitTextByCharacters(normalizedText).map((chunk, index) => ({
    label: `nhom-text-${index + 1}`,
    text: chunk,
  }));
};

const groupBy = <T,>(items: T[], keyFactory: (item: T) => string): ExportGroup[] => {
  const map = new Map<string, Question[]>();

  items.forEach(item => {
    const question = item as Question;
    const key = keyFactory(item);
    const current = map.get(key) || [];
    current.push(question);
    map.set(key, current);
  });

  return Array.from(map.entries()).map(([name, groupedQuestions]) => ({
    name,
    questions: groupedQuestions,
  }));
};

const buildExportGroups = (
  questions: Question[],
  splitMode: ExportSplitMode,
  questionsPerFile: number,
  baseName: string
): ExportGroup[] => {
  if (questions.length === 0) return [];

  if (splitMode === 'questionCount') {
    return chunkArray(questions, Math.max(1, questionsPerFile)).map((items, index) => ({
      name: `${baseName} phan ${index + 1}`,
      questions: items,
    }));
  }

  if (splitMode === 'sourceFile') {
    return groupBy(questions, question => getBaseName((question as Question).sourceFile || baseName));
  }

  if (splitMode === 'processingChunk') {
    return groupBy(questions, question => (question as Question).exportGroup || getBaseName((question as Question).sourceFile || baseName));
  }

  return [{ name: baseName, questions }];
};

const readDocxText = async (file: File): Promise<string> => {
  const mammoth = await loadMammoth();
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
};

const parsedQuestionToQuestion = (parsed: ParsedQuestion, sourceFile: string, exportGroup?: string): Question => {
  const cleanedOptions = (parsed.options || []).map(option =>
    option.replace(/^[a-eA-E][.)]\s*/, '').replace(/^[1-5][.)]\s*/, '').trim()
  );

  return {
    questionText: parsed.questionText,
    options: cleanedOptions,
    questionType: parsed.questionType,
    correctAnswer: parsed.questionType === QuestionType.FillInTheBlank ? '1' : '',
    timeInSeconds: 60,
    imageLink: '',
    answerExplanation: '',
    sourceFile,
    exportGroup,
  };
};

const getApiKeyStatusText = (status: ApiKeyDisplayStatus): string => {
  if (status.state === 'running') return 'Dang dung';
  if (status.state === 'limited') return 'Bi limit/quota - can thay hoac doi reset';
  if (status.state === 'invalid') return 'Key loi/khong hop le';
  if (status.state === 'error') return 'Loi tam thoi';
  return 'San sang';
};

const getApiKeyStatusClass = (status: ApiKeyDisplayStatus): string => {
  if (status.state === 'limited' || status.state === 'invalid') {
    return 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-200';
  }

  if (status.state === 'error') {
    return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200';
  }

  if (status.state === 'running') {
    return 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-200';
  }

  return 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-200';
};

const getCompactError = (message?: string): string => {
  if (!message) return '';
  return message.length > 120 ? `${message.slice(0, 117)}...` : message;
};

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isDeployingNetlify, setIsDeployingNetlify] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [aiModel, setAiModel] = useState<string>(() => localStorage.getItem(AI_MODEL_STORAGE_KEY) || DEFAULT_GEMINI_MODEL);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [netlifyToken, setNetlifyToken] = useState<string>(() => localStorage.getItem(NETLIFY_TOKEN_STORAGE_KEY) || '');
  const [netlifySiteName, setNetlifySiteName] = useState<string>(() => localStorage.getItem(NETLIFY_SITE_NAME_STORAGE_KEY) || '');
  const [showNetlifyToken, setShowNetlifyToken] = useState<boolean>(false);
  const [showNetlifySettings, setShowNetlifySettings] = useState<boolean>(false);
  const [netlifyDeployMode, setNetlifyDeployMode] = useState<NetlifyDeployMode>(() =>
    getStorageOption<NetlifyDeployMode>(NETLIFY_DEPLOY_MODE_STORAGE_KEY, 'default', ['default', 'custom'])
  );
  const [netlifyResults, setNetlifyResults] = useState<NetlifyDeployListItem[]>([]);
  const [apiDelayMs, setApiDelayMs] = useState<number>(() => getStorageNumber(API_DELAY_STORAGE_KEY, 1500));
  const [retryCount, setRetryCount] = useState<number>(() => getStorageNumber(RETRY_COUNT_STORAGE_KEY, 3));
  const [retryDelayMs, setRetryDelayMs] = useState<number>(() => getStorageNumber(RETRY_DELAY_STORAGE_KEY, 4000));
  const [solveConcurrency, setSolveConcurrency] = useState<number>(4);
  const [solveBatchSize, setSolveBatchSize] = useState<number>(() => getStorageNumber(SOLVE_BATCH_SIZE_STORAGE_KEY, 5));
  const [useSearch, setUseSearch] = useState<boolean>(true);
  const [inputSplitMode, setInputSplitMode] = useState<InputSplitMode>(() =>
    getStorageOption<InputSplitMode>(SPLIT_MODE_STORAGE_KEY, 'questions', ['none', 'questions', 'sections'])
  );
  const [questionsPerChunk, setQuestionsPerChunk] = useState<number>(() => getStorageNumber(QUESTIONS_PER_CHUNK_STORAGE_KEY, 50));
  const [sectionsPerChunk, setSectionsPerChunk] = useState<number>(() => getStorageNumber(SECTIONS_PER_CHUNK_STORAGE_KEY, 1));
  const [exportSplitMode, setExportSplitMode] = useState<ExportSplitMode>(() =>
    getStorageOption<ExportSplitMode>(EXPORT_SPLIT_MODE_STORAGE_KEY, 'processingChunk', ['none', 'questionCount', 'sourceFile', 'processingChunk'])
  );
  const [exportQuestionsPerFile, setExportQuestionsPerFile] = useState<number>(() => getStorageNumber(EXPORT_QUESTIONS_PER_FILE_STORAGE_KEY, 40));
  const [quickAnswers, setQuickAnswers] = useState<string>('');
  const [quickCheckboxAnswers, setQuickCheckboxAnswers] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [apiKeyStatuses, setApiKeyStatuses] = useState<ApiKeyDisplayStatus[]>([]);

  const isBusy = isProcessing || isSolving || isImporting || isDeployingNetlify;
  const apiKeys = useMemo(() => parseApiKeys(apiKey), [apiKey]);
  const hasApiKey = apiKeys.length > 0;
  const hasCustomNetlifyToken = netlifyToken.trim().length > 0;
  const exportBaseName = useMemo(() => makeExportBaseName(questions), [questions]);
  const exportGroups = useMemo(
    () => buildExportGroups(questions, exportSplitMode, exportQuestionsPerFile, exportBaseName),
    [questions, exportSplitMode, exportQuestionsPerFile, exportBaseName]
  );

  useEffect(() => {
    setApiKeyStatuses(apiKeys.map(createApiKeyStatus));
  }, [apiKeys]);

  useEffect(() => {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }, [apiKey]);

  useEffect(() => {
    if (netlifyToken.trim()) {
      localStorage.setItem(NETLIFY_TOKEN_STORAGE_KEY, netlifyToken.trim());
    } else {
      localStorage.removeItem(NETLIFY_TOKEN_STORAGE_KEY);
    }
  }, [netlifyToken]);

  useEffect(() => {
    if (netlifySiteName.trim()) {
      localStorage.setItem(NETLIFY_SITE_NAME_STORAGE_KEY, netlifySiteName.trim());
    } else {
      localStorage.removeItem(NETLIFY_SITE_NAME_STORAGE_KEY);
    }
  }, [netlifySiteName]);

  useEffect(() => {
    localStorage.setItem(NETLIFY_DEPLOY_MODE_STORAGE_KEY, netlifyDeployMode);
  }, [netlifyDeployMode]);

  useEffect(() => {
    localStorage.setItem(AI_MODEL_STORAGE_KEY, aiModel.trim() || DEFAULT_GEMINI_MODEL);
  }, [aiModel]);

  useEffect(() => {
    localStorage.setItem(API_DELAY_STORAGE_KEY, String(apiDelayMs));
  }, [apiDelayMs]);

  useEffect(() => {
    localStorage.setItem(RETRY_COUNT_STORAGE_KEY, String(retryCount));
  }, [retryCount]);

  useEffect(() => {
    localStorage.setItem(RETRY_DELAY_STORAGE_KEY, String(retryDelayMs));
  }, [retryDelayMs]);

  useEffect(() => {
    localStorage.setItem(SOLVE_BATCH_SIZE_STORAGE_KEY, String(solveBatchSize));
  }, [solveBatchSize]);

  useEffect(() => {
    localStorage.setItem(SPLIT_MODE_STORAGE_KEY, inputSplitMode);
  }, [inputSplitMode]);

  useEffect(() => {
    localStorage.setItem(QUESTIONS_PER_CHUNK_STORAGE_KEY, String(questionsPerChunk));
  }, [questionsPerChunk]);

  useEffect(() => {
    localStorage.setItem(SECTIONS_PER_CHUNK_STORAGE_KEY, String(sectionsPerChunk));
  }, [sectionsPerChunk]);

  useEffect(() => {
    localStorage.setItem(EXPORT_SPLIT_MODE_STORAGE_KEY, exportSplitMode);
  }, [exportSplitMode]);

  useEffect(() => {
    localStorage.setItem(EXPORT_QUESTIONS_PER_FILE_STORAGE_KEY, String(exportQuestionsPerFile));
  }, [exportQuestionsPerFile]);

  useEffect(() => {
    setNetlifyResults([]);
  }, [questions, exportSplitMode, exportQuestionsPerFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((files: File[]) => {
    setSelectedFiles(files);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewUrl(null);
  }, []);

  const handleApplyQuickAnswers = useCallback(() => {
    if (!quickAnswers.trim()) return;

    const answers = quickAnswers.trim().split(/\s+/).filter(Boolean);
    const answerMap: { [key: string]: string } = {
      A: '1', B: '2', C: '3', D: '4', E: '5',
      '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
    };

    setQuestions(prev => prev.map((question, index) => {
      if (question.questionType !== QuestionType.MultipleChoice || index >= answers.length) {
        return question;
      }

      const mappedAnswer = answerMap[answers[index].toUpperCase()];
      return mappedAnswer ? { ...question, correctAnswer: mappedAnswer } : question;
    }));

    setQuickAnswers('');
  }, [quickAnswers]);

  const handleApplyQuickCheckboxAnswers = useCallback(() => {
    if (!quickCheckboxAnswers.trim()) return;

    const normalized = quickCheckboxAnswers.trim()
      .replace(/Đúng/gi, 'Đ')
      .replace(/Dung/gi, 'Đ')
      .replace(/Sai/gi, 'S')
      .replace(/True/gi, 'Đ')
      .replace(/False/gi, 'S');

    const tokens = normalized.includes(' ') || normalized.includes('\n')
      ? normalized.split(/\s+/).filter(Boolean)
      : normalized.split('');

    setQuestions(prev => {
      const next = [...prev];
      let tokenIndex = 0;

      for (let i = 0; i < next.length; i += 1) {
        if (next[i].questionType !== QuestionType.Checkbox) continue;

        const correctIndices: string[] = [];
        for (let j = 0; j < next[i].options.length; j += 1) {
          if (tokenIndex >= tokens.length) break;
          const token = tokens[tokenIndex].toUpperCase();
          if (token === 'Đ' || token === 'D' || token === 'T' || token === '1') {
            correctIndices.push(String(j + 1));
          }
          tokenIndex += 1;
        }

        next[i] = { ...next[i], correctAnswer: correctIndices.join(',') };
        if (tokenIndex >= tokens.length) break;
      }

      return next;
    });

    setQuickCheckboxAnswers('');
  }, [quickCheckboxAnswers]);

  const processFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('Hay chon it nhat 1 file DOCX.');
      return;
    }

    if (!hasApiKey) {
      setError('Hay nhap Gemini API key truoc khi xu ly bang AI.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setQuestions([]);
    closePreview();

    const failures: string[] = [];

    try {
      const { parseQuizFromFile } = await import('./services/geminiService');
      const textGroups = await runWithConcurrency<File, ParseTask[]>(selectedFiles, 4, async (file: File) => {
        try {
          const fileText = await readDocxText(file);

          if (!fileText.trim()) {
            throw new Error('Khong doc duoc noi dung trong file.');
          }

          const chunks = chunkDocxText(fileText, inputSplitMode, questionsPerChunk, sectionsPerChunk);
          const baseName = getBaseName(file.name);

          return chunks.map((chunk, chunkIndex) => ({
            fileName: file.name,
            groupName: chunks.length > 1 ? `${baseName} phan ${chunkIndex + 1}` : baseName,
            chunk,
            chunkIndex,
            chunkCount: chunks.length,
          }));
        } catch (err: any) {
          failures.push(`${file.name}: ${err.message || 'loi khong xac dinh'}`);
          return [];
        }
      });

      const parseTasks = textGroups.flat();

      if (parseTasks.length === 0) {
        setError(failures.length > 0
          ? `Khong doc duoc file nao. ${failures.join(' | ')}`
          : 'Khong co noi dung de xu ly.');
        return;
      }

      const apiPool = createApiKeyPool(apiKeys, apiDelayMs, setApiKeyStatuses);
      const groups = await runWithConcurrency<ParseTask, Question[]>(
        parseTasks,
        solveConcurrency,
        async (task) => {
          try {
            const parsedQuestions = await runAiWithRetries(
              apiPool,
              requestApiKey => parseQuizFromFile(task.chunk.text, requestApiKey, { model: aiModel }),
              retryCount,
              retryDelayMs
            );
            return parsedQuestions.map(parsed =>
              parsedQuestionToQuestion(parsed, task.fileName, task.groupName)
            );
          } catch (err) {
            failures.push(`${task.fileName} / ${task.chunk.label}: ${getErrorMessage(err) || 'AI loi'}`);
            return [];
          }
        }
      );

      const mergedQuestions = groups.flat();

      if (mergedQuestions.length === 0) {
        setError(failures.length > 0
          ? `Khong trich xuat duoc cau hoi. ${failures.join(' | ')}`
          : "AI khong tim thay cau hoi nao trong tai lieu.");
      } else {
        setQuestions(mergedQuestions);
        if (failures.length > 0) {
          setError(`Da nap ${mergedQuestions.length} cau, nhung co ${failures.length} file loi: ${failures.join(' | ')}`);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Khong the xu ly file DOCX.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportOutputFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) return;

    setIsImporting(true);
    setError(null);
    closePreview();

    const failures: string[] = [];

    try {
      const { importOutputQuestions } = await import('./utils/quizImporter');
      const groups = await runWithConcurrency<File, Question[]>(files, 4, async (file: File) => {
        try {
          return await importOutputQuestions(file);
        } catch (err: any) {
          failures.push(`${file.name}: ${err.message || 'loi khong xac dinh'}`);
          return [];
        }
      });

      const importedQuestions = groups.flat();

      if (importedQuestions.length > 0) {
        setQuestions(importedQuestions);
      }

      if (failures.length > 0) {
        setError(`Da import ${importedQuestions.length} cau, nhung co file loi: ${failures.join(' | ')}`);
      } else if (importedQuestions.length === 0) {
        setError('Khong tim thay cau hoi trong file output vua chon.');
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Khong the import file output.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    setQuestions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSolveAll = async () => {
    if (questions.length === 0) return;

    if (!hasApiKey) {
      setError('Hay nhap Gemini API key truoc khi giai bang AI.');
      return;
    }

    setIsSolving(true);
    setError(null);
    closePreview();

    const snapshot = questions.map(question => ({ ...question }));
    const failures: string[] = [];
    const solveTasks: SolveTask[] = snapshot.map((question, index) => ({
      id: `q${index + 1}`,
      index,
      question,
    }));
    const solveBatches = chunkArray(solveTasks, Math.max(1, solveBatchSize));

    setQuestions(prev => prev.map(question => ({ ...question, isSolving: true, isSolved: false })));

    try {
      const { solveQuestionsWithSearch } = await import('./services/geminiService');
      const apiPool = createApiKeyPool(apiKeys, apiDelayMs, setApiKeyStatuses);

      await runWithConcurrency<SolveTask[], void>(
        solveBatches,
        solveConcurrency,
        async (batch) => {
          try {
            const results = await runAiWithRetries(
              apiPool,
              requestApiKey => solveQuestionsWithSearch(
                batch.map(task => ({
                  id: task.id,
                  questionText: task.question.questionText,
                  options: task.question.options,
                  questionType: task.question.questionType,
                })),
                requestApiKey,
                { useSearch, model: aiModel }
              ),
              retryCount,
              retryDelayMs
            );
            const resultMap = new Map(results.map(result => [result.id, result]));

            setQuestions(prev => {
              const next = [...prev];

              batch.forEach(task => {
                const current = next[task.index];
                const result = resultMap.get(task.id);
                if (!current || !result) return;

                if (current.questionType === QuestionType.FillInTheBlank) {
                  const updatedOptions = [...current.options];
                  if (updatedOptions.length === 0) {
                    updatedOptions.push(result.correctAnswer);
                  } else {
                    updatedOptions[0] = result.correctAnswer;
                  }

                  next[task.index] = {
                    ...current,
                    options: updatedOptions,
                    correctAnswer: '1',
                    answerExplanation: result.explanation,
                    isSolving: false,
                    isSolved: true,
                  };
                } else {
                  next[task.index] = {
                    ...current,
                    correctAnswer: result.correctAnswer,
                    answerExplanation: result.explanation,
                    isSolving: false,
                    isSolved: true,
                  };
                }
              });

              return next;
            });

            const missing = batch.filter(task => !resultMap.has(task.id));
            if (missing.length > 0) {
              failures.push(...missing.map(task => `Cau ${task.index + 1}: AI khong tra ve dap an`));
              setQuestions(prev => {
                const next = [...prev];
                missing.forEach(task => {
                  if (next[task.index]) next[task.index] = { ...next[task.index], isSolving: false };
                });
                return next;
              });
            }
          } catch (err) {
            failures.push(...batch.map(task => `Cau ${task.index + 1}: ${getErrorMessage(err) || 'AI loi'}`));
            setQuestions(prev => {
              const next = [...prev];
              batch.forEach(task => {
                if (next[task.index]) next[task.index] = { ...next[task.index], isSolving: false };
              });
              return next;
            });
          }
        }
      );

      if (failures.length > 0) {
        setError(`${failures.length} cau chua giai duoc. ${failures.slice(0, 4).join(' | ')}`);
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Khong the tai cong cu giai AI.');
      setQuestions(prev => prev.map(question => ({ ...question, isSolving: false })));
    } finally {
      setIsSolving(false);
    }
  };

  const handlePreviewHtml = async () => {
    if (questions.length === 0) return;
    const previewGroup = exportGroups[0] || { name: exportBaseName, questions };
    try {
      const { createHtmlPreviewUrl } = await import('./utils/htmlExporter');
      setPreviewUrl(createHtmlPreviewUrl(previewGroup.questions, previewGroup.name));
    } catch (err) {
      setError(getErrorMessage(err) || 'Khong the tao ban xem truoc HTML.');
    }
  };

  const handleExportHtml = async () => {
    if (questions.length === 0) return;
    try {
      const { exportToHtml } = await import('./utils/htmlExporter');
      exportGroups.forEach((group, index) => {
        const suffix = exportGroups.length > 1 ? `-${index + 1}` : '';
        exportToHtml(group.questions, `${sanitizeFileName(group.name)}${suffix}.html`);
      });
    } catch (err) {
      setError(getErrorMessage(err) || 'Khong the xuat HTML.');
    }
  };

  const handleExportXlsx = async () => {
    if (questions.length === 0) return;
    try {
      const { exportToXlsx } = await import('./utils/xlsxExporter');
      exportGroups.forEach((group, index) => {
        const suffix = exportGroups.length > 1 ? `-${index + 1}` : '';
        exportToXlsx(group.questions, `${sanitizeFileName(group.name)}${suffix}.xlsx`);
      });
    } catch (err) {
      setError(getErrorMessage(err) || 'Khong the xuat Excel.');
    }
  };

  const getNetlifySiteNameForGroup = (index: number, groupCount: number): string | undefined => {
    const baseSiteName = netlifySiteName.trim();
    if (!baseSiteName) return undefined;
    if (groupCount <= 1) return baseSiteName;

    const suffix = `-${index + 1}`;
    const maxBaseLength = Math.max(1, NETLIFY_SITE_NAME_MAX_LENGTH - suffix.length);
    const safeBase = baseSiteName.slice(0, maxBaseLength).replace(/^-+|-+$/g, '') || 'quiz';
    return `${safeBase}${suffix}`;
  };

  const handleDeployNetlify = async () => {
    if (questions.length === 0) return;

    if (netlifyDeployMode === 'custom' && !hasCustomNetlifyToken) {
      setError('Hay nhap Netlify personal access token hoac chon dung token mac dinh.');
      return;
    }

    const groupsToDeploy = exportGroups.length > 0 ? exportGroups : [{ name: exportBaseName, questions }];

    if (groupsToDeploy.every(group => group.questions.length === 0)) {
      setError('Khong co cau hoi nao de deploy len Netlify.');
      return;
    }

    setIsDeployingNetlify(true);
    setError(null);
    setNetlifyResults([]);

    try {
      const [{ buildHtmlDocument }, netlifyService] = await Promise.all([
        import('./utils/htmlExporter'),
        import('./services/netlifyService'),
      ]);

      const successfulResults: NetlifyDeployListItem[] = [];

      for (const [index, group] of groupsToDeploy.entries()) {
        if (group.questions.length === 0) continue;

        const html = buildHtmlDocument(group.questions, group.name);
        const siteName = getNetlifySiteNameForGroup(index, groupsToDeploy.length);
        const result = netlifyDeployMode === 'custom'
          ? await netlifyService.deployQuizToNetlify({
            accessToken: netlifyToken,
            html,
            title: group.name,
            siteName,
          })
          : await netlifyService.deployQuizWithDefaultNetlifyToken({
            html,
            title: group.name,
            siteName,
          });

        successfulResults.push({
          ...result,
          groupName: group.name,
        });
        setNetlifyResults([...successfulResults]);
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Khong the tao du link Netlify.');
    } finally {
      setIsDeployingNetlify(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Quiz Data Entry Helper
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Xu ly nhieu file, giai song song, import lai output va xuat HTML slide.
          </p>
        </header>

        <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FileUpload
              id="docx-upload"
              onFileSelect={handleFileSelect}
              selectedFiles={selectedFiles}
              accept={DOCX_ACCEPT}
              multiple
              emptyHint="DOCX files"
              selectedHint="Click or drag to replace the batch"
            />

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Gemini API Keys
                </label>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="Paste API keys, one per line"
                    rows={3}
                    style={showApiKey ? undefined : ({ WebkitTextSecurity: 'disc' } as React.CSSProperties)}
                    className="min-w-0 flex-1 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(prev => !prev)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className={`mt-2 text-sm ${hasApiKey ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {hasApiKey ? `${apiKeys.length} API key ready, xoay vong tu dong` : 'Can nhap API key de dung AI'}
                </p>
                {apiKeyStatuses.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {apiKeyStatuses.map(status => (
                      <div key={status.index} className={`rounded-lg border px-3 py-2 text-xs ${getApiKeyStatusClass(status)}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{status.label}</span>
                          <span className="whitespace-nowrap">{getApiKeyStatusText(status)}</span>
                        </div>
                        <div className="mt-1 text-[11px] opacity-80">
                          OK {status.successCount} / Loi {status.failureCount}
                        </div>
                        {status.lastError && (
                          <div className="mt-1 text-[11px] break-words opacity-90">
                            {getCompactError(status.lastError)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold mb-2">AI model</span>
                  <input
                    list="gemini-models"
                    value={aiModel}
                    onChange={(event) => setAiModel(event.target.value)}
                    placeholder={DEFAULT_GEMINI_MODEL}
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                  <datalist id="gemini-models">
                    <option value="gemini-3-flash-preview" />
                    <option value="gemini-2.5-flash" />
                    <option value="gemini-2.5-flash-lite" />
                  </datalist>
                </label>
                <label className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold mb-2">Retry / call</span>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={retryCount}
                    onChange={(event) => setRetryCount(Math.max(0, Math.min(8, Number(event.target.value) || 0)))}
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </label>
                <label className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold mb-2">Retry delay (ms)</span>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    value={retryDelayMs}
                    onChange={(event) => setRetryDelayMs(Math.max(500, Number(event.target.value) || 500))}
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    checked={useSearch}
                    onChange={(event) => setUseSearch(event.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-semibold">Google Search</span>
                </label>
                <label className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold mb-2">AI song song</span>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={solveConcurrency}
                    onChange={(event) => setSolveConcurrency(Math.max(1, Math.min(16, Number(event.target.value) || 1)))}
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </label>
                <label className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold mb-2">Cau/key/lan giai</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={solveBatchSize}
                    onChange={(event) => setSolveBatchSize(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </label>
                <label className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold mb-2">Delay/key (ms)</span>
                  <input
                    type="number"
                    min={0}
                    step={250}
                    value={apiDelayMs}
                    onChange={(event) => setApiDelayMs(Math.max(0, Number(event.target.value) || 0))}
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold mb-2">Chia Word</span>
                  <select
                    value={inputSplitMode}
                    onChange={(event) => setInputSplitMode(event.target.value as InputSplitMode)}
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  >
                    <option value="questions">Theo so cau</option>
                    <option value="sections">Theo bai/phan</option>
                    <option value="none">Khong chia</option>
                  </select>
                </label>
                <label className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold mb-2">Cau / goi AI</span>
                  <input
                    type="number"
                    min={5}
                    value={questionsPerChunk}
                    onChange={(event) => setQuestionsPerChunk(Math.max(5, Number(event.target.value) || 5))}
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </label>
                <label className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold mb-2">Bai / goi AI</span>
                  <input
                    type="number"
                    min={1}
                    value={sectionsPerChunk}
                    onChange={(event) => setSectionsPerChunk(Math.max(1, Number(event.target.value) || 1))}
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </label>
              </div>

              <button
                onClick={processFiles}
                disabled={selectedFiles.length === 0 || isBusy}
                className="flex items-center justify-center w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300"
              >
                <MagicWandIcon className="w-5 h-5 mr-2" />
                {isProcessing ? 'Processing...' : `Process ${selectedFiles.length || ''} DOCX with AI`}
              </button>

              <label className="flex items-center justify-center gap-2 w-full px-6 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                <UploadIcon className="w-5 h-5 text-indigo-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {isImporting ? 'Importing...' : 'Import output HTML/XLSX'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept={OUTPUT_ACCEPT}
                  multiple
                  onChange={handleImportOutputFiles}
                  disabled={isBusy}
                />
              </label>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setShowNetlifySettings(prev => !prev)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-sm font-bold text-gray-800 dark:text-gray-100">Netlify settings</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {netlifyDeployMode === 'default' ? 'Dung token mac dinh tren server' : 'Dung token rieng tren trinh duyet'}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                    {showNetlifySettings ? 'Hide' : 'Open'}
                  </span>
                </button>

                {showNetlifySettings && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Cach deploy
                        </span>
                        <select
                          value={netlifyDeployMode}
                          onChange={(event) => {
                            setNetlifyDeployMode(event.target.value as NetlifyDeployMode);
                            setNetlifyResults([]);
                          }}
                          className="w-full p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500 text-sm"
                        >
                          <option value="default">Token mac dinh tren server</option>
                          <option value="custom">Token rieng cua nguoi dung</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Site slug
                        </span>
                        <input
                          type="text"
                          value={netlifySiteName}
                          onChange={(event) => {
                            setNetlifySiteName(event.target.value);
                            setNetlifyResults([]);
                          }}
                          placeholder="Auto neu de trong"
                          className="w-full p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500 text-sm"
                        />
                      </label>

                      <label className={`block ${netlifyDeployMode === 'custom' ? '' : 'opacity-60'}`}>
                        <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Netlify token rieng
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={netlifyToken}
                            onChange={(event) => {
                              setNetlifyToken(event.target.value);
                              setNetlifyResults([]);
                            }}
                            placeholder="nfp_..."
                            disabled={netlifyDeployMode !== 'custom'}
                            style={showNetlifyToken ? undefined : ({ WebkitTextSecurity: 'disc' } as React.CSSProperties)}
                            className="min-w-0 flex-1 p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500 text-sm disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNetlifyToken(prev => !prev)}
                            disabled={netlifyDeployMode !== 'custom'}
                            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {showNetlifyToken ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <a
                          href="https://app.netlify.com/user/applications#personal-access-tokens"
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          Tao PAT
                          <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="text-center my-10">
            <div role="status" className="inline-block">
              <svg aria-hidden="true" className="w-12 h-12 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">AI is extracting your quiz batch...</p>
          </div>
        )}

        {questions.length > 0 && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Extracted Questions</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {questions.length} questions loaded, export thanh {exportGroups.length || 1} file
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold whitespace-nowrap">Chia output</span>
                  <select
                    value={exportSplitMode}
                    onChange={(event) => setExportSplitMode(event.target.value as ExportSplitMode)}
                    className="p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  >
                    <option value="processingChunk">Theo goi xu ly</option>
                    <option value="questionCount">Theo so cau</option>
                    <option value="sourceFile">Theo file goc</option>
                    <option value="none">1 file</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold whitespace-nowrap">Cau/file</span>
                  <input
                    type="number"
                    min={5}
                    value={exportQuestionsPerFile}
                    onChange={(event) => setExportQuestionsPerFile(Math.max(5, Number(event.target.value) || 5))}
                    className="w-24 p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </label>
              </div>

              <div className="flex-grow md:flex-grow-0 md:ml-auto flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="MCQ: A B C or 1 2 3"
                    value={quickAnswers}
                    onChange={(event) => setQuickAnswers(event.target.value)}
                    className="w-full md:w-48 p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  <button
                    onClick={handleApplyQuickAnswers}
                    className="px-3 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 text-sm"
                  >
                    Apply
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <textarea
                    placeholder="Checkbox: Dung Sai D S..."
                    value={quickCheckboxAnswers}
                    onChange={(event) => setQuickCheckboxAnswers(event.target.value)}
                    className="w-full md:w-48 p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    rows={1}
                  />
                  <button
                    onClick={handleApplyQuickCheckboxAnswers}
                    className="px-3 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all duration-300 text-sm whitespace-nowrap"
                  >
                    Apply T/F
                  </button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleSolveAll}
                  disabled={isBusy || questions.length === 0}
                  className="flex items-center justify-center px-5 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-purple-300 transition-all duration-300"
                >
                  <MagicWandIcon className="w-5 h-5 mr-2" />
                  {isSolving ? 'Solving...' : 'Solve with AI'}
                </button>
                <button
                  onClick={handlePreviewHtml}
                  disabled={isBusy || questions.length === 0}
                  className="flex items-center justify-center px-5 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 disabled:bg-sky-300 transition-all duration-300"
                >
                  Preview HTML
                </button>
                <button
                  onClick={handleExportHtml}
                  disabled={isBusy || questions.length === 0}
                  className="flex items-center justify-center px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 disabled:bg-emerald-300 transition-all duration-300"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Export HTML
                </button>
                <button
                  onClick={handleExportXlsx}
                  disabled={isBusy || questions.length === 0}
                  className="flex items-center justify-center px-5 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-300 transition-all duration-300"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Export XLSX
                </button>
                <button
                  onClick={handleDeployNetlify}
                  disabled={isBusy || questions.length === 0 || (netlifyDeployMode === 'custom' && !hasCustomNetlifyToken)}
                  className="flex items-center justify-center px-5 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-md hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <CloudUploadIcon className="w-5 h-5 mr-2" />
                  {isDeployingNetlify ? 'Deploying...' : `Create Link${exportGroups.length > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>

            {netlifyResults.length > 0 && (
              <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <div className="px-3 py-2 border-b border-green-200 dark:border-green-800 text-sm font-bold text-green-700 dark:text-green-200">
                  Da tao {netlifyResults.length} link Netlify
                </div>
                <div className="divide-y divide-green-200 dark:divide-green-800">
                  {netlifyResults.map((result, index) => (
                    <div key={`${result.siteId}-${result.deployId}-${index}`} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-green-700 dark:text-green-200">
                          {result.groupName} - {result.siteName} - {result.state}
                        </div>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-sky-700 dark:text-sky-300 font-semibold hover:underline"
                        >
                          {result.url}
                        </a>
                      </div>
                      {result.adminUrl && (
                        <a
                          href={result.adminUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded text-sm font-semibold text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900"
                        >
                          Dashboard
                          <ExternalLinkIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Review and edit the extracted data below.
              <span className="font-semibold text-indigo-500"> Pro Tip:</span> Click an option to set the correct answer, or paste all answers in the boxes above.
            </p>

            <QuestionTable questions={questions} onQuestionChange={handleQuestionChange} />

            {previewUrl && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold">HTML Preview</h3>
                  <button
                    onClick={closePreview}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
                <iframe
                  title="Quiz HTML Preview"
                  src={previewUrl}
                  className="w-full h-[82vh] border-0 bg-white"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
