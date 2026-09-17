"use client";

import Link from 'next/link';
import { Home, PlusCircle, Target, Wallet, FileText, TrendingUp, ReceiptText, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
    const { lang, toggleLang, t } = useLanguage();

    return (
        <>
            {/* Desktop Navbar (Hidden on mobile) */}
            <nav className="fixed top-0 w-full z-50 glass border-b border-slate-200 hidden sm:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href={`/?lang=${lang}`} className="flex items-center gap-2 group">
                                <div className="bg-brand-600 p-2 rounded-xl group-hover:bg-brand-500 transition-colors">
                                    <Wallet className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-900 to-brand-600">
                                    {t('nav.brand')}
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-3">
                            <NavLink href={`/?lang=${lang}`} icon={<Home className="w-4 h-4" />} label={t('nav.home')} />
                            <NavLink href={`/goals?lang=${lang}`} icon={<Target className="w-4 h-4" />} label={t('nav.goals')} />
                            <NavLink href={`/planning?lang=${lang}`} icon={<TrendingUp className="w-4 h-4" />} label={t('nav.strategy')} />
                            <NavLink href={`/expenses?lang=${lang}`} icon={<ReceiptText className="w-4 h-4" />} label={t('nav.expenses')} />
                            <NavLink href={`/wizard?lang=${lang}`} icon={<PlusCircle className="w-4 h-4" />} label={t('nav.wizard')} />
                            <NavLink href={`/report?lang=${lang}`} icon={<FileText className="w-4 h-4" />} label={t('nav.report')} />

                            {/* Docs Dropdown */}
                            <div className="relative group/docs">
                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-all">
                                    <FileText className="w-4 h-4" />
                                    <span className="hidden sm:inline">{t('nav.docs')}</span>
                                </button>
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 hidden group-hover/docs:block animate-in fade-in slide-in-from-top-2 duration-200">
                                    <a href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/User-Guide" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-600">{t('nav.userGuide')}</a>
                                    <a href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/Design-Document" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-600">{t('nav.designDoc')}</a>
                                    <a href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/Project-Work-Log" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-600">{t('nav.projectWorkLog')}</a>
                                </div>
                            </div>

                            {/* Language Switcher Toggle Button */}
                            <button
                                onClick={toggleLang}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 shadow-sm transition-all active:scale-95 ml-2"
                                title="Switch Language / 切換語言"
                            >
                                <Globe className="w-3.5 h-3.5 text-brand-600" />
                                <span>{lang === 'zh' ? 'English' : '繁體中文'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Header (Hidden on desktop) */}
            <div className="fixed top-0 w-full z-50 glass border-b border-slate-200 sm:hidden flex items-center justify-between px-4 h-16">
                <Link href={`/?lang=${lang}`} className="flex items-center gap-2">
                    <div className="bg-brand-600 p-1.5 rounded-lg">
                        <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-900 to-brand-600">
                        {t('nav.brand')}
                    </span>
                </Link>

                <button
                    onClick={toggleLang}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200"
                >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{lang === 'zh' ? 'EN' : '繁中'}</span>
                </button>
            </div>

            {/* Mobile Bottom Navigation (Hidden on desktop) */}
            <nav className="fixed bottom-0 w-full z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 sm:hidden">
                <div className="grid grid-cols-7 h-16">
                    <MobileNavLink href={`/?lang=${lang}`} icon={<Home className="w-4 h-4" />} label={t('nav.home')} />
                    <MobileNavLink href={`/goals?lang=${lang}`} icon={<Target className="w-4 h-4" />} label={t('nav.goals')} />
                    <MobileNavLink href={`/planning?lang=${lang}`} icon={<TrendingUp className="w-4 h-4" />} label={t('nav.strategy')} />
                    <MobileNavLink href={`/expenses?lang=${lang}`} icon={<ReceiptText className="w-4 h-4" />} label={t('nav.expenses')} />
                    <MobileNavLink href={`/wizard?lang=${lang}`} icon={<PlusCircle className="w-4 h-4" />} label={t('nav.wizard')} />
                    <MobileNavLink href={`/report?lang=${lang}`} icon={<FileText className="w-4 h-4" />} label={t('nav.report')} />
                    <MobileNavLink href="https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki/User-Guide" icon={<FileText className="w-4 h-4" />} label={t('nav.docs')} />
                </div>
            </nav>

        </>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-all active:scale-95"
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
}

function MobileNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-500 hover:text-brand-600 active:scale-95 transition-all"
        >
            <div className="p-1">
                {icon}
            </div>
            <span>{label}</span>
        </Link>
    );
}

