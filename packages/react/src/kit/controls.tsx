/** Latent kit — theme + language toggles. Drop-in controls that flip the
 *  `data-theme` / `data-lang` attributes the whole language reacts to (and
 *  persist + notify, so other islands re-render). Usable anywhere. */
import { useEffect, useState } from "react";
import { Segmented } from "./primitives.tsx";
import { getLang, LANG_EVENT } from "../i18n.ts";
import type { Lang } from "../i18n.ts";

export type Theme = "dark" | "light" | "kami";

function readTheme(): Theme {
  if (typeof document !== "undefined") {
    const t = document.documentElement.dataset.theme;
    if (t === "dark" || t === "kami") return t;
  }
  return "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  // start at the SSR-stable default, then sync to the real attribute on mount
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => setTheme(readTheme()), []);
  const set = (t: Theme) => {
    setTheme(t);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = t;
      try {
        localStorage.setItem("latent-theme", t);
      } catch {
        /* ignore */
      }
    }
  };
  return (
    <Segmented
      className={className}
      ariaLabel="Theme"
      value={theme}
      onChange={set}
      options={[
        { value: "dark", label: "Dark" },
        { value: "light", label: "Light" },
        { value: "kami", label: "Kami" },
      ]}
    />
  );
}

export function LangToggle({ className }: { className?: string }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => setLang(getLang()), []);
  const set = (l: Lang) => {
    setLang(l);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.lang = l;
      document.documentElement.lang = l;
      try {
        localStorage.setItem("latent-lang", l);
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event(LANG_EVENT));
    }
  };
  return (
    <Segmented
      className={className}
      ariaLabel="Language"
      value={lang}
      onChange={set}
      options={[
        { value: "en", label: "EN" },
        { value: "zh", label: "中" },
      ]}
    />
  );
}
