import { getSettings, updateSettings } from '@/lib/db';
import * as Localization from 'expo-localization';
import { createContext, useContext, useEffect, useState } from "react";
import { Language } from '../lib/lang';

interface SettingContextType {
    language: string;
    setLanguage: (language: Language) => void;
}

const SettingContext = createContext<SettingContextType | undefined>(undefined);

export const useSetting = () => {
    const context = useContext(SettingContext);
    if (!context) {
        throw new Error("useSetting must be used within a SettingProvider");
    }
    return context;
};

export const SettingProvider = ({ children }: { children: React.ReactNode }) => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [language, setLanguage] = useState(Language.EN);

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        /**
         * Get settings
         */
        (async () => {
            const settings = await getSettings();
            if (settings.lang) {
                setLanguage(settings.lang as Language);
            } else {
                /**
                 * If lang is null, get system language and update settings
                 */
                const getSystemLanguageForSettings = async () => {
                    try {
                        const locale = Localization.getLocales?.()[0]?.languageTag ?? 'en';
                        
                        let systemLang: Language;
                        if (locale.startsWith('zh')) {
                            if (locale.includes('TW') || locale.includes('HK')) {
                                systemLang = Language.ZH_TW;
                            } else {
                                systemLang = Language.ZH_CN;
                            }
                        } else if (locale.startsWith('en')) {
                            systemLang = Language.EN;
                        } else {
                            systemLang = Language.EN;
                        }
                        
                        // Update settings with system language
                        try {
                            await updateSettings({ lang: systemLang });
                            setLanguage(systemLang);
                        } catch (error) {
                            console.error('Error updating settings:', error);
                            throw error;
                        }
                    } catch (error) {
                        console.error('Error setting system language:', error);
                        setLanguage(Language.EN);
                    }
                };
                
                await getSystemLanguageForSettings();
            }
        })();

    }, []);

    return (
        <SettingContext.Provider value={{ language, setLanguage }}>
            {children}
        </SettingContext.Provider>
    );
};

export default SettingProvider;
