'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Calendar, Clock, ChevronRight, Mic, Play, Pause, Square, FileText, ChevronDown, Trash2, Edit2, LogOut, Menu, X, ExternalLink, Sparkles, AlertCircle, Upload, File, MoreVertical, Check, Loader2 } from 'lucide-react';
import { View, User, AuthState, MedicalNote, Patient, PrefilledPatientData } from '@/types';
import Landing from '@/components/Landing';
import Auth from '@/components/Auth';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';
import ScribeSession from '@/components/ScribeSession';
import { supabase } from '@/lib/supabaseClient';
import { uploadPatientFile, deletePatientFile, getPatientFiles } from '@/services/fileUploadService';
import TourGuide from '@/components/TourGuide';
import { processConsultation, generateKeyInsights } from '@/services/aiService';

export default function Home() {
    const [currentView, setCurrentView] = useState<View>(View.LANDING);
    const viewRef = useRef(currentView);

    // Sync ref with state
    useEffect(() => {
        viewRef.current = currentView;
    }, [currentView]);

    // Handle Browser History
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (currentView === View.SCRIBE) {
                setPreselectedPatientData(null);
                setCurrentView(View.DASHBOARD);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [currentView]);

    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false
    });
    const [patients, setPatients] = useState<Patient[]>([]);

    const [preselectedPatientData, setPreselectedPatientData] = useState<PrefilledPatientData | null>(null);
    const [defaultPatientId, setDefaultPatientId] = useState<string | null>(null);
    const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
    const [isPatientSelected, setIsPatientSelected] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // New States for Background Processing
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false);

    // Load Patients from Supabase
    const fetchPatients = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('Fetching patients for user:', user.id);

        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*, consultations(*)')
                .eq('user_id', user.id)
                .order('last_seen', { ascending: false });

            if (error) {
                console.error('Error fetching patients:', error);
            } else {
                const formattedPatients = await Promise.all((data as any[]).map(async p => {
                    const files = await getPatientFiles(p.id);

                    return {
                        ...p,
                        lastSeen: p.last_seen,
                        bloodGroup: p.blood_group,
                        language: p.language,
                        files: files,
                        consultations: (p.consultations || []).map((c: any) => ({
                            ...c,
                            keyInsights: c.key_insights,
                            rawTranscript: c.raw_transcript,
                            audioUrl: c.audio_url,
                            prescription: typeof c.prescription === 'string' ? JSON.parse(c.prescription) : c.prescription,
                        })).sort((a: MedicalNote, b: MedicalNote) => {
                            return new Date(b.date).getTime() - new Date(a.date).getTime();
                        })
                    };
                }));
                setPatients(formattedPatients);
            }
        } catch (error) {
            console.error("Unexpected error loading patients:", error);
        } finally {
            setIsDataLoaded(true);
        }
    };

    // Auth & Init
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const user: User = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Clinician',
                    specialty: session.user.user_metadata.specialty,
                    country: session.user.user_metadata.country
                };
                setAuthState({ user, isAuthenticated: true });

                if (currentView === View.LANDING) {
                    if (!user.specialty || !user.country || user.name === 'Clinician') {
                        setCurrentView(View.ONBOARDING);
                    } else {
                        setCurrentView(View.DASHBOARD);
                        fetchPatients();
                    }
                }
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                const user: User = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Clinician',
                    specialty: session.user.user_metadata.specialty,
                    country: session.user.user_metadata.country
                };
                setAuthState({ user, isAuthenticated: true });

                if (viewRef.current === View.LANDING || viewRef.current === View.AUTH) {
                    if (!user.specialty || !user.country || user.name === 'Clinician') {
                        setCurrentView(View.ONBOARDING);
                    } else {
                        setCurrentView(View.DASHBOARD);
                        fetchPatients();
                    }
                }
            } else {
                setAuthState({ user: null, isAuthenticated: false });
                setCurrentView(View.LANDING);
                setPatients([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleOnboardingComplete = async (data: { name: string; specialty: string; country: string }) => {
        try {
            if (!authState.user) return;

            const { error } = await supabase.auth.updateUser({
                data: {
                    name: data.name,
                    specialty: data.specialty,
                    country: data.country
                }
            });

            if (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile. Please try again.');
                return;
            }

            const { error: dbError } = await supabase
                .from('doctors')
                .upsert({
                    id: authState.user.id,
                    email: authState.user.email,
                    name: data.name,
                    specialty: data.specialty,
                    country: data.country
                }, { onConflict: 'id' });

            if (dbError) {
                console.error('Error saving doctor profile to DB:', dbError);
            }

            setAuthState(prev => ({
                ...prev,
                user: prev.user ? { ...prev.user, ...data } : null
            }));

            setCurrentView(View.DASHBOARD);
            fetchPatients();

        } catch (error) {
            console.error('Onboarding Error:', error);
        }
    };

    // Main Save Logic
    const handleSaveNote = async (note: MedicalNote, audioBlob?: Blob) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Error: No active user session found. Please login again.');
                return;
            }

            // 1. Upload Audio
            let audioUrl = '';
            if (audioBlob) {
                const fileName = `${user.id}/${Date.now()}.webm`;
                const { error: uploadError } = await supabase.storage
                    .from('consultation-audio')
                    .upload(fileName, audioBlob);

                if (uploadError) {
                    console.error('Audio upload failed:', uploadError);
                } else {
                    const { data } = await supabase.storage.from('consultation-audio').createSignedUrl(fileName, 3600 * 24 * 365);
                    if (data?.signedUrl) audioUrl = data.signedUrl;
                }
            }

            // 2. Find or Create Patient
            let patientId = '';
            const { data: existingPatients, error: searchError } = await supabase
                .from('patients')
                .select('*')
                .eq('name', note.patientId) // note.patientId currently holds the Name string from ScribeSession
                .eq('user_id', user.id)
                .limit(1);

            if (searchError) throw searchError;

            if (existingPatients && existingPatients.length > 0) {
                patientId = existingPatients[0].id;
                // Update basic stats
                await supabase.from('patients').update({
                    last_seen: new Date(note.date).toLocaleDateString(),
                    age: (note as any).age || existingPatients[0].age,
                    gender: (note as any).gender || existingPatients[0].gender,
                    weight: (note as any).weight || existingPatients[0].weight,
                    height: (note as any).height || existingPatients[0].height,
                    blood_group: (note as any).bloodGroup || existingPatients[0].blood_group,
                    nationality: (note as any).nationality || existingPatients[0].nationality,
                    language: (note as any).language || existingPatients[0].language
                }).eq('id', patientId);
            } else {
                const { data: newPatient, error: createError } = await supabase
                    .from('patients')
                    .insert({
                        user_id: user.id,
                        name: note.patientId, // Using 'patientId' as 'Name' field here per existing logic
                        age: (note as any).age || 0,
                        gender: (note as any).gender || 'Unknown',
                        weight: (note as any).weight || '',
                        height: (note as any).height || '',
                        blood_group: (note as any).bloodGroup || '',
                        nationality: (note as any).nationality || '',
                        language: (note as any).language || 'English',
                        last_seen: new Date(note.date).toLocaleDateString()
                    })
                    .select()
                    .single();

                if (createError || !newPatient) throw createError;
                patientId = newPatient.id;
            }

            // 3. Insert Consultation
            const { error: insertError } = await supabase
                .from('consultations')
                .insert({
                    patient_id: patientId,
                    date: note.date,
                    type: note.type,
                    content: note.content,
                    raw_transcript: note.rawTranscript,
                    utterances: note.utterances,
                    summary: note.summary,
                    key_insights: note.keyInsights,
                    audio_url: audioUrl
                });

            if (insertError) throw insertError;

            await fetchPatients();
            setDefaultPatientId(patientId);
            setCurrentView(View.DASHBOARD);

            // Only show toast here if we aren't using the background processor's own toast
            // But handleBackgroundProcessing handles the toast itself. 
            // However, this function is also reused? 
            // Let's assume handleBackgroundProcessing calls this, and handleBackgroundProcessing sets the toast.
            // Or if called directly (legacy), we can set toast here.
            // Step 999 added:
            // setShowSuccessToast(true);
            // setTimeout(() => setShowSuccessToast(false), 4000);

        } catch (err: any) {
            console.error('Error saving note:', err);
            alert(`Error saving note: ${err.message}`);
        }
    };

    // Background Processing Handler
    const handleBackgroundProcessing = async (patientData: any, audioBlob: Blob) => {
        setIsBackgroundProcessing(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Session expired. Please login again.');
                setIsBackgroundProcessing(false);
                return;
            }

            // 1. Synchronously find or create the patient ID to allow immediate navigation
            let patientId = '';

            // Check if we already have an ID (if editing existing or selected from list)
            if (patientData.id && patientData.id !== 'temp') {
                patientId = patientData.id;
            } else {
                // Find or Create Patient Logic (Extracted for speed)
                const { data: existingPatients, error: searchError } = await supabase
                    .from('patients')
                    .select('id')
                    .eq('name', patientData.patientId) // patientId holds the name in ScribeSession data
                    .eq('user_id', user.id)
                    .limit(1);

                if (searchError) throw searchError;

                if (existingPatients && existingPatients.length > 0) {
                    patientId = existingPatients[0].id;
                } else {
                    const { data: newPatient, error: createError } = await supabase
                        .from('patients')
                        .insert({
                            user_id: user.id,
                            name: patientData.patientId,
                            age: patientData.age || 0,
                            gender: patientData.gender || 'Unknown',
                            weight: patientData.weight || '',
                            height: patientData.height || '',
                            blood_group: patientData.bloodGroup || '',
                            nationality: patientData.nationality || '',
                            language: patientData.language || 'English',
                            last_seen: new Date().toLocaleDateString()
                        })
                        .select()
                        .single();

                    if (createError || !newPatient) throw createError;
                    patientId = newPatient.id;
                }
            }

            // 2. Immediate Navigation to the Patient
            setPreselectedPatientData(null);

            // OPTIMISTIC UPDATE: Inject a "Processing" consultation immediately
            // This enables the "lively update" the user requested.
            // We find the patient in our local state and inject the temp consultation.
            const tempConsultationId = 'processing-' + Date.now();
            const tempConsultation = {
                id: tempConsultationId,
                patientId: patientId, // ID reference
                date: new Date().toISOString(),
                type: 'Processing', // Special type for Dashboard to recognize
                content: { assessment: 'Transcribing Audio...', subjective: { historyOfPresentIllness: 'Processing...' }, plan: 'Please wait...' },
                rawTranscript: '',
                utterances: [],
                summary: 'Processing...',
                keyInsights: [],
                audioUrl: URL.createObjectURL(audioBlob) // Immediate local playback
            };

            setPatients(prev => {
                const existingIndex = prev.findIndex(p => p.id === patientId);

                if (existingIndex >= 0) {
                    // Update existing patient
                    const updated = [...prev];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        lastSeen: new Date().toLocaleDateString(), // Update last seen
                        consultations: [tempConsultation as any, ...updated[existingIndex].consultations]
                    };
                    // Move to top
                    const p = updated.splice(existingIndex, 1)[0];
                    updated.unshift(p);
                    return updated;
                } else {
                    // Create new patient for optimistic state (First Patient Scenario)
                    // We cast as any to bypass the missing 'user_id' in local Patient type vs Supabase DB mismatch
                    const newPatientOpts: any = {
                        id: patientId,
                        user_id: user.id, // Needed for DB consistency if we used it elsewhere, but strictly not in Patient type
                        name: patientData.patientId,
                        age: parseInt(patientData.age) || 0,
                        gender: patientData.gender || 'Unknown',
                        weight: patientData.weight || '',
                        height: patientData.height || '',
                        blood_group: patientData.bloodGroup || '',
                        nationality: patientData.nationality || '',
                        language: patientData.language || 'English',
                        last_seen: new Date().toLocaleDateString(),
                        lastSeen: new Date().toLocaleDateString(),
                        consultations: [tempConsultation as any],
                        files: []
                    };
                    return [newPatientOpts, ...prev];
                }
            });

            setDefaultPatientId(patientId); // Select the patient in Dashboard
            setCurrentView(View.DASHBOARD);
            // await fetchPatients(); // SKIP fetch here to preserve our optimistic update!

            // 3. Perform Heavy Processing in Background
            const result = await processConsultation(audioBlob, patientData.language || 'English');

            let finalInsights: string[] = [];
            try {
                finalInsights = await generateKeyInsights(result.fullText);
            } catch (err) {
                console.error('Insights Error:', err);
            }

            // 4. Construct Final Note
            const note: MedicalNote = {
                ...patientData, // Spread first to allow specific fields to overwrite it
                id: Math.random().toString(36).substr(2, 9),
                patientId: patientData.patientId, // Name
                date: new Date().toISOString(),
                type: 'Consultation',
                content: result.soapNote,
                rawTranscript: result.fullText,
                utterances: result.utterances,
                summary: (result.soapNote as any).summary || result.soapNote.assessment,
                keyInsights: finalInsights,
            } as any;

            // 5. Save the Consultation Note to the obtained Patient ID
            // We can skip the patient creation part in handleSaveNote or just reuse it safely.
            // Using handleSaveNote is safe as it re-checks existence, but we can do a direct insert here for efficiency
            // since we already have the ID. But reusing is safer for consistency updates.
            await handleSaveNote(note, audioBlob);

            // 6. Success Feedback
            // Refresh again to show the new note
            await fetchPatients();
            setIsBackgroundProcessing(false);
            setShowSuccessToast(true);

        } catch (error) {
            console.error('Background Processing Failed:', error);
            setIsBackgroundProcessing(false);
            alert('Transcription failed in background. Please check console.');
        }
    };

    const handleDeleteConsultation = async (patientId: string, consultationId: string) => {
        const { error } = await supabase.from('consultations').delete().eq('id', consultationId);
        if (error) alert('Failed to delete consultation');
        else await fetchPatients();
    };

    const handleUpdateConsultation = async (consultationId: string, updates: Partial<MedicalNote>) => {
        const dbUpdates: any = {};
        if (updates.content) dbUpdates.content = updates.content;
        if (updates.utterances) dbUpdates.utterances = updates.utterances;
        if (updates.prescription) dbUpdates.prescription = updates.prescription;

        const { error } = await supabase.from('consultations').update(dbUpdates).eq('id', consultationId);
        if (error) alert('Failed to update consultation');
        else await fetchPatients();
    };

    const handleDeletePatient = async (patientId: string) => {
        await supabase.from('consultations').delete().eq('patient_id', patientId);
        await supabase.from('patients').delete().eq('id', patientId);
        await fetchPatients();
    };

    const handleUpdatePatient = async (patientId: string, updates: any) => {
        const { error } = await supabase.from('patients').update({
            name: updates.name,
            age: updates.age,
            gender: updates.gender,
            weight: updates.weight,
            height: updates.height,
            blood_group: updates.bloodGroup,
            nationality: updates.nationality,
            language: updates.language || 'English'
        }).eq('id', patientId);
        if (error) alert('Update failed');
        else fetchPatients();
    };

    const handleFileUpload = async (patientId: string, file: File) => {
        await uploadPatientFile(patientId, file);
        await fetchPatients();
    };

    const handleFileDelete = async (patientId: string, fileName: string) => {
        await deletePatientFile(patientId, fileName);
        await fetchPatients();
    };

    return (
        <div className="min-h-screen flex flex-col font-sans" >
            {currentView === View.LANDING && (
                <Landing onGetStarted={() => {
                    window.history.replaceState(null, '', window.location.pathname);
                    setCurrentView(View.AUTH);
                }} />
            )}

            {currentView === View.AUTH && (
                <Auth
                    onAuthSuccess={async (user) => {
                        await fetchPatients();
                        if (!user.specialty || !user.country || user.name === 'Clinician') {
                            setCurrentView(View.ONBOARDING);
                        } else {
                            setCurrentView(View.DASHBOARD);
                        }
                    }}
                    onBack={() => setCurrentView(View.LANDING)}
                />
            )}

            {currentView === View.ONBOARDING && (
                <Onboarding
                    initialName={authState.user?.name === 'Clinician' ? '' : authState.user?.name}
                    initialEmail={authState.user?.email}
                    onComplete={handleOnboardingComplete}
                    onExit={handleLogout}
                />
            )}

            {currentView === View.DASHBOARD && authState.user && (
                <Dashboard
                    user={authState.user}
                    patients={patients}
                    onLogout={handleLogout}
                    onStartScribe={(data) => {
                        setPreselectedPatientData(data || null);
                        if ((data as any)?.id) setDefaultPatientId((data as any).id);
                        window.history.pushState({ view: 'scribe' }, '', '');
                        setCurrentView(View.SCRIBE);
                    }}
                    onDeleteConsultation={handleDeleteConsultation}
                    onDeletePatient={handleDeletePatient}
                    onUpdatePatient={handleUpdatePatient}
                    onUpdateConsultation={handleUpdateConsultation}
                    onFileUpload={handleFileUpload}
                    onFileDelete={handleFileDelete}
                    defaultPatientId={defaultPatientId}
                    onClearDefaultPatient={() => setDefaultPatientId(null)}
                    isModalOpen={isDashboardModalOpen}
                    setIsModalOpen={setIsDashboardModalOpen}
                    onPatientSelect={setIsPatientSelected}
                />
            )}

            {currentView === View.SCRIBE && authState.user && (
                <ScribeSession
                    prefilledData={preselectedPatientData || undefined}
                    onCancel={() => window.history.back()}
                    onSave={handleBackgroundProcessing as any}
                />
            )}

            <TourGuide
                currentView={currentView}
                isModalOpen={currentView === View.DASHBOARD && isDashboardModalOpen}
                isPatientSelected={isPatientSelected}
                hasPatients={patients.length > 0}
                dataLoaded={isDataLoaded}
            />

            {/* Processing Toast */}
            {isBackgroundProcessing && (
                <div className="fixed bottom-24 left-6 md:top-24 md:right-6 md:left-auto md:bottom-auto z-50 bg-white text-slate-800 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-left md:slide-in-from-right duration-500 border border-slate-100">
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Loader2 size={16} className="animate-spin" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Processing...</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Transcribing and analyzing consultation.</p>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed bottom-6 left-6 md:top-24 md:right-6 md:left-auto md:bottom-auto z-50 bg-black text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-6 animate-in slide-in-from-left md:slide-in-from-right duration-500 border border-slate-800 min-w-[300px]">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black shrink-0">
                            <Check size={16} strokeWidth={3} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Transcription Done!</h4>
                            <p className="text-[10px] text-slate-400 font-medium">Patient record updated successfully.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSuccessToast(false)}
                        className="text-white/40 hover:text-white transition-colors p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
