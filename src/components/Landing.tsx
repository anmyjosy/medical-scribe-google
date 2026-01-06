
import React from 'react';

interface LandingProps {
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#FDFDFB]">
      {/* Refined Navigation */}
      <header className="px-6 md:px-10 py-4 md:py-8 flex justify-between items-center z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span className="text-lg font-extrabold tracking-tight uppercase">MedScribe</span>
        </div>
        <div className="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">
          {/* Links removed as requested */}
        </div>
        <button
          onClick={onGetStarted}
          className="text-white text-[10px] md:text-xs font-bold px-5 py-2 md:px-6 md:py-2.5 bg-black hover:bg-black/5 hover:text-black transition-all rounded-full whitespace-nowrap"
        >
          LOGIN
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">
        {/* Soft Background Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-2xl text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-black/5 rounded-full shadow-sm">
            <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Professional Clinical OS</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-[0.9] tracking-tighter">
            Elegance <br />
            <span className="text-black/20 italic font-medium">In Medicine.</span>
          </h1>

          <p className="text-sm md:text-base font-medium text-black/50 max-w-lg mx-auto leading-relaxed">
            The minimal AI scribe for the modern practitioner. We transform complex clinical dialogue into structured narratives instantly.
          </p>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="btn-nordic px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] shadow-2xl shadow-black/5"
            >
              Get Started
            </button>
            <div className="text-[11px] font-bold uppercase tracking-widest opacity-30 flex items-center gap-4">
              <div className="w-8 h-px bg-black/10"></div>
              Clinical Precision
            </div>
          </div>
        </div>

        {/* Abstract Floating Elements */}
        <div className="hidden lg:block absolute left-20 bottom-40 w-40 h-40 bg-white border border-black/5 rounded-3xl rotate-12 animate-float shadow-xl shadow-black/[0.02]"></div>
        <div className="hidden lg:block absolute right-40 top-40 w-56 h-56 bg-white border border-black/5 rounded-[48px] -rotate-6 animate-float shadow-xl shadow-black/[0.02]" style={{ animationDelay: '1.5s' }}></div>
      </main>

      <footer className="px-6 md:px-10 py-6 md:py-12 flex flex-col md:flex-row justify-between items-center border-t border-black/5 text-[10px] font-bold uppercase tracking-widest text-black/30 gap-6 shrink-0">
        <p>© 2024 MedScribe Nordic Studio</p>
        <div className="flex gap-10">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Security</a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
