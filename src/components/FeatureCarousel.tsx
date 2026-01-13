import React, { useState, useEffect } from 'react';
import { Mic, FileText, BrainCircuit, ShieldCheck, ChevronRight, ChevronLeft, PlusCircle, User, Stethoscope } from 'lucide-react';

const slides = [
    {
        id: 1,
        title: "1. New Session",
        desc: "Click 'New Session' to start. This is your first step to creating a clean, organized medical record.",
        icon: <PlusCircle size={48} className="text-white" />,
        bg: "bg-gray-600"
    },
    {
        id: 2,
        title: "2. Patient Details",
        desc: "Fill in the essential patient details. Accurate data ensures precise AI documentation.",
        icon: <User size={48} className="text-white" />,
        bg: "bg-slate-700"
    },
    {
        id: 3,
        title: "3. Capture Audio",
        desc: "Start Recording live or Upload an existing audio file to capture the consultation.",
        icon: <Mic size={48} className="text-white" />,
        bg: "bg-blue-600"
    },
    {
        id: 4,
        title: "4. Chat with AI",
        desc: "Interact with the AI. Ask questions, retrieve history, or clarify medical details instantly.",
        icon: <BrainCircuit size={48} className="text-white" />,
        bg: "bg-purple-600"
    },
    {
        id: 5,
        title: "5. Prescription",
        desc: "Auto-generate a professional prescription based on the consultation transcript.",
        icon: <Stethoscope size={48} className="text-white" />,
        bg: "bg-emerald-600"
    },
    {
        id: 6,
        title: "6. Digital Forms",
        desc: "Upload external digital forms (PDF/DOCX) to attach them to the patient's record.",
        icon: <FileText size={48} className="text-white" />,
        bg: "bg-orange-500"
    }
];

export const FeatureCarousel = () => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const next = () => setCurrent((prev) => (prev + 1) % slides.length);
    const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-200 aspect-[4/5] md:aspect-square group">
            {/* Slides */}
            <div
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${current * 100}%)` }}
            >
                {slides.map((slide) => (
                    <div key={slide.id} className={`w-full h-full flex-shrink-0 flex flex-col items-center justify-center p-8 md:p-12 text-center ${slide.bg} relative`}>
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/30">
                            {slide.icon}
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">{slide.title}</h3>
                        <p className="text-white/80 font-medium text-sm md:text-base leading-relaxed max-w-xs">
                            {slide.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-2 z-10">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`transition-all duration-300 rounded-full ${current === i ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`}
                    />
                ))}
            </div>

            {/* Arrows (Visible on hover) */}
            <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"
            >
                <ChevronLeft size={20} />
            </button>
            <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
};
