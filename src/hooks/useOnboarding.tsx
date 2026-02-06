"use client";

import { useState, useEffect, useCallback } from "react";

const ONBOARDING_KEY = "calimbus_onboarding_complete";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for element to highlight
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Calimbus! 🎉",
    description: "Your Google Calendar and Tasks in a beautiful Kanban board. Let's take a quick tour!",
    target: "body",
  },
  {
    id: "date-picker",
    title: "Navigate Dates",
    description: "Use the arrows or click the date to jump to any day. Press T for today!",
    target: "[data-tour='date-picker']",
  },
  {
    id: "view-toggle",
    title: "Day or Week View",
    description: "Toggle between Day view and Week view. Press W to switch!",
    target: "[data-tour='view-toggle']",
  },
  {
    id: "add-task",
    title: "Create Tasks",
    description: "Click here or press N to create a new task that syncs with Google Tasks.",
    target: "[data-tour='add-task']",
  },
  {
    id: "add-event",
    title: "Create Events",
    description: "Click here or press E to create events that sync with Google Calendar.",
    target: "[data-tour='add-event']",
  },
  {
    id: "columns",
    title: "Drag & Drop",
    description: "Drag cards between columns to organize your workflow. Create custom columns too!",
    target: "[data-tour='columns']",
  },
  {
    id: "help",
    title: "Need Help?",
    description: "Press ? anytime to see all keyboard shortcuts and tips. Enjoy! 🚀",
    target: "[data-tour='help']",
  },
];

export function useOnboarding() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true);

  // Check if onboarding completed on mount
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setHasCompleted(false);
      // Auto-start onboarding for new users after short delay
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsActive(false);
    setHasCompleted(true);
    localStorage.setItem(ONBOARDING_KEY, "true");
  }, []);

  const restartOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    step: ONBOARDING_STEPS[currentStep],
    hasCompleted,
    nextStep,
    prevStep,
    skipOnboarding,
    restartOnboarding,
  };
}

// Onboarding overlay component
export function OnboardingOverlay({
  isActive,
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: {
  isActive: boolean;
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onSkip} />

      {/* Tooltip */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto animate-slideUp">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i <= currentStep ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentStep + 1} / {totalSteps}
            </span>
          </div>

          {/* Content */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={onPrev}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={onNext}
                className="px-4 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
              >
                {currentStep === totalSteps - 1 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
