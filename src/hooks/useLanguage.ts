import { useTranslation } from 'react-i18next';

export function useLanguage() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    isRTL: i18n.dir() === 'rtl'
  };
}