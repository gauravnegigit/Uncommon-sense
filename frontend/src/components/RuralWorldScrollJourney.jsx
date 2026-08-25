import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Play, Pause, RotateCcw, Volume2, ShieldAlert, Heart, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const SECTIONS = [
  {
    id: 'village',
    label: 'The Village',
    still: './assets/scene1_village.jpg',
    stillAlt: './public/assets/scene1_village.jpg',
    accent: '#0d9488',
    eyebrow: 'Grassroots Healthcare',
    title: 'Care Reaching the Farthest Village.',
    body: 'In remote rural settlements where the nearest district hospital is 40 km away, GraminHealth brings voice-guided symptom assessment and localized medical intelligence right to the doorsteps of citizens.',
    tags: ['2G & Offline-Ready', 'Hindi & English Voice', 'Zero-Barriers Access'],
    sceneNumber: '01',
    description: 'Traditional village homes, banyan trees, and earthen paths connected via digital telemetry.'
  },
  {
    id: 'asha',
    label: 'ASHA Warriors',
    still: './assets/scene2_asha.jpg',
    stillAlt: './public/assets/scene2_asha.jpg',
    accent: '#7c3aed',
    eyebrow: 'Frontline Health Heroes',
    title: 'Empowering Village Caregivers.',
    body: 'ASHA workers and ANMs conduct door-to-door maternal checkups, infant vaccinations, and household screenings with offline caching that auto-syncs the moment cellular signal returns.',
    tags: ['Maternal ANC Tracking', 'Immunization Clock', 'Offline Queue Sync'],
    sceneNumber: '02',
    description: 'Frontline health worker equipped with medical kit & tablet conducting doorstep screenings.'
  },
  {
    id: 'phc',
    label: 'Smart 24x7 PHC',
    still: './assets/scene3_phc.jpg',
    stillAlt: './public/assets/scene3_phc.jpg',
    accent: '#0284c7',
    eyebrow: 'Connected Clinical Network',
    title: 'Real-Time Triage & Facility Locator.',
    body: 'Deterministic clinical algorithms grade patient severity in real-time. Live geospatial mapping shows bed capacity, doctor rosters, and essential drug stock across Primary Health Centres.',
    tags: ['Live Bed Availability', 'Doctor Rosters', 'ABDM Health Records'],
    sceneNumber: '03',
    description: 'Solar-powered Primary Health Centre with telemedicine terminal, pharmacy & 12 beds.'
  },
  {
    id: 'emergency',
    label: '108 SOS Tele-Hub',
    still: './assets/scene4_emergency.jpg',
    stillAlt: './public/assets/scene4_emergency.jpg',
    accent: '#e11d48',
    eyebrow: 'Instant Life-Saving Response',
    title: 'Immediate Tele-Consultation & 108 Dispatch.',
    body: 'One-tap 108 ambulance dispatch with live GPS radar tracking, direct driver hotline, and digital e-Prescriptions with morning/afternoon/night pictograms for effortless medication intake.',
    tags: ['Live 108 GPS Radar', 'Visual Dosage Prescriptions', 'Tele-OPD Video Call'],
    sceneNumber: '04',
    description: '108 emergency ambulance vehicle with vital telemetry, oxygen delivery & doctor hotline.',
    cta: {
      primary: { label: 'Start Symptom Triage', path: '/triage' },
      secondary: { label: 'Locate Nearest PHC', path: '/clinics' }
    }
  }
];

const RuralWorldScrollJourney = ({ onClose }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  
  const [activeIdx, setActiveIdx] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAutoFlying, setIsAutoFlying] = useState(false);
  const autoPlayRef = useRef(null);

  const N = SECTIONS.length;

  // Track scroll position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const scrollTop = el.scrollTop;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
    setScrollProgress(progress);

    const sectionIndex = Math.min(N - 1, Math.floor(progress * N + 0.12));
    setActiveIdx(sectionIndex);
  };

  // Jump to specific scene smoothly
  const jumpToScene = (idx) => {
    const safeIdx = Math.max(0, Math.min(N - 1, idx));
    setActiveIdx(safeIdx);
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const targetScroll = (safeIdx / (N - 1)) * maxScroll;
    el.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  // Toggle Auto-Fly continuous camera movement
  const toggleAutoFly = () => {
    if (isAutoFlying) {
      clearInterval(autoPlayRef.current);
      setIsAutoFlying(false);
    } else {
      setIsAutoFlying(true);
      autoPlayRef.current = setInterval(() => {
        if (!scrollContainerRef.current) return;
        const el = scrollContainerRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (el.scrollTop >= maxScroll - 8) {
          el.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ top: 4, behavior: 'auto' });
        }
      }, 30);
    }
  };

  useEffect(() => {
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  const currentSection = SECTIONS[activeIdx] || SECTIONS[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none bg-[#F5EDE0] text-[#241d2b] font-sans antialiased animate-in fade-in duration-300">
      
      {/* 1. TOP PROGRESS TRACK */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-[#241d2b]/10 z-50">
        <div 
          className="h-full transition-all duration-150 ease-out"
          style={{ 
            width: `${Math.max(10, ((activeIdx + 1) / N) * 100)}%`,
            backgroundColor: currentSection.accent 
          }}
        />
      </div>

      {/* 2. TOPBAR HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 sm:px-12 py-4 bg-[#F5EDE0]/90 backdrop-blur-md border-b border-[#E5D7C3] shadow-xs pointer-events-auto">
        {/* Brand Pill */}
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md transition-colors duration-500"
            style={{ backgroundColor: currentSection.accent }}
          >
            <Heart className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#241d2b]">
              Gramin<span style={{ color: currentSection.accent }}>Health</span>
            </span>
            <span className="block text-[10px] text-[#6a6072] font-bold -mt-0.5 uppercase tracking-wider">
              Rural 3D Generative Story
            </span>
          </div>
        </div>

        {/* Center Capsule Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 p-1.5 bg-white/80 backdrop-blur-md rounded-full border border-black/10 shadow-xs">
          {SECTIONS.map((sec, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={sec.id}
                onClick={() => jumpToScene(i)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                  isActive 
                    ? 'text-white shadow-xs' 
                    : 'text-[#6a6072] hover:text-[#241d2b] hover:bg-black/5'
                }`}
                style={{
                  backgroundColor: isActive ? sec.accent : 'transparent'
                }}
              >
                {sec.label}
              </button>
            );
          })}
        </nav>

        {/* Right Stage Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => jumpToScene((activeIdx - 1 + N) % N)}
            className="p-2 rounded-xl bg-white/80 hover:bg-white text-[#241d2b] border border-black/10 shadow-xs transition"
            title="Previous Stage"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => jumpToScene((activeIdx + 1) % N)}
            className="px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[#241d2b] font-bold text-xs border border-black/10 shadow-xs transition flex items-center gap-1"
            title="Next Stage"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleAutoFly}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              isAutoFlying 
                ? 'bg-amber-500 text-[#241d2b] animate-pulse' 
                : 'bg-white/80 hover:bg-white text-[#241d2b] border border-black/10'
            }`}
          >
            {isAutoFlying ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isAutoFlying ? 'Pause' : 'Auto Fly'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#241d2b] hover:bg-[#1a1420] text-white transition-colors shadow-xs ml-1"
              title="Close Story"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 3. MAIN SPLIT-VIEW STAGE (STORY CARD ON LEFT, 3D DIORAMA ON RIGHT) */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="fixed inset-0 pt-20 overflow-y-scroll scroll-smooth z-10 no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Virtual Scroll Height */}
        <div className="h-[380vh] w-full pointer-events-none" />

        {/* 4. FIXED DESKTOP / MOBILE STAGE CONTAINER */}
        <div className="fixed inset-0 pt-20 pointer-events-none z-20 flex items-center justify-center px-4 sm:px-8 lg:px-16">
          <div className="w-full max-w-7xl h-[80vh] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* LEFT COLUMN: NARRATIVE STORY CARD */}
            <div className="lg:col-span-5 pointer-events-auto">
              <div className="bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-[#E5D7C3] shadow-xl space-y-4 relative overflow-hidden transition-all duration-300">
                {/* Accent Top Border Stripe */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 transition-colors duration-500"
                  style={{ backgroundColor: currentSection.accent }}
                />

                {/* Stage Badge & Number */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5EDE0] border border-[#E5D7C3] text-[11px] font-mono font-bold tracking-wider text-[#6a6072]">
                    <span className="text-[#241d2b]">{currentSection.sceneNumber}</span>
                    <span>/</span>
                    <span>04</span>
                    <span>•</span>
                    <span style={{ color: currentSection.accent }} className="uppercase tracking-wider">
                      {currentSection.label}
                    </span>
                  </div>

                  <span 
                    className="text-[11px] font-extrabold tracking-widest uppercase"
                    style={{ color: currentSection.accent }}
                  >
                    {currentSection.eyebrow}
                  </span>
                </div>

                {/* Main Headline */}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#241d2b] tracking-tight leading-tight">
                  {currentSection.title}
                </h2>

                {/* Narrative Body */}
                <p className="text-xs sm:text-sm text-[#4a4055] leading-relaxed font-medium">
                  {currentSection.body}
                </p>

                {/* Feature Tags Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentSection.tags.map((tag, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#F5EDE0] border border-[#E5D7C3] text-[#241d2b]"
                    >
                      ✓ {tag}
                    </span>
                  ))}
                </div>

                {/* Action CTA buttons */}
                <div className="pt-3 flex flex-wrap items-center gap-3">
                  {currentSection.cta ? (
                    <>
                      <Link
                        to={currentSection.cta.primary.path}
                        onClick={onClose}
                        className="px-6 py-3 bg-[#241d2b] hover:bg-black text-white font-bold text-xs rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <span>{currentSection.cta.primary.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to={currentSection.cta.secondary.path}
                        onClick={onClose}
                        className="px-5 py-3 bg-[#F5EDE0] hover:bg-[#EFE5D5] text-[#241d2b] font-bold text-xs rounded-2xl border border-[#E5D7C3] transition-colors"
                      >
                        {currentSection.cta.secondary.label}
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={() => jumpToScene((activeIdx + 1) % N)}
                      className="px-5 py-2.5 bg-[#241d2b] hover:bg-black text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center gap-2"
                    >
                      <span>Continue Story</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 3D GENERATIVE DIORAMA STAGE */}
            <div className="lg:col-span-7 flex items-center justify-center relative">
              <div className="relative w-full aspect-[3/2] max-w-[680px] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#E5D7C3] bg-white group">
                
                {SECTIONS.map((sec, idx) => {
                  const isActive = idx === activeIdx;
                  return (
                    <div 
                      key={sec.id}
                      className={`absolute inset-0 transition-all duration-700 ease-out flex items-center justify-center ${
                        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                      }`}
                    >
                      {/* Generative 3D Reference Image */}
                      <img 
                        src={sec.still} 
                        alt={sec.title}
                        onError={(e) => {
                          if (e.target.src !== sec.stillAlt) {
                            e.target.src = sec.stillAlt;
                          }
                        }}
                        className="w-full h-full object-cover object-center transform transition-transform duration-1000 group-hover:scale-105"
                      />

                      {/* Scene Caption Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl text-white text-xs flex justify-between items-center">
                        <span className="font-semibold">{sec.description}</span>
                        <span className="font-mono text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                          Sector {sec.sceneNumber}
                        </span>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>

          </div>
        </div>

        {/* 5. RIGHT ROUTE RAIL WAYPOINT INDICATOR */}
        <div className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-6 pointer-events-auto">
          <div className="absolute top-2 bottom-2 w-0.5 bg-[#241d2b]/15 -z-10" />
          
          {SECTIONS.map((sec, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={sec.id}
                onClick={() => jumpToScene(idx)}
                className="relative group p-1.5 focus:outline-none"
                title={sec.label}
              >
                <div 
                  className={`w-4 h-4 rounded-full transition-all duration-300 border-2 ${
                    isActive 
                      ? 'scale-140 shadow-lg' 
                      : 'bg-white border-[#241d2b]/30 hover:border-[#241d2b]/80 group-hover:scale-120'
                  }`}
                  style={{
                    backgroundColor: isActive ? sec.accent : '#fff',
                    borderColor: isActive ? '#fff' : undefined,
                    boxShadow: isActive ? `0 0 14px ${sec.accent}` : undefined
                  }}
                />

                {/* Hover Tooltip */}
                <span className="absolute right-8 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-[#241d2b] text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-md">
                  {sec.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 6. BOTTOM SCROLL HINT */}
        <div 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#6a6072] uppercase pointer-events-none transition-opacity duration-300"
          style={{ opacity: scrollProgress > 0.85 ? 0.2 : 1 }}
        >
          <span>Scroll or use arrows to fly through world</span>
          <div className="w-4 h-7 rounded-full border-2 border-[#241d2b]/30 relative flex justify-center">
            <div 
              className="w-1 h-2 rounded-full absolute top-1 animate-bounce"
              style={{ backgroundColor: currentSection.accent }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default RuralWorldScrollJourney;
