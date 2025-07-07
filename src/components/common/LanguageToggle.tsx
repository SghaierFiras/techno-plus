import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function LanguageToggle({ className = '', showLabel = true }: LanguageToggleProps) {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  return (
    <div className={`flex items-center ${className}`}>
      {showLabel && (
        <Globe className="h-4 w-4 text-gray-500 mr-2" />
      )}
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
        className="text-sm text-black border-gray-300 rounded-md "
        aria-label={t('common.language')}
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}