import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, ShieldCheck } from 'lucide-react';

const SECTIONS = [
  {
    id: 'voice_input',
    label: 'Hindi Voice Capture',
    clip: './assets/scene1_vdo.mp4',
    clipAlt: './public/assets/scene1_vdo.mp4',
    still: './assets/scene1_voice_input.jpg',
    stillAlt: './public/assets/scene1_voice_input.jpg',
    accent: '#0d9488',
    eyebrow: 'Step 01 • Voice-First Accessibility',
    title: 'Speak Symptoms in Hindi with Full Consent.',
    body: 'Patients describe fever, pain, or discomfort in natural Hindi. Our speech-to-text pipeline transcribes audio and extracts structured clinical symptoms while ensuring zero PII storage.',
    modelBadge: 'Hindi Speech-to-Text & Clinical Entity Recognition (NER)',
    tags: ['Hindi Audio Transcriber', 'Symptom Entity Extractor', 'Patient Consent Active']
  },
  {
    id: 'deterministic_triage',
    label: 'Safety-First Triage',
    clip: './assets/scene2_vdo.mp4',
    clipAlt: './public/assets/scene2_vdo.mp4',
    still: './assets/scene2_triage.jpg',
    stillAlt: './public/assets/scene2_triage.jpg',
    accent: '#7c3aed',
    eyebrow: 'Step 02 • Deterministic Rule Engine',
    title: 'Emergency, Urgent, or Routine Classification.',
    body: 'We do not guess diseases. A clinically reviewed deterministic rule engine analyzes extracted symptoms against emergency protocols to classify urgency with a clear "Not a Diagnosis" safety notice.',
    modelBadge: 'Clinically Reviewed 3-Tier Deterministic Decision Logic',
    tags: ['🚨 Emergency / ⚠️ Urgent / 🟢 Routine', 'Deterministic Safety Rules', 'Not a Diagnosis Notice']
  },
  {
    id: 'facility_referral',
    label: 'Nearby Facility Referral',
    clip: './assets/scene3_vdo.mp4',
    clipAlt: './public/assets/scene3_vdo.mp4',
    still: './assets/scene3_referral.jpg',
    stillAlt: './public/assets/scene3_referral.jpg',
    accent: '#0284c7',
    eyebrow: 'Step 03 • Location-Based Referral',
    title: 'Know Exactly Where to Go: PHC, CHC, or Hospital.',
    body: 'Matches patient severity to the nearest suitable public healthcare tier (Sub-Centre, 24x7 PHC, or CHC) based on real-time bed availability, travel distance, and on-duty doctors.',
    modelBadge: 'Geospatial Facility & Resource Routing Engine',
    tags: ['Nearby PHC / CHC Locator', 'Urgency-Matched Facility Tier', 'Live Geospatial Routing']
  },
  {
    id: 'doctor_summary_offline',
    label: 'Doctor Summary & Offline',
    clip: './assets/scene4_vdo.mp4',
    clipAlt: './public/assets/scene4_vdo.mp4',
    still: './assets/scene4_summary.jpg',
    stillAlt: './public/assets/scene4_summary.jpg',
    accent: '#e11d48',
    eyebrow: 'Step 04 • Doctor Summary & Offline Cache',
    title: 'Doctor-Ready Summary in Hindi/English + Offline Cache.',
    body: 'Generates structured clinical dossiers in both Hindi and English for examining physicians, and caches decision trees locally to ensure zero disruption in low-connectivity rural zones.',
    modelBadge: 'Bilingual Clinical Report Synthesizer & Local Cache',
    tags: ['Bilingual Summary (Hindi & English)', 'Low-Connectivity Offline Cache', 'ABDM Digital Health Format'],
    cta: {
      primary: { label: 'Start Hindi Voice Triage', href: '/triage' },
      secondary: { label: 'Locate Nearest PHC', href: '/clinics' }
    }
  }
];

const ContinuousDroneScrollJourney = () => {
  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0); // 0.0 -> 1.0
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafIdRef = useRef(null);

  const N = SECTIONS.length;

  // Intercept scroll/wheel on the story with gentle 60fps Lerp momentum
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let touchStartY = 0;

    const updateStory = (prog) => {
      const idx = Math.min(N - 1, Math.floor(prog * N));
      setActiveIdx(idx);
      setStoryProgress(prog);

      // Scrub videos according to story progress
      const stageDuration = 1 / N;
      SECTIONS.forEach((_, i) => {
        const vid = videoRefs.current[i];
        if (vid && vid.duration && !isNaN(vid.duration)) {
          const localProg = Math.min(1, Math.max(0, (prog - i * stageDuration) / stageDuration));
          const targetTime = localProg * (vid.duration - 0.04);
          if (!vid.seeking && Math.abs(vid.currentTime - targetTime) > 0.015) {
            try { vid.currentTime = targetTime; } catch(err) {}
          }
        }
      });
    };

    // 60FPS Lerp loop for creamy smooth momentum
    const tick = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0004) {
        currentProgressRef.current += diff * 0.09;
        updateStory(currentProgressRef.current);
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    const handleWheel = (e) => {
      const rect = el.getBoundingClientRect();
      const isAtStory = rect.top <= 80 && rect.bottom >= window.innerHeight * 0.4;
      
      if (isAtStory) {
        if (e.deltaY > 0 && targetProgressRef.current < 0.998) {
          e.preventDefault();
          const step = Math.min(0.022, Math.max(0.004, Math.abs(e.deltaY) * 0.00018));
          targetProgressRef.current = Math.min(1, targetProgressRef.current + step);
        } else if (e.deltaY < 0 && window.scrollY <= el.offsetTop + 20 && targetProgressRef.current > 0.002) {
          e.preventDefault();
          const step = Math.min(0.022, Math.max(0.004, Math.abs(e.deltaY) * 0.00018));
          targetProgressRef.current = Math.max(0, targetProgressRef.current - step);
        }
      }
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const rect = el.getBoundingClientRect();
      const isAtStory = rect.top <= 80 && rect.bottom >= window.innerHeight * 0.4;
      if (!isAtStory) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;
      touchStartY = currentY;

      if (deltaY > 0 && targetProgressRef.current < 0.998) {
        e.preventDefault();
        targetProgressRef.current = Math.min(1, targetProgressRef.current + 0.015);
      } else if (deltaY < 0 && window.scrollY <= el.offsetTop + 20 && targetProgressRef.current > 0.002) {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.015);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [N]);

  const currentSection = SECTIONS[activeIdx] || SECTIONS[0];
  const stageDuration = 1 / N;
  const currentStageLocalProgress = Math.min(1, Math.max(0, (storyProgress - activeIdx * stageDuration) / stageDuration));

  return (
    <div 
      ref={containerRef}
      className="relative w-full min-h-[92vh] lg:h-[94vh] bg-[#F5EDE0] text-[#241d2b] select-none font-sans rounded-3xl overflow-hidden shadow-xl border-2 border-[#E5D7C3] mb-12 flex flex-col justify-between p-6 sm:p-10"
      style={{
        '--sw-bg': '#F5EDE0',
        '--sw-ink': '#241d2b',
        '--sw-ink-soft': '#6a6072',
        '--sw-accent': currentSection.accent
      }}
    >
      {/* Top Story Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-[3.5px] bg-[#241d2b]/10 z-50">
        <div 
          className="h-full transition-all duration-100 ease-out origin-left"
          style={{ 
            width: `${Math.max(4, storyProgress * 100)}%`,
            backgroundColor: currentSection.accent 
          }}
        />
      </div>

      {/* Top Story Header */}
      <header className="relative z-40 flex items-center justify-between pb-3 pointer-events-auto border-b border-[#E5D7C3]/60">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs transition-colors duration-500"
            style={{ backgroundColor: currentSection.accent }}
          >
            <Heart className="w-4 h-4 fill-white/20" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#241d2b]">
              Gramin<span style={{ color: currentSection.accent }}>Health</span>
            </span>
          </div>
        </div>

        {/* Center Step Indicators */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-white/80 backdrop-blur-md rounded-full border border-black/10 text-xs font-semibold shadow-2xs">
          {SECTIONS.map((sec, i) => (
            <span
              key={sec.id}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
                i === activeIdx 
                  ? 'bg-[#241d2b] text-white shadow-xs' 
                  : 'text-[#6a6072]'
              }`}
            >
              0{i + 1}. {sec.label}
            </span>
          ))}
        </div>

        {/* Live Step Badge */}
        <div className="flex items-center gap-2 bg-white/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-black/10 text-xs font-bold text-[#241d2b] shadow-2xs">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: currentSection.accent }} />
          <span>0{activeIdx + 1} / 04</span>
        </div>
      </header>

      {/* Main Split-View: Left Story Narrative + Right Scrubbed Video Canvas */}
      <div className="relative flex-1 flex items-center justify-center py-4 my-auto">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Narrative Card */}
          <div className="lg:col-span-5 z-20 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-[#E5D7C3] shadow-xl space-y-4 relative overflow-hidden transition-all duration-300">
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 transition-colors duration-500"
                style={{ backgroundColor: currentSection.accent }}
              />

              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F5EDE0] text-[#6a6072] border border-[#E5D7C3]">
                  {`0${activeIdx + 1} / 04`}
                </span>
                <span 
                  className="text-[11px] font-black tracking-widest uppercase transition-colors duration-500"
                  style={{ color: currentSection.accent }}
                >
                  {currentSection.eyebrow}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#241d2b] leading-tight tracking-tight">
                {currentSection.title}
              </h2>

              <p className="text-xs sm:text-sm text-[#4a4055] leading-relaxed font-normal">
                {currentSection.body}
              </p>

              {/* Model AI Badge Box */}
              <div className="p-3 rounded-2xl bg-slatecalm-50 border border-[#E5D7C3] text-xs font-semibold text-slatecalm-800 flex items-center gap-2.5 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: currentSection.accent }} />
                <span><strong>AI Model:</strong> {currentSection.modelBadge}</span>
              </div>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                {currentSection.tags.map((t, i) => (
                  <span 
                    key={i}
                    className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#F5EDE0] border border-[#E5D7C3] text-[#241d2b]"
                  >
                    ✓ {t}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/triage"
                  className="px-6 py-3 bg-[#241d2b] hover:bg-black text-white font-bold text-xs rounded-full shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>Start Hindi Voice Triage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/clinics"
                  className="px-5 py-3 bg-[#F5EDE0] hover:bg-[#EFE5D5] text-[#241d2b] font-bold text-xs rounded-full border border-[#E5D7C3] transition-colors"
                >
                  Find Nearby PHC
                </Link>
              </div>

            </div>
          </div>

          {/* Right Scrubbed Video Canvas */}
          <div className="lg:col-span-7 flex items-center justify-center relative pointer-events-auto">
            <div className="relative w-full aspect-[3/2] max-w-[680px] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#E5D7C3] bg-[#241d2b] group">
              {SECTIONS.map((sec, idx) => {
                const isActive = idx === activeIdx;
                const isNextIncoming = idx === activeIdx + 1 && currentStageLocalProgress > 0.70;
                const opacity = isActive
                  ? (currentStageLocalProgress > 0.85 ? 1 - (currentStageLocalProgress - 0.85) * 6.5 : 1)
                  : (isNextIncoming ? (currentStageLocalProgress - 0.70) * 3.3 : 0);

                return (
                  <div 
                    key={sec.id}
                    className="absolute inset-0 transition-opacity duration-300 flex items-center justify-center bg-black"
                    style={{
                      opacity: opacity,
                      zIndex: isActive ? 20 : (isNextIncoming ? 25 : 10)
                    }}
                  >
                    <video 
                      ref={el => (videoRefs.current[idx] = el)}
                      src={sec.clip}
                      poster={sec.still}
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover object-center scale-[1.06] origin-center"
                      onError={(e) => {
                        if (e.target.src !== sec.clipAlt) {
                          e.target.src = sec.clipAlt;
                        }
                      }}
                    />
                  </div>
                );
              })}

              {/* Video Badge */}
              <div className="absolute top-3.5 right-3.5 z-30 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-white flex items-center gap-1.5 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>4K MODEL VIDEO</span>
              </div>

              {/* Bottom Right Watermark Shield */}
              <div className="absolute bottom-0 right-0 z-30 min-w-[175px] h-[52px] backdrop-blur-xl bg-gradient-to-br from-[#241d2b]/90 to-teal-800/80 rounded-tl-2xl border-t border-l border-white/25 flex items-center justify-center gap-2 text-white text-[10px] font-black tracking-widest pointer-events-none shadow-2xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span>GRAMINHEALTH AI</span>
              </div>

              {/* Bottom Dot Progress */}
              <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full pointer-events-none">
                {SECTIONS.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeIdx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Hint Banner */}
      <footer className="relative z-30 flex items-center justify-between pointer-events-auto pt-2 border-t border-[#E5D7C3]/60">
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#6a6072] uppercase tracking-widest bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-black/10 shadow-2xs">
          <span>{storyProgress < 0.98 ? 'Scroll on story to play scenes (Screen stays in place)' : 'Story complete! Scroll down to explore platform ↓'}</span>
          <span className="text-teal-700 font-black animate-bounce">↓</span>
        </div>

        <div className="text-[11px] font-bold text-[#6a6072]">
          Progress: {Math.round(storyProgress * 100)}%
        </div>
      </footer>

    </div>
  );
};

export default ContinuousDroneScrollJourney;
