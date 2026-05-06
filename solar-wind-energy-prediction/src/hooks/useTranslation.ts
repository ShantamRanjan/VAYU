import { useAppContext } from "@/context/AppContext";
import { translations, TranslationKey } from "@/lib/translations";

export function useTranslation() {
  const { language } = useAppContext();

  const t = (key: TranslationKey, args?: Record<string, string | number>): string => {
    let str = translations[language][key] || translations.en[key] || key;
    if (args) {
      Object.entries(args).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, String(v));
      });
    }
    return str;
  };

  return { t, language };
}
