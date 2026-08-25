
    const { useState, useEffect, useRef } = React;

    const CLINICS = [
      { id: 'phc-1', name: 'Sonapur Primary Health Centre (PHC)', type: '24x7 PHC', lat: 22.4286, lng: 87.3218, distance: '2.4 km', phone: '+91 3222 245100', beds: '5/12 Available', doctor: 'Dr. S. Mukherjee (MBBS)', open: true, badge: 'Recommended for Moderate Fever' },
      { id: 'chc-2', name: 'Rampur Community Health Centre (CHC)', type: 'CHC & Emergency', lat: 22.4820, lng: 87.3890, distance: '7.8 km', phone: '+91 3222 268210', beds: '11/30 Available', doctor: 'Dr. Ananya Roy (MD)', open: true, badge: 'Oxygen & Emergency Ready' },
      { id: 'sub-3', name: 'Haripur Health & Wellness Sub-Centre', type: 'Sub-Centre', lat: 22.3950, lng: 87.2750, distance: '4.1 km', phone: '+91 94340 11223', beds: '2/2 Available', doctor: 'Sister Rita Das (CHO)', open: true, badge: 'Routine Checkup & Meds' }
    ];

    const STORY_SECTIONS = [
      {
        id: 'voice',
        number: '01',
        title: 'Speak Symptoms in Hindi with Full Consent.',
        eyebrow: 'Step 01 • Voice-First Accessibility',
        body: 'Rural citizens describe symptoms naturally in Hindi. Audio is converted into structured clinical symptoms while ensuring zero personal identifiable data (PII) is stored.',
        model: 'Hindi Speech-to-Text & Clinical Entity Recognition (NER)',
        tags: ['Hindi Voice & Text Input', 'Speech to Structured Symptoms', 'Informed Patient Consent Active'],
        accent: '#0d9488',
        video: './assets/scene1_vdo.mp4',
        videoAlt: './public/assets/scene1_vdo.mp4',
        poster: './assets/scene1_voice_input.jpg'
      },
      {
        id: 'triage',
        number: '02',
        title: 'Safety-First Deterministic Urgency Triage.',
        eyebrow: 'Step 02 • Deterministic Rule Engine',
        body: 'We never guess diseases. A clinically reviewed rule engine classifies urgency into Emergency, Urgent, or Routine with a transparent "Not a Diagnosis" safety shield.',
        model: 'Clinically Reviewed 3-Tier Rule-Based Decision Logic',
        tags: ['🚨 Emergency / ⚠️ Urgent / 🟢 Routine', 'Red-Flag Symptom Filters', 'Clear "Not a Diagnosis" Notice'],
        accent: '#7c3aed',
        video: './assets/scene2_vdo.mp4',
        videoAlt: './public/assets/scene2_vdo.mp4',
        poster: './assets/scene2_triage.jpg'
      },
      {
        id: 'referral',
        number: '03',
        title: 'Know Exactly Where to Go: PHC, CHC, or Hospital.',
        eyebrow: 'Step 03 • Location-Based Referral',
        body: 'Matches patient severity to the nearest public healthcare tier based on live bed counts, on-duty doctors, and travel distance with turn-by-turn routing.',
        model: 'Geospatial Facility & Resource Routing Algorithm',
        tags: ['Nearby PHC / CHC / Hospital Locator', 'Urgency-Matched Facility Tier', 'Live Geospatial GPS Distance'],
        accent: '#0284c7',
        video: './assets/scene3_vdo.mp4',
        videoAlt: './public/assets/scene3_vdo.mp4',
        poster: './assets/scene3_referral.jpg'
      },
      {
        id: 'summary',
        number: '04',
        title: 'Bilingual Doctor Summary & Offline Cache.',
        eyebrow: 'Step 04 • Complete Care Pathway',
        body: 'Generates structured clinical dossiers in both Hindi and English for consultation readiness, with offline caching of symptom decision trees for low-connectivity zones.',
        model: 'Bilingual Clinical Report Synthesizer & Local Cache',
        tags: ['Bilingual Summary (Hindi & English)', 'Low-Connectivity Offline Cache', 'Doctor-Ready Consultation Notes'],
        accent: '#e11d48',
        video: './assets/scene4_vdo.mp4',
        videoAlt: './public/assets/scene4_vdo.mp4',
        poster: './assets/scene4_summary.jpg'
      }
    ];

    function App() {
      const [activeTab, setActiveTab] = useState('home'); // 'home' | 'triage' | 'clinics' | 'doctor' | 'sos'
      const [storyIdx, setStoryIdx] = useState(0);
      const [storyProgress, setStoryProgress] = useState(0);
      const [isPlayingAuto, setIsPlayingAuto] = useState(false);
      const [copied, setCopied] = useState(false);
      const [lang, setLang] = useState('hi');
      
      // Triage State
      const [isRecording, setIsRecording] = useState(false);
      const [consentGiven, setConsentGiven] = useState(true);
      const [selectedSymptoms, setSelectedSymptoms] = useState(['High Fever (>101°F)', 'Persistent Dry Cough for 3 Days']);
      const [triageResult, setTriageResult] = useState(null);

      const storyContainerRef = useRef(null);
      const videoRefs = useRef([]);
      const targetProgressRef = useRef(0);
      const currentProgressRef = useRef(0);
      const rafIdRef = useRef(null);

      // Smooth Lerp scroll-play story logic
      useEffect(() => {
        const el = storyContainerRef.current;
        if (!el || activeTab !== 'home') return;

        const updatePlayback = (p) => {
          const idx = Math.min(3, Math.floor(p * 4));
          setStoryIdx(idx);
          setStoryProgress(p);

          // Scrub active video with smooth precision
          const stageDuration = 0.25;
          [0, 1, 2, 3].forEach((i) => {
            const vid = videoRefs.current[i];
            if (vid && vid.duration && !isNaN(vid.duration)) {
              const localProg = Math.min(1, Math.max(0, (p - i * stageDuration) / stageDuration));
              const targetTime = localProg * (vid.duration - 0.04);
              if (!vid.seeking && Math.abs(vid.currentTime - targetTime) > 0.015) {
                try { vid.currentTime = targetTime; } catch (err) {}
              }
            }
          });
        };

        // 60FPS Lerp loop for buttery smooth gliding momentum
        const tick = () => {
          const diff = targetProgressRef.current - currentProgressRef.current;
          if (Math.abs(diff) > 0.0004) {
            currentProgressRef.current += diff * 0.09;
            updatePlayback(currentProgressRef.current);
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
              // Gentle, perfectly-paced scroll step (not fast)
              const step = Math.min(0.022, Math.max(0.004, Math.abs(e.deltaY) * 0.00018));
              targetProgressRef.current = Math.min(1, targetProgressRef.current + step);
            } else if (e.deltaY < 0 && window.scrollY <= el.offsetTop + 20 && targetProgressRef.current > 0.002) {
              e.preventDefault();
              const step = Math.min(0.022, Math.max(0.004, Math.abs(e.deltaY) * 0.00018));
              targetProgressRef.current = Math.max(0, targetProgressRef.current - step);
            }
          }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
          window.removeEventListener('wheel', handleWheel);
          if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
      }, [activeTab]);

      // Leaflet Map Initialization
      useEffect(() => {
        if ((activeTab === 'home' || activeTab === 'clinics') && window.L) {
          setTimeout(() => {
            const container = document.getElementById('map-container');
            if (container && !container._leaflet_id) {
              const map = L.map('map-container').setView([22.4350, 87.3300], 12);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
              }).addTo(map);

              CLINICS.forEach(c => {
                L.marker([c.lat, c.lng]).addTo(map)
                  .bindPopup(`
                    <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:4px;">
                      <h4 style="font-weight:bold;margin:0 0 4px;color:#241d2b;">${c.name}</h4>
                      <p style="margin:2px 0;font-size:12px;color:#6a6072;">Type: <b>${c.type}</b> (${c.distance} away)</p>
                      <p style="margin:2px 0;font-size:12px;color:#0d9488;">Doctor: <b>${c.doctor}</b></p>
                      <p style="margin:2px 0;font-size:12px;color:#241d2b;">Beds: <b>${c.beds}</b></p>
                      <a href="tel:${c.phone}" style="display:inline-block;margin-top:6px;background:#241d2b;color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;text-decoration:none;font-weight:bold;">Call PHC</a>
                    </div>
                  `);
              });
            }
          }, 250);
        }
      }, [activeTab]);

      const handleRunTriage = () => {
        const isEmergency = selectedSymptoms.some(s => s.toLowerCase().includes('chest') || s.toLowerCase().includes('breath'));
        if (isEmergency) {
          setTriageResult({
            tier: 'EMERGENCY',
            color: 'bg-rose-500 text-white',
            border: 'border-rose-300',
            bg: 'bg-rose-50',
            hindiBadge: '🚨 आपातकालीन (Emergency)',
            timeframe: 'Immediate Care (तत्काल ध्यान आवश्यक)',
            facility: 'Call 108 Ambulance / Nearest 24x7 District Hospital',
            doctorSummaryHindi: 'मरीज को पिछले 3 दिनों से तेज बुखार, सीने में भारीपन और सांस लेने में तकलीफ है। तत्काल ऑक्सीजन और ईसीजी की आवश्यकता है।',
            doctorSummaryEn: 'Patient presents with high-grade fever (3 days), chest tightness, and respiratory distress. Urgent SpO2 evaluation and ECG required.'
          });
        } else {
          setTriageResult({
            tier: 'URGENT',
            color: 'bg-amber-500 text-white',
            border: 'border-amber-300',
            bg: 'bg-amber-50',
            hindiBadge: '⚠️ त्वरित देखभाल (Urgent)',
            timeframe: 'Within 24–48 Hours (24-48 घंटे में)',
            facility: 'Sonapur Primary Health Centre (PHC) — 2.4 km away',
            doctorSummaryHindi: 'मरीज को 3 दिनों से लगातार तेज बुखार (>101°F) और सूखी खांसी है। प्राथमिक स्वास्थ्य केंद्र (PHC) में डॉक्टर परामर्श और पेरासिटामोल/हाइड्रेशन की सलाह दी गई है।',
            doctorSummaryEn: 'Persistent fever (>101°F) for 72 hours with dry cough. Recommended same-day OPD consultation at Sonapur PHC with hydration and antipyretic protocol.'
          });
        }
      };

      const copySummaryToClipboard = () => {
        const text = triageResult 
          ? `[GraminHealth Clinical Summary]\nTier: ${triageResult.tier}\nFacility: ${triageResult.facility}\nSummary (HI): ${triageResult.doctorSummaryHindi}\nSummary (EN): ${triageResult.doctorSummaryEn}`
          : 'GraminHealth Patient Summary';
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      const curStory = STORY_SECTIONS[storyIdx];

      return (
        <div className="min-h-screen flex flex-col bg-[#F5EDE0] text-[#241d2b]">
          
          {/* TOP EMERGENCY TICKER */}
          <div className="bg-[#241d2b] text-white text-xs px-4 sm:px-8 py-2 flex flex-wrap justify-between items-center gap-2 border-b border-black/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold tracking-wide">
                108 Emergency Ambulance Active • Deterministic Triage & Location Referral
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                ● Rural Offline Sync Ready
              </span>
              <span className="font-bold text-teal-300">
                Languages: हिंदी (Hindi) / English
              </span>
            </div>
          </div>

          {/* MAIN NAVBAR */}
          <header className="sticky top-0 z-40 bg-[#F5EDE0]/90 backdrop-blur-xl border-b border-[#E5D7C3] px-4 sm:px-8 py-3.5 shadow-xs">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              
              {/* Brand Logo */}
              <div 
                onClick={() => setActiveTab('home')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-[#241d2b] flex items-center justify-center text-white text-lg shadow-md group-hover:scale-105 transition-transform">
                  ❤️
                </div>
                <div>
                  <div className="font-extrabold text-lg sm:text-xl tracking-tight text-[#241d2b]">
                    Gramin<span className="text-teal-600">Health</span>
                  </div>
                  <div className="text-[10px] font-bold text-[#6a6072] -mt-1 tracking-wider uppercase">
                    Rural Medical Assistance
                  </div>
                </div>
              </div>

              {/* Center Navigation Links */}
              <nav className="hidden md:flex items-center gap-1.5 p-1 bg-white/80 rounded-full border border-[#E5D7C3] shadow-xs text-xs font-bold">
                {[
                  { id: 'home', label: 'Platform Story' },
                  { id: 'triage', label: 'Voice Triage' },
                  { id: 'clinics', label: 'Nearby PHC / CHC' },
                  { id: 'doctor', label: 'Doctor Dossier' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-4 py-2 rounded-full transition-all ${
                      activeTab === item.id 
                        ? 'bg-[#241d2b] text-white shadow-xs' 
                        : 'text-[#6a6072] hover:text-[#241d2b] hover:bg-black/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Right SOS Trigger */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveTab('sos')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-full shadow-md hover:scale-105 active:scale-95 transition flex items-center gap-1.5 animate-pulse"
                >
                  <span>🚨 108 SOS</span>
                </button>
              </div>

            </div>
          </header>

          {/* MAIN PAGE BODY */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-16">
            
            {/* VIEW 1: HOME PLATFORM STORY + LANDING PATHWAY */}
            {activeTab === 'home' && (
              <div className="space-y-16">
                
                {/* 1. IMMERSIVE PINNED VIDEO STORY HERO */}
                <div 
                  ref={storyContainerRef}
                  className="relative w-full min-h-[90vh] lg:h-[92vh] bg-[#FCF8F2] rounded-[32px] border-2 border-[#E5D7C3] shadow-clay-lg flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden select-none"
                >
                  {/* Top Story Timeline Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#241d2b]/10 z-50">
                    <div 
                      className="h-full transition-all duration-150 ease-out"
                      style={{ 
                        width: `${Math.max(5, storyProgress * 100)}%`, 
                        backgroundColor: curStory.accent 
                      }}
                    />
                  </div>

                  {/* Hero Header bar */}
                  <div className="relative z-30 flex items-center justify-between pb-3 border-b border-[#E5D7C3]/80">
                    <div className="flex items-center gap-3">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-mono font-bold text-white shadow-xs transition-colors duration-500"
                        style={{ backgroundColor: curStory.accent }}
                      >
                        {curStory.number} / 04
                      </span>
                      <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#241d2b]">
                        Interactive Care Pathway Story
                      </span>
                    </div>

                    {/* Step pills */}
                    <div className="hidden sm:flex items-center gap-1.5 p-1 bg-[#F5EDE0] rounded-full border border-[#E5D7C3] text-xs font-bold">
                      {STORY_SECTIONS.map((s, i) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setStoryIdx(i);
                            setStoryProgress(i * 0.25 + 0.05);
                          }}
                          className={`px-3 py-1 rounded-full transition-all ${
                            storyIdx === i ? 'bg-[#241d2b] text-white shadow-xs' : 'text-[#6a6072] hover:text-[#241d2b]'
                          }`}
                        >
                          0{i + 1}. {s.eyebrow.split('• ')[1]}
                        </button>
                      ))}
                    </div>

                    <div className="text-[11px] font-bold text-[#6a6072] uppercase tracking-widest bg-[#F5EDE0] px-3.5 py-1.5 rounded-full border border-[#E5D7C3]">
                      Scroll on story to fly ↓
                    </div>
                  </div>

                  {/* Main Split: Left Copy Narrative + Right 4K Scrubbed Video */}
                  <div className="relative flex-1 flex items-center justify-center py-6 my-auto">
                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                      
                      {/* Left Narrative Card */}
                      <div className="lg:col-span-5 space-y-4">
                        <div 
                          className="inline-block text-xs font-black tracking-widest uppercase"
                          style={{ color: curStory.accent }}
                        >
                          {curStory.eyebrow}
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#241d2b] leading-[1.06] tracking-tight">
                          {curStory.title}
                        </h1>

                        <p className="text-sm sm:text-base text-[#4a4055] leading-relaxed">
                          {curStory.body}
                        </p>

                        {/* Model AI Badge */}
                        <div className="p-3 rounded-2xl bg-white border border-[#E5D7C3] shadow-xs flex items-center gap-3 text-xs font-bold text-[#241d2b]">
                          <span className="w-3 h-3 rounded-full shrink-0 animate-ping" style={{ backgroundColor: curStory.accent }} />
                          <span>AI Engine: {curStory.model}</span>
                        </div>

                        {/* Feature Tags */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {curStory.tags.map((tag, i) => (
                            <span 
                              key={i} 
                              className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#E5D7C3] text-[#241d2b]"
                            >
                              ✓ {tag}
                            </span>
                          ))}
                        </div>

                        {/* Action CTA */}
                        <div className="pt-3 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => setActiveTab('triage')}
                            className="px-6 py-3 bg-[#241d2b] hover:bg-black text-white font-bold text-xs rounded-full shadow-md hover:scale-105 active:scale-95 transition"
                          >
                            Start Hindi Voice Triage →
                          </button>
                          <button
                            onClick={() => setActiveTab('clinics')}
                            className="px-5 py-3 bg-white hover:bg-[#F5EDE0] text-[#241d2b] font-bold text-xs rounded-full border border-[#E5D7C3] transition"
                          >
                            Find Nearby PHC
                          </button>
                        </div>
                      </div>

                      {/* Right Video Canvas */}
                      <div className="lg:col-span-7 flex items-center justify-center">
                        <div className="relative w-full aspect-[3/2] max-w-[680px] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#E5D7C3] bg-black group">
                          {STORY_SECTIONS.map((sec, idx) => (
                            <div 
                              key={sec.id}
                              className={`absolute inset-0 transition-opacity duration-500 flex items-center justify-center ${
                                storyIdx === idx ? 'opacity-100 z-20' : 'opacity-0 z-10 pointer-events-none'
                              }`}
                            >
                              <video 
                                ref={el => (videoRefs.current[idx] = el)}
                                src={sec.video}
                                poster={sec.poster}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover object-center"
                                onError={(e) => {
                                  if (e.target.src !== sec.videoAlt) e.target.src = sec.videoAlt;
                                }}
                              />
                            </div>
                          ))}

                          {/* 4K Model Video Badge */}
                          <div className="absolute top-4 right-4 z-30 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-mono font-bold text-white flex items-center gap-2 pointer-events-none">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>LIVE SCROLL SCRUBBING</span>
                          </div>

                          {/* Step Dots */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full pointer-events-none">
                            {STORY_SECTIONS.map((_, i) => (
                              <div 
                                key={i}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  i === storyIdx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Story Footer Controller */}
                  <div className="relative z-30 flex items-center justify-between pt-3 border-t border-[#E5D7C3]/80 text-xs font-bold text-[#6a6072]">
                    <div>
                      {storyProgress < 0.98 ? (
                        <span>✨ Scroll mouse wheel on story to scrub video frames</span>
                      ) : (
                        <span className="text-emerald-700 font-extrabold">🎉 All 4 stages complete! Scroll down to explore full platform ↓</span>
                      )}
                    </div>
                    <div>
                      Care Pathway Progress: {Math.round(storyProgress * 100)}%
                    </div>
                  </div>

                </div>

                {/* 2. PROMINENT "NOT A MEDICAL DIAGNOSIS" CLINICAL SAFETY BANNER */}
                <div className="bg-amber-50/90 border-2 border-amber-300/90 rounded-3xl p-6 sm:p-8 shadow-clay flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 text-2xl font-bold shadow-xs">
                      🛡️
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-amber-950 uppercase tracking-wider">
                          Important Clinical Safety Notice • महत्वपूर्ण सुरक्षा सूचना
                        </span>
                        <span className="bg-amber-200 text-amber-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                          Not a Medical Diagnosis
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-900/90 mt-1.5 leading-relaxed max-w-4xl">
                        GraminHealth is a <strong>voice-first triage and referral assistant</strong>. It categorizes clinical urgency (Emergency, Urgent, Routine) and directs patients to nearby public healthcare facilities (Sub-Centres, PHCs, CHCs). It <strong>never guesses diseases</strong> or replaces an examination by a registered medical officer.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('triage')}
                    className="px-6 py-3 bg-[#241d2b] hover:bg-black text-white font-bold text-xs rounded-full shadow-md shrink-0 transition"
                  >
                    Start Triage →
                  </button>
                </div>

                {/* 3. THE 3 CORE QUESTIONS OUR SYSTEM ANSWERS */}
                <div className="space-y-6">
                  <div className="text-center max-w-3xl mx-auto space-y-2">
                    <span className="text-xs font-black tracking-widest text-teal-700 uppercase bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
                      Core Value Proposition
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#241d2b] tracking-tight">
                      Instead of "What disease do I have?", We Answer 3 Real Needs
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Card 1 */}
                    <div className="bg-[#FCF8F2] p-6 sm:p-8 rounded-3xl border-2 border-rose-200 shadow-clay space-y-3 relative overflow-hidden">
                      <div className="text-xs font-mono font-bold text-rose-600">QUESTION 01</div>
                      <h3 className="text-xl font-extrabold text-[#241d2b] leading-tight">
                        How urgently should I seek care?
                      </h3>
                      <div className="text-xs font-semibold text-[#6a6072] italic">
                        मुझे कितनी जल्दी इलाज की आवश्यकता है?
                      </div>
                      <p className="text-xs sm:text-sm text-[#4a4055] leading-relaxed pt-1">
                        Clinically reviewed rule engine classifies your symptoms into 🚨 Emergency (Immediate), ⚠️ Urgent (24-48 hrs), or 🟢 Routine (3-7 days).
                      </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#FCF8F2] p-6 sm:p-8 rounded-3xl border-2 border-teal-200 shadow-clay space-y-3 relative overflow-hidden">
                      <div className="text-xs font-mono font-bold text-teal-600">QUESTION 02</div>
                      <h3 className="text-xl font-extrabold text-[#241d2b] leading-tight">
                        Where should I go?
                      </h3>
                      <div className="text-xs font-semibold text-[#6a6072] italic">
                        मुझे किस स्वास्थ्य केंद्र जाना चाहिए?
                      </div>
                      <p className="text-xs sm:text-sm text-[#4a4055] leading-relaxed pt-1">
                        Location-based routing matching severity to the appropriate facility: Village Sub-Centre, 24x7 PHC, CHC, or District Hospital.
                      </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#FCF8F2] p-6 sm:p-8 rounded-3xl border-2 border-purple-200 shadow-clay space-y-3 relative overflow-hidden">
                      <div className="text-xs font-mono font-bold text-purple-600">QUESTION 03</div>
                      <h3 className="text-xl font-extrabold text-[#241d2b] leading-tight">
                        What info should I give the doctor?
                      </h3>
                      <div className="text-xs font-semibold text-[#6a6072] italic">
                        डॉक्टर को क्या जानकारी देनी चाहिए?
                      </div>
                      <p className="text-xs sm:text-sm text-[#4a4055] leading-relaxed pt-1">
                        Generates a structured, doctor-ready patient clinical summary in both Hindi and English with timelines, saving precious OPD consultation time.
                      </p>
                    </div>

                  </div>
                </div>

                {/* 4. 3-TIER URGENCY PROTOCOL MATRIX */}
                <div className="bg-[#FCF8F2] p-6 sm:p-8 rounded-3xl border border-[#E5D7C3] shadow-clay space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#241d2b]">
                        Deterministic 3-Tier Clinical Urgency Matrix
                      </h3>
                      <p className="text-xs sm:text-sm text-[#6a6072]">
                        Transparent, deterministic clinical classification protocol
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-bold border border-[#E5D7C3]">
                      Standardized Clinical Guidelines
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Tier 1: Emergency */}
                    <div className="bg-rose-50/70 border-2 border-rose-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-rose-600 text-white font-extrabold text-xs rounded-full">
                          🚨 Emergency (तत्काल)
                        </span>
                        <span className="text-[11px] font-bold text-rose-800">Immediate Attention</span>
                      </div>
                      <p className="text-xs text-rose-950 font-medium">
                        <strong>Triggers:</strong> Severe chest pain, breathlessness (SpO2 &lt; 92%), sudden unconsciousness, uncontrollable bleeding.
                      </p>
                      <div className="pt-2 border-t border-rose-200 text-xs font-bold text-rose-900">
                        Action: Call 108 Ambulance / Go immediately to 24x7 District Hospital or CHC.
                      </div>
                    </div>

                    {/* Tier 2: Urgent */}
                    <div className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-amber-600 text-white font-extrabold text-xs rounded-full">
                          ⚠️ Urgent (त्वरित)
                        </span>
                        <span className="text-[11px] font-bold text-amber-800">Within 24–48 Hours</span>
                      </div>
                      <p className="text-xs text-amber-950 font-medium">
                        <strong>Triggers:</strong> High fever &gt; 102°F lasting 3+ days, localized acute abdominal pain, severe dehydration.
                      </p>
                      <div className="pt-2 border-t border-amber-200 text-xs font-bold text-amber-900">
                        Action: Visit nearest 24x7 Primary Health Centre (PHC) or CHC.
                      </div>
                    </div>

                    {/* Tier 3: Routine */}
                    <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-full">
                          🟢 Routine (सामान्य)
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800">Within 3–7 Days</span>
                      </div>
                      <p className="text-xs text-emerald-950 font-medium">
                        <strong>Triggers:</strong> Mild common cold, mild cough, minor rash, routine antenatal checkup, medication refills.
                      </p>
                      <div className="pt-2 border-t border-emerald-200 text-xs font-bold text-emerald-900">
                        Action: Visit Village Sub-Centre, consult ASHA worker, or schedule Tele-OPD.
                      </div>
                    </div>

                  </div>
                </div>

                {/* 5. GEOSPATIAL MAP CARD */}
                <div className="bg-[#FCF8F2] p-6 sm:p-8 rounded-3xl border border-[#E5D7C3] shadow-clay space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#241d2b]">
                        Live Rural Healthcare Facility Network
                      </h3>
                      <p className="text-xs sm:text-sm text-[#6a6072]">
                        Real-time distance, doctor availability, and bed counts for Sub-Centres, PHCs, and CHCs
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('clinics')}
                      className="px-4 py-2 bg-[#241d2b] text-white text-xs font-bold rounded-full shadow-xs"
                    >
                      View All Facilities →
                    </button>
                  </div>

                  <div id="map-container" className="shadow-md border border-[#E5D7C3]"></div>
                </div>

              </div>
            )}

            {/* VIEW 2: VOICE TRIAGE PORTAL */}
            {activeTab === 'triage' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="text-center space-y-2">
                  <span className="text-xs font-black tracking-widest text-teal-700 uppercase bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    Voice & Text Input
                  </span>
                  <h2 className="text-3xl font-black text-[#241d2b]">
                    Hindi Voice Symptom Capture & Triage
                  </h2>
                  <p className="text-sm text-[#6a6072]">
                    Speak your symptoms naturally in Hindi. We do not diagnose diseases; we assess urgency and guide your referral.
                  </p>
                </div>

                {/* Consent & Privacy Notice */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5D7C3] shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="consent-check"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <label htmlFor="consent-check" className="text-xs font-bold text-[#241d2b] cursor-pointer">
                      I consent to voice symptom extraction for urgency classification. I understand this is not a medical diagnosis.
                    </label>
                  </div>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 shrink-0">
                    🔒 Zero PII Stored
                  </span>
                </div>

                {/* Voice Recording Card */}
                <div className="bg-[#FCF8F2] p-8 rounded-3xl border-2 border-[#E5D7C3] shadow-clay text-center space-y-6">
                  
                  {/* Waveform / Mic */}
                  <div className="flex flex-col items-center justify-center gap-4">
                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all duration-300 ${
                        isRecording 
                          ? 'bg-rose-600 text-white scale-110 animate-pulse ring-8 ring-rose-200' 
                          : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-105'
                      }`}
                    >
                      {isRecording ? '⏹' : '🎙️'}
                    </button>
                    <div>
                      <div className="font-extrabold text-base text-[#241d2b]">
                        {isRecording ? 'Listening in Hindi... (बोलिए)' : 'Tap Microphone to Speak Symptoms'}
                      </div>
                      <div className="text-xs text-[#6a6072]">
                        Example: "मुझे 3 दिन से तेज बुखार है और सूखी खांसी आ रही है"
                      </div>
                    </div>
                  </div>

                  {/* Symptom Checkboxes */}
                  <div className="text-left space-y-2 pt-4 border-t border-[#E5D7C3]">
                    <div className="text-xs font-bold text-[#241d2b] uppercase tracking-wider">
                      Select / Extracted Symptoms:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'High Fever (>101°F)',
                        'Persistent Dry Cough for 3 Days',
                        'Chest Tightness / Breathlessness',
                        'Acute Abdominal Pain',
                        'Mild Cold & Sore Throat'
                      ].map((sym) => {
                        const isChecked = selectedSymptoms.includes(sym);
                        return (
                          <button
                            key={sym}
                            onClick={() => {
                              if (isChecked) setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
                              else setSelectedSymptoms([...selectedSymptoms, sym]);
                            }}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                              isChecked
                                ? 'bg-[#241d2b] text-white shadow-xs'
                                : 'bg-white text-[#4a4055] border border-[#E5D7C3] hover:bg-[#F5EDE0]'
                            }`}
                          >
                            {isChecked ? '✓ ' : '+ '}{sym}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Run Triage Button */}
                  <button
                    onClick={handleRunTriage}
                    disabled={!consentGiven}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition"
                  >
                    Run Safety-First Urgency Triage →
                  </button>

                </div>

                {/* Triage Output Card */}
                {triageResult && (
                  <div className={`p-8 rounded-3xl border-2 ${triageResult.border} ${triageResult.bg} shadow-clay-lg space-y-6 animate-in fade-in duration-300`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <span className={`px-4 py-1.5 rounded-full font-black text-sm ${triageResult.color}`}>
                        {triageResult.hindiBadge}
                      </span>
                      <span className="font-bold text-xs text-[#241d2b]">
                        Timeframe: <strong>{triageResult.timeframe}</strong>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#6a6072] uppercase">Recommended Healthcare Facility:</div>
                      <div className="text-lg font-black text-[#241d2b]">
                        📍 {triageResult.facility}
                      </div>
                    </div>

                    {/* Bilingual Doctor Summary */}
                    <div className="bg-white p-6 rounded-2xl border border-[#E5D7C3] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-[#241d2b] uppercase tracking-wider">
                          Doctor-Ready Clinical Summary (हिंदी / English)
                        </span>
                        <button
                          onClick={copySummaryToClipboard}
                          className="px-3 py-1 bg-[#241d2b] hover:bg-black text-white text-xs font-bold rounded-full transition"
                        >
                          {copied ? '✓ Copied!' : '📋 Copy for Doctor'}
                        </button>
                      </div>

                      <div className="space-y-3 text-xs leading-relaxed text-[#241d2b]">
                        <div className="p-3 bg-[#F5EDE0] rounded-xl border border-[#E5D7C3]">
                          <strong>हिंदी सारांश (Hindi):</strong> {triageResult.doctorSummaryHindi}
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <strong>English Summary:</strong> {triageResult.doctorSummaryEn}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* VIEW 3: CLINICS LOCATOR */}
            {activeTab === 'clinics' && (
              <div className="space-y-8 max-w-5xl mx-auto">
                <div className="text-center space-y-2">
                  <span className="text-xs font-black tracking-widest text-teal-700 uppercase bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    Geospatial Routing
                  </span>
                  <h2 className="text-3xl font-black text-[#241d2b]">
                    Nearby Public Healthcare Facilities
                  </h2>
                  <p className="text-sm text-[#6a6072]">
                    Sub-Centres, 24x7 Primary Health Centres (PHC), and Community Health Centres (CHC)
                  </p>
                </div>

                <div id="map-container" className="shadow-clay border-2 border-[#E5D7C3]"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {CLINICS.map((c) => (
                    <div key={c.id} className="bg-[#FCF8F2] p-6 rounded-3xl border border-[#E5D7C3] shadow-clay space-y-3">
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 inline-block">
                        {c.type} • {c.distance}
                      </span>
                      <h4 className="font-extrabold text-base text-[#241d2b] leading-tight">
                        {c.name}
                      </h4>
                      <p className="text-xs text-[#6a6072]">
                        Doctor: <strong>{c.doctor}</strong><br/>
                        Beds: <strong>{c.beds}</strong>
                      </p>
                      <a
                        href={`tel:${c.phone}`}
                        className="block w-full text-center py-2.5 bg-[#241d2b] hover:bg-black text-white font-bold text-xs rounded-full shadow-xs transition"
                      >
                        Call: {c.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: DOCTOR DOSSIER */}
            {activeTab === 'doctor' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-3xl border-2 border-[#E5D7C3] shadow-clay-lg space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E5D7C3] pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-teal-700">ABDM CLINICAL SUMMARY</span>
                      <h3 className="text-2xl font-black text-[#241d2b]">Doctor-Ready Patient Dossier</h3>
                    </div>
                    <button
                      onClick={() => alert('PDF Summary Downloaded for Doctor!')}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-full shadow-xs"
                    >
                      📥 Download PDF
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-[#F5EDE0] rounded-2xl border border-[#E5D7C3]">
                      <strong>Patient Input Method:</strong> Hindi Voice Capture (Dialect Extracted)<br/>
                      <strong>Consent Status:</strong> Verified & Timestamps Attached<br/>
                      <strong>Triage Tier:</strong> ⚠️ Urgent (24-48 hr OPD Protocol)
                    </div>
                    <div className="p-4 bg-[#F5EDE0] rounded-2xl border border-[#E5D7C3]">
                      <strong>Referred PHC:</strong> Sonapur Primary Health Centre (2.4 km)<br/>
                      <strong>Chief Complaint:</strong> High Fever & Dry Cough (3 Days)<br/>
                      <strong>Vitals Flag:</strong> SpO2: 96% | Pulse: 88 bpm
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs leading-relaxed space-y-2">
                    <div className="font-bold text-slate-900">Clinical Narrative for Medical Officer:</div>
                    <p className="text-slate-700">
                      Patient reported a 3-day history of high fever (>101°F) accompanied by dry non-productive cough. No red-flag respiratory distress (SpO2 > 95%) or acute chest tightness observed. Triage classifies as Urgent (24-48 hr window). Recommended evaluation: CBC / MP test for fever workup and hydration therapy.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: EMERGENCY SOS */}
            {activeTab === 'sos' && (
              <div className="max-w-2xl mx-auto bg-rose-50 border-4 border-rose-400 p-8 rounded-3xl shadow-2xl text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center text-4xl mx-auto animate-bounce shadow-xl">
                  🚨
                </div>
                <h2 className="text-3xl font-black text-rose-950">
                  National Emergency SOS (108 Ambulance)
                </h2>
                <p className="text-sm text-rose-900 leading-relaxed font-medium">
                  If the patient is unconscious, struggling to breathe, or experiencing severe chest pain, immediately call 108.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                  <a
                    href="tel:108"
                    className="w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-base rounded-full shadow-lg transition animate-pulse"
                  >
                    📞 Call 108 Ambulance Now
                  </a>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="w-full sm:w-auto px-6 py-4 bg-white text-rose-900 font-bold text-xs rounded-full border border-rose-300"
                  >
                    Back to Platform
                  </button>
                </div>
              </div>
            )}

          </main>

          {/* FOOTER */}
          <footer className="bg-[#241d2b] text-white/80 py-10 px-4 sm:px-8 mt-16 border-t border-black/20 text-xs">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
                  ❤️
                </div>
                <div>
                  <span className="font-extrabold text-white text-sm">GraminHealth</span>
                  <p className="text-[10px] text-white/60">Voice-First Rural Healthcare Triage & Facility Referral</p>
                </div>
              </div>

              <div className="text-center md:text-right text-[11px] text-white/60">
                ⚠️ Safety Notice: GraminHealth is not a diagnostic tool. Follow instructions of registered medical officers.
              </div>
            </div>
          </footer>

        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  