"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react';
import { translations, Language } from '@/lib/i18n/translations';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    toggleLang: () => void;
    t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }
    return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Language>('zh');

    useEffect(() => {
        // Read URL search params first
        const searchParams = new URLSearchParams(window.location.search);
        const urlLang = searchParams.get('lang');

        if (urlLang === 'en' || urlLang === 'zh') {
            setLangState(urlLang as Language);
            localStorage.setItem('app_lang', urlLang);
        } else {
            const savedLang = localStorage.getItem('app_lang') as Language;
            if (savedLang === 'en' || savedLang === 'zh') {
                setLangState(savedLang);
            }
        }
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('app_lang', newLang);

        // Update URL query parameter seamlessly
        const url = new URL(window.location.href);
        url.searchParams.set('lang', newLang);
        window.history.replaceState({}, '', url.toString());
    };

    const toggleLang = () => {
        const nextLang = lang === 'zh' ? 'en' : 'zh';
        setLang(nextLang);
    };

    const t = (path: string, params?: Record<string, string | number>): string => {
        let text = getNestedValue(translations[lang], path) ?? getNestedValue(translations['zh'], path) ?? path;
        if (params) {
            Object.entries(params).forEach(([key, val]) => {
                text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
            });
        }
        return text;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
