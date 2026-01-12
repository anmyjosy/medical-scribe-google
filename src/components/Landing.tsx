
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
      <section id="about" className="py-24 px-6 md:px-20 bg-black relative z-10 border-t border-white/[0.03]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Reclaim Your <br />
                <span className="text-white/50">Clinical Time.</span>
              </h2>
              <div className="space-y-6 text-white/70 text-base md:text-lg leading-relaxed">
                <p>
                  Physician burnout is a reality we can't ignore. The administrative burden of documentation steals hours from patient care and personal time.
                </p>
                <p>
                  <strong className="text-white">MedScribe AI</strong> isn't just a transcription tool; it's an intelligent clinical partner. We instantly transform valid multi-lingual consultations into structured, professional medical records.
                </p>
                <p>
                  Our mission is simple: <span className="italic text-white/90">Let doctors be doctors.</span> We handle the paperwork so you can focus on healing.
                </p>
              </div>


            </div>

            {/* Decorative Image/Block for About */}
            <div className="flex-1 w-full relative">
              <div className="relative rounded-[40px] overflow-hidden border border-white/10 shadow-2xl shadow-black/50 group">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-white/5 transition-colors duration-300 z-10"></div>
                <img
                  src="/doc1.jpg"
                  alt="Doctor using MedScribe"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 md:px-20 bg-white/50 backdrop-blur-sm relative z-10 border-t border-black/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The Modern Clinical Stack</h2>
            <p className="text-black/40 text-base max-w-lg mx-auto leading-relaxed">
              Everything you need to modernize your practice, built into one seamless application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-[32px] bg-white border border-black/5 hover:border-black/10 hover:shadow-xl hover:shadow-black/[0.02] transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-3 tracking-tight">Multi-Lingual Intelligence</h3>
              <p className="text-sm text-black/50 leading-relaxed">
                Whether you speak English, Malayalam, or a mix of both, MedScribe understands. Our acoustic models are tuned for clinical environments.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-[32px] bg-white border border-black/5 hover:border-black/10 hover:shadow-xl hover:shadow-black/[0.02] transition-all duration-300">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-3 tracking-tight">Structured Clinical Notes</h3>
              <p className="text-sm text-black/50 leading-relaxed">
                We don't just transcribe; we organize. Get perfectly formatted medical records instantly ready for your EMR.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-[32px] bg-white border border-black/5 hover:border-black/10 hover:shadow-xl hover:shadow-black/[0.02] transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-3 tracking-tight">Interactive AI Chat</h3>
              <p className="text-sm text-black/50 leading-relaxed">
                Have a question about a patient's history? Just ask. Our RAG-enabled AI allows you to chat with your documents for instant recall.
              </p>
            </div>



          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 md:px-20 bg-[#FDFDFB] relative z-10 border-t border-black/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/[0.03] rounded-full">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Workflow</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Designed for Simplicity</h2>
            <p className="text-black/40 text-base max-w-lg mx-auto">
              A straightforward workflow designed to fit naturally into your practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-black/10 to-transparent border-t border-dashed border-black/20"></div>

            <div className="text-center space-y-6 relative z-10">
              <div className="w-24 h-24 bg-white border border-black/5 rounded-full flex items-center justify-center text-3xl font-bold mx-auto shadow-lg shadow-black/[0.02]">
                🎙️
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight">1. Record Consultation</h3>
                <p className="text-sm text-black/50 leading-relaxed max-w-xs mx-auto">
                  Simply hit record at the start of your visit. We capture audio securely in high fidelity.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6 relative z-10">
              <div className="w-24 h-24 bg-white border border-black/5 rounded-full flex items-center justify-center text-3xl font-bold mx-auto shadow-lg shadow-black/[0.02]">
                ⚡
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight">2. AI Processing</h3>
                <p className="text-sm text-black/50 leading-relaxed max-w-xs mx-auto">
                  Our engine splits speakers, transcribes text, and formats it into clinical notes in seconds.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6 relative z-10">
              <div className="w-24 h-24 bg-white border border-black/5 rounded-full flex items-center justify-center text-3xl font-bold mx-auto shadow-lg shadow-black/[0.02]">
                📋
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight">3. Review & Save</h3>
                <p className="text-sm text-black/50 leading-relaxed max-w-xs mx-auto">
                  Verify the generated notes, make quick edits if needed, and save to your patient history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>



      <footer className="px-6 md:px-10 py-6 md:py-12 flex flex-col md:flex-row justify-center items-center border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-white gap-6 shrink-0 bg-black">
        <p>© 2026 MedScribe</p>
      </footer>
    </div>
  );
};

export default Landing;
