
import React from 'react';

interface LandingProps {
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#FDFDFB] overflow-x-hidden">
      {/* Refined Navigation */}
      <header className="px-6 md:px-10 py-6 flex justify-between items-center z-50 shrink-0 sticky top-0 bg-transparent backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span className="text-lg font-extrabold tracking-tight uppercase">MedScribe</span>
        </div>
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-black/40 absolute left-1/2 -translate-x-1/2">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <a href="#about" className="hover:text-black transition-colors">About</a>
          <a href="#features" className="hover:text-black transition-colors">Features</a>
        </div>

        {/* Login Button */}
        <button
          onClick={onGetStarted}
          className="text-white text-[10px] md:text-xs font-bold px-5 py-2 md:px-6 md:py-2.5 bg-black hover:bg-black/5 hover:text-black transition-all rounded-full whitespace-nowrap"
        >
          LOGIN
        </button>
      </header>

      <main id="home" className="flex-col items-center justify-center md:justify-start px-6 pt-0 md:pt-12 pb-20 relative min-h-[90vh] flex flex-1">
        {/* Soft Background Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-2xl text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-black/5 rounded-full shadow-sm">
            <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Professional Clinical OS</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-[0.9] tracking-tighter">
            Elegance <br />
            <span className="text-black/20 italic font-medium">In Medicine.</span>
          </h1>

          <p className="text-sm md:text-base font-medium text-black/50 max-w-lg mx-auto leading-relaxed pt-2">
            The advanced AI scribe for the modern practitioner. We transform multi-lingual clinical dialogue into structured narratives instantly.
          </p>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-8 py-3.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-2xl shadow-black/10 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Get Started
            </button>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-3">
              <div className="w-8 h-px bg-black/20"></div>
              Clinical Precision
            </div>
          </div>
        </div>

        {/* Abstract Floating Elements */}
        <div className="hidden lg:block absolute left-20 bottom-40 w-40 h-40 bg-white border border-black/5 rounded-3xl rotate-12 animate-float shadow-xl shadow-black/[0.02]"></div>
        <div className="hidden lg:block absolute right-40 top-40 w-56 h-56 bg-white border border-black/5 rounded-[48px] -rotate-6 animate-float shadow-xl shadow-black/[0.02]" style={{ animationDelay: '1.5s' }}></div>
      </main>

      {/* About Us Section */}
      <section id="about" className="py-24 px-6 md:px-20 bg-[#FDFDFB] relative z-10 border-t border-black/[0.03]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">About MedScribe</h2>
          <div className="space-y-6">
            <p className="text-black/60 text-base md:text-lg leading-relaxed">
              MedScribe AI helps doctors focus on patients, not paperwork. Our intelligent scribe listens to your consultations and instantly creates accurate clinical notes. It's simple, secure, and designed to give you back your time.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 md:px-20 bg-white/50 backdrop-blur-sm relative z-10 border-t border-black/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">The Future of Documentation</h2>
            <p className="text-black/40 text-sm md:text-base max-w-lg mx-auto">
              Automate your workflow with precision tools designed for the modern clinic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature 1 */}
            <div className="group p-8 rounded-[32px] bg-white border border-black/5 hover:border-black/10 hover:shadow-2xl hover:shadow-black/[0.02] transition-all duration-500">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-3 tracking-tight">Multi-Lingual Transcription</h3>
              <p className="text-sm text-black/50 leading-relaxed">
                Capture consultations accurately in English and Malayalam. We listen so you don't have to.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-[32px] bg-white border border-black/5 hover:border-black/10 hover:shadow-2xl hover:shadow-black/[0.02] transition-all duration-500">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-3 tracking-tight">Instant Clinical Notes</h3>
              <p className="text-sm text-black/50 leading-relaxed">
                Automatically turn conversations into organized medical records. Save hours of typing every day.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-[32px] bg-white border border-black/5 hover:border-black/10 hover:shadow-2xl hover:shadow-black/[0.02] transition-all duration-500">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-3 tracking-tight">AI Assistant</h3>
              <p className="text-sm text-black/50 leading-relaxed">
                Chat with your patient files. Ask questions and find information instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 md:px-20 bg-[#FDFDFB] relative z-10 border-t border-black/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Simple Workflow</h2>
            <p className="text-black/40 text-sm md:text-base max-w-lg mx-auto">
              Three steps to a more efficient practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">1</div>
              <h3 className="text-lg font-bold tracking-tight">Record</h3>
              <p className="text-sm text-black/50 leading-relaxed max-w-xs mx-auto">
                Just press the button when you start your consultation.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">2</div>
              <h3 className="text-lg font-bold tracking-tight">Process</h3>
              <p className="text-sm text-black/50 leading-relaxed max-w-xs mx-auto">
                Our AI listens and formats the medical information instantly.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">3</div>
              <h3 className="text-lg font-bold tracking-tight">Done</h3>
              <p className="text-sm text-black/50 leading-relaxed max-w-xs mx-auto">
                Review your notes and save them. It's that easy.
              </p>
            </div>
          </div>
        </div>
      </section>



      <footer className="px-6 md:px-10 py-6 md:py-12 flex flex-col md:flex-row justify-center items-center border-t border-black/5 text-[10px] font-bold uppercase tracking-widest text-black/30 gap-6 shrink-0 bg-[#FDFDFB]">
        <p>© 2026 MedScribe</p>
      </footer>
    </div>
  );
};

export default Landing;
