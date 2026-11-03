import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import config from './config.json';
import en from './messages/en.json';

export type Messages = typeof en;

export interface LocaleInfo {
  code: string;
  hreflang: string;
  ogLocale: string;
  name: string;
}

export const SITE_URL = config.siteUrl;
export const DEFAULT_LOCALE = config.defaultLocale;
export const LOCALES: LocaleInfo[] = config.locales;
export const LOCALIZED_PATHS: string[] = config.localizedPaths;

const LOCALE_CODES = LOCALES.map((l) => l.code);
const cache: Record<string, Messages> = { en };

export const isLocale = (code: string | undefined): code is string => !!code && LOCALE_CODES.includes(code);

/** "/de/faq" -> "de", everything else -> "en". */
export const localeFromPath = (pathname: string): string => {
  const first = pathname.split('/')[1];
  return first && first !== DEFAULT_LOCALE && isLocale(first) ? first : DEFAULT_LOCALE;
};

/** "/de/faq" -> "/faq", "/de" -> "/", "/faq" -> "/faq". */
export const stripLocale = (pathname: string): string => {
  const lang = localeFromPath(pathname);
  if (lang === DEFAULT_LOCALE) return pathname || '/';
  return pathname.slice(lang.length + 1) || '/';
};

const normalize = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path) || '/';

/** Pages that have a translation get a localized URL, everything else stays on the English URL. */
export const localizePath = (lang: string, path: string): string => {
  const [pathAndQuery, hash = ''] = path.split('#');
  const [p, query = ''] = pathAndQuery.split('?');
  const clean = normalize(p);
  const suffix = `${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
  if (lang === DEFAULT_LOCALE || !LOCALIZED_PATHS.includes(clean)) return `${clean}${suffix}`;
  return `${clean === '/' ? `/${lang}` : `/${lang}${clean}`}${suffix}`;
};

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

export const loadMessages = async (lang: string): Promise<Messages> => {
  if (cache[lang]) return cache[lang];
  try {
    const mod = await import(`./messages/${lang}.json`);
    cache[lang] = (mod.default || mod) as Messages;
    return cache[lang];
  } catch {
    return en;
  }
};

interface LocaleContextValue {
  lang: string;
  t: Messages;
  /** Build a link that stays inside the current language when that page is translated. */
  path: (p: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  lang: DEFAULT_LOCALE,
  t: en,
  path: (p) => p,
});

export const LocaleProvider: React.FC<{ lang: string; children: React.ReactNode }> = ({ lang, children }) => {
  const [messages, setMessages] = useState<Messages>(cache[lang] || en);

  useEffect(() => {
    let live = true;
    if (cache[lang]) {
      setMessages(cache[lang]);
    } else {
      loadMessages(lang).then((m) => live && setMessages(m));
    }
    return () => {
      live = false;
    };
  }, [lang]);

  const value = useMemo<LocaleContextValue>(
    () => ({ lang, t: cache[lang] || messages, path: (p) => localizePath(lang, p) }),
    [lang, messages]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => useContext(LocaleContext);

/**
 * Tiny markup for translated strings:
 *   [[x]] -> blue gradient word, {{x}} -> orange gradient word, | -> line break.
 */
export const rich = (text: string, blueClass = 'grad-blue', orangeClass = 'grad-orange'): React.ReactNode[] =>
  text.split('|').flatMap((line, li, lines) => {
    const parts = line.split(/(\[\[.*?\]\]|\{\{.*?\}\})/g).filter(Boolean);
    const nodes = parts.map((part, i) => {
      if (part.startsWith('[[')) return <span key={`${li}-${i}`} className={blueClass}>{part.slice(2, -2)}</span>;
      if (part.startsWith('{{')) return <span key={`${li}-${i}`} className={orangeClass}>{part.slice(2, -2)}</span>;
      return <React.Fragment key={`${li}-${i}`}>{part}</React.Fragment>;
    });
    return li < lines.length - 1 ? [...nodes, <br key={`br-${li}`} />] : nodes;
  });

/** Strip the rich markers for plain-text use (alt text, meta, JSON-LD). */
export const plain = (text: string) => text.replace(/\[\[|\]\]|\{\{|\}\}/g, '').replace(/\s*\|\s*/g, ' ');
