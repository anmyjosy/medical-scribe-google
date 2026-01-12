import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { View } from '@/types';

interface TourGuideProps {
    currentView: View;
    isModalOpen?: boolean;
    isPatientSelected?: boolean;
    hasPatients?: boolean;
    dataLoaded?: boolean;
    onTourEnd?: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({ currentView, isModalOpen, isPatientSelected, hasPatients, dataLoaded = true, onTourEnd }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [tourKey, setTourKey] = useState('');
    const [run, setRun] = useState(false);
    const [steps, setSteps] = useState<Step[]>([]);
    const [stepIndex, setStepIndex] = useState(0);

    // Hydration fix: only render on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || !dataLoaded) return; // Wait for data to load

        // DEV TOOL: Reset tour if requested via URL
        if (typeof window !== 'undefined' && window.location.search.includes('reset_tour=true')) {
            localStorage.removeItem('medscribe_tour_completed');
            console.log('Tour history reset via URL');
        }

        // Add a small delay to ensure DOM elements (like Modals or new Views) are fully rendered
        // before Joyride tries to find targets. This prevents "Target Not Found" issues.
        const timer = setTimeout(() => {
            setRun(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [isMounted, tourKey, dataLoaded]);

    useEffect(() => {
        if (!dataLoaded) return; // Don't calculate steps if data isn't loaded

        let newSteps: Step[] = [];
        let newKey = '';

        // 1. Dashboard View
        if (currentView === View.DASHBOARD) {
            if (isModalOpen) {
                newKey = 'dashboard-modal';
                newSteps = [
                    {
                        target: '#modal-start-btn',
                        content: 'Fill in the details and click "Start Recording" to begin the consultation.',
                        placement: 'top',
                        disableBeacon: true,
                        disableOverlayClose: true,
                        spotlightClicks: true, // Allow clicking this to proceed to next view
                    }
                ];
            } else if (isPatientSelected) {
                newKey = 'patient-details';
                newSteps = [
                    {
                        target: '#ask-ai-trigger-btn',
                        content: 'Use "Ask AI" to chat with your medical records.',
                        disableBeacon: true,
                    },
                    {
                        target: '#tab-uploads',
                        content: 'Upload digital forms only (PDF/DOCX) for AI analysis.',
                        placement: 'bottom', // Force bottom to prevent horizontal overflow
                        floaterProps: {
                            disableAnimation: true,
                        }
                    },
                    {
                        target: '#tab-prescription',
                        content: 'Navigate here to auto-generate prescriptions.',
                        placement: 'bottom',
                    }
                ];
            } else if (!hasPatients) { // <--- ONLY show welcome tour if NO patients exist
                newKey = 'dashboard-main';

                // Detect mobile to target the FAB instead of the desktop button
                const isMobile = window.innerWidth < 768;
                const addBtnTarget = isMobile ? '#add-patient-btn-mobile' : '#add-patient-btn';

                newSteps = [
                    {
                        target: 'body',
                        content: <div className="text-left font-sans">
                            <strong className="block mb-2 text-lg">Welcome to MedScribe AI 👋</strong>
                            <p>Let's take a quick tour to show you how to streamline your clinical documentation.</p>
                        </div>,
                        placement: 'center',
                        disableBeacon: true,
                    },
                    {
                        target: addBtnTarget,
                        content: 'Start by creating a new patient session here.',
                        spotlightPadding: 5,
                        disableBeacon: true,
                        disableOverlayClose: true,
                        spotlightClicks: true, // Allow clicking to open modal
                    }
                ];
            }
        }
        // 2. Scribe View (Session)
        else if (currentView === View.SCRIBE) {
            newKey = 'scribe-session';
            newSteps = [
                {
                    target: '#start-recording-btn',
                    content: 'Click here to start recording the consultation.',
                    disableBeacon: true,
                    disableOverlayClose: true,
                    spotlightClicks: false, // PREVENT clicking to avoid changing state
                },
                {
                    target: '#upload-audio-btn',
                    content: 'Or upload an existing audio file.',
                    spotlightClicks: false,
                }
            ];
        }

        // Check availability in localStorage
        let completedTours: string[] = [];
        try {
            const stored = localStorage.getItem('medscribe_tour_completed');
            const parsed = JSON.parse(stored || '[]');
            if (Array.isArray(parsed)) completedTours = parsed;
        } catch (e) {
            console.warn('Failed to parse completed tours', e);
        }

        if (completedTours.includes(newKey) && newKey !== '') {
            setSteps([]);
            setTourKey('');
            setRun(false);
            return;
        }

        setSteps(newSteps);
        setTourKey(newKey);
        setStepIndex(0); // Always reset index when changing phases
    }, [currentView, isModalOpen, isPatientSelected, hasPatients, dataLoaded]);

    // Handle tour callbacks
    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, action, index } = data;

        // Only update local index state
        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
        }

        // SCROLL FIX: When moving to the "Uploads" tab (index 1 of patient-details), 
        // force it into view horizontally.
        if (type === EVENTS.STEP_BEFORE && index === 1 && tourKey === 'patient-details') {
            const uploadTab = document.getElementById('tab-uploads');
            if (uploadTab) {
                // Use a small timeout to ensure this runs after Joyride's initial calculation/scroll attempts
                setTimeout(() => {
                    // Removed scrollIntoView to prevent horizontal scrolling issues as requested.
                    // Just clicking the tab is sufficient to show the content.
                    uploadTab.click();
                }, 100);
            }
        }

        // AUTO-CLICK: Select "Prescription" tab (index 2)
        if (type === EVENTS.STEP_BEFORE && index === 2 && tourKey === 'patient-details') {
            const prescriptionTab = document.getElementById('tab-prescription');
            if (prescriptionTab) {
                setTimeout(() => {
                    prescriptionTab.click();
                }, 100);
            }
        }

        // Handle "Finish" or "Skip"
        // If the user explicitly finishes or skips, mark this specific tour key as completed
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            let completedTours: string[] = [];
            try {
                const stored = localStorage.getItem('medscribe_tour_completed');
                const parsed = JSON.parse(stored || '[]');
                if (Array.isArray(parsed)) completedTours = parsed;
            } catch (e) {
                console.warn('Failed to parse completed tours', e);
            }

            if (tourKey && !completedTours.includes(tourKey)) {
                completedTours.push(tourKey);
                localStorage.setItem('medscribe_tour_completed', JSON.stringify(completedTours));
            }
            setRun(false); // Manually stop run state
        }
    };

    if (!isMounted) return null;

    return (
        <Joyride
            key={tourKey} // <--- Forces remount on phase change
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showSkipButton
            showProgress
            disableOverlayClose={true}
            hideCloseButton={true}
            locale={{
                last: 'Finish', // Customize last button text
            }}
            styles={{
                options: {
                    primaryColor: '#000',
                    textColor: '#333',
                    backgroundColor: '#fff',
                    arrowColor: '#fff',
                    zIndex: 10000,
                },
                tooltip: {
                    borderRadius: '24px', // Rounded corners for the tour tooltip
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
                    padding: '24px',
                    maxWidth: '85vw', // Ensure it fits on mobile screens (with some margin)
                    boxSizing: 'border-box',
                },
                buttonNext: {
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    borderRadius: '12px',
                    padding: '10px 20px',
                    outline: 'none',
                },
                buttonBack: {
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#999',
                    outline: 'none',
                },
                buttonSkip: {
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#999',
                    outline: 'none',
                }
            }}
            callback={handleJoyrideCallback}
        />
    );
};

export default TourGuide;
