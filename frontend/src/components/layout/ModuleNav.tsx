import React from 'react';
import {
  Activity,
  CalendarCheck,
  FileText,
  GitPullRequest,
  FlaskConical,
  Pill,
  HeartHandshake,
  LayoutDashboard,
  MapPin,
  BookOpen,
  History,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ModuleTab, PersonaRole } from '../../types';

interface ModuleNavProps {
  activeTab: ModuleTab;
  setActiveTab: (tab: ModuleTab) => void;
  selectedPersona: PersonaRole;
}

export const ModuleNav: React.FC<ModuleNavProps> = ({
  activeTab,
  setActiveTab,
  selectedPersona,
}) => {
  const { t, isHindi } = useLanguage();

  const navItems = [
    {
      id: 'triage' as ModuleTab,
      label: t('navTriage'),
      icon: Activity,
      color: 'text-emerald-500',
      badge: isHindi ? 'आवाज + एआई' : 'Voice + AI',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'appointments' as ModuleTab,
      label: t('navAppointments'),
      icon: CalendarCheck,
      color: 'text-blue-500',
      badge: 'Live OPD',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'patients' as ModuleTab,
      label: t('navPatients'),
      icon: FileText,
      color: 'text-purple-500',
      badge: 'ABHA / LPR',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'referrals' as ModuleTab,
      label: t('navReferrals'),
      icon: GitPullRequest,
      color: 'text-amber-500',
      badge: 'Closed-Loop',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'diagnostics' as ModuleTab,
      label: t('navDiagnostics'),
      icon: FlaskConical,
      color: 'text-cyan-500',
      badge: 'Lab Orders',
      badgeColor: 'bg-cyan-100 text-cyan-800',
    },
    {
      id: 'inventory' as ModuleTab,
      label: t('navInventory'),
      icon: Pill,
      color: 'text-rose-500',
      badge: 'Stock Radar',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'highrisk' as ModuleTab,
      label: t('navHighrisk'),
      icon: HeartHandshake,
      color: 'text-orange-500',
      badge: 'ASHA Care',
      badgeColor: 'bg-orange-100 text-orange-800',
    },
    {
      id: 'dashboard' as ModuleTab,
      label: t('navDashboard'),
      icon: LayoutDashboard,
      color: 'text-teal-500',
      badge: 'Command',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
  ];

  return (
    <div className="w-full mb-6">
      {/* Scrollable Horizontal Pill Tabs */}
      <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap text-xs font-black transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-950 text-white shadow-sm scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : item.color}`} />
              <span>{item.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase tracking-tight ${
                  isActive ? 'bg-white/20 text-white' : item.badgeColor
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}

        {/* Secondary quick tabs */}
        <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

        <button
          onClick={() => setActiveTab('guidelines')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap text-xs font-bold transition-all shrink-0 ${
            activeTab === 'guidelines'
              ? 'bg-slate-950 text-white'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Guidelines"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t('navGuidelines')}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap text-xs font-bold transition-all shrink-0 ${
            activeTab === 'history'
              ? 'bg-slate-950 text-white'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="History"
        >
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>{t('navHistory')}</span>
        </button>
      </div>
    </div>
  );
};

