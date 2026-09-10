"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface TourStep {
  title: string;
  description: string;
  targetPage: string;
  icon: string;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to AR Constructions! 🏗️",
    description:
      "This is your Dashboard — the command center. Here you can see active projects, expenses, low stock alerts, and quick actions all in one place.",
    targetPage: "/",
    icon: "📊",
  },
  {
    title: "Manage Your Projects 📁",
    description:
      "Create and track all your construction projects. Add phases (Foundation → Handover), log delays with reasons, track change orders for extra work, and compare original vs revised budgets.",
    targetPage: "/projects",
    icon: "📁",
  },
  {
    title: "Inventory & Materials 📦",
    description:
      "Track cement, steel, sand, bricks and 25+ materials. Record Stock In (purchases) and Stock Out (site usage). Get alerts when stock runs low. All in Indian units — bags, brass, CFT, kg.",
    targetPage: "/inventory",
    icon: "📦",
  },
  {
    title: "Financial Management 💰",
    description:
      "Track every rupee — income from clients and expenses on materials, labour, transport. GST calculation at 1%/5%/18%. Generate invoices. View profit/loss per project. Supports UPI, bank transfer, cash, cheque.",
    targetPage: "/finance",
    icon: "💰",
  },
  {
    title: "Labour & Attendance 👷",
    description:
      "Register workers with Aadhaar, mark daily attendance with one click (Present/Half-Day/Absent/OT), auto-calculate wages, and track payments. Manage contractors and their workers.",
    targetPage: "/labour",
    icon: "👷",
  },
  {
    title: "Site Reports & DPR 📸",
    description:
      "Create Daily Progress Reports — log work done, weather, labour count, materials used, and issues. Upload site photos to build a visual timeline of progress.",
    targetPage: "/site-reports",
    icon: "📸",
  },
  {
    title: "Vendors & Suppliers 🚛",
    description:
      "Maintain your vendor directory with GST numbers and bank details. Track purchase history, compare rates, and manage payment ledgers.",
    targetPage: "/vendors",
    icon: "🚛",
  },
  {
    title: "Client Management 🏢",
    description:
      "Keep track of all your clients, their projects, billing history, and outstanding dues in one place.",
    targetPage: "/clients",
    icon: "🏢",
  },
  {
    title: "Equipment Tracking 🔧",
    description:
      "Track owned and rented equipment. Assign machinery to sites, auto-calculate rental costs, and maintain service logs.",
    targetPage: "/equipment",
    icon: "🔧",
  },
  {
    title: "Document Vault 📄",
    description:
      "Store all important documents — contracts, permits, drawings, bills, quotations. Organized by project and category. Everything in one place, always accessible.",
    targetPage: "/documents",
    icon: "📄",
  },
  {
    title: "You're All Set! 🎉",
    description:
      "Start by creating a Client, then a Project, and you're ready to go! Use the Quick Actions on the Dashboard for fast data entry. Tip: This app works great on your phone too!",
    targetPage: "/",
    icon: "🚀",
  },
];

export default function GuidedTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const seen = localStorage.getItem("ar-tour-completed");
    if (!seen) {
      setHasSeenTour(false);
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (tourSteps[nextStep].targetPage !== pathname) {
        router.push(tourSteps[nextStep].targetPage);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (tourSteps[prevStep].targetPage !== pathname) {
        router.push(tourSteps[prevStep].targetPage);
      }
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem("ar-tour-completed", "true");
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsVisible(true);
    localStorage.removeItem("ar-tour-completed");
    router.push("/");
  };

  if (!isVisible) {
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-6 right-6 z-50 bg-[#e67e22] hover:bg-[#d35400] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all hover:scale-110 no-print"
        title="Restart Tour"
      >
        <span className="text-xl">❓</span>
      </button>
    );
  }

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-50 no-print" />

      {/* Tour Card */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 no-print">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress Bar */}
          <div className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-[#e67e22] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <span className="text-4xl flex-shrink-0">{step.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">
                    {currentStep + 1}/{tourSteps.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={handleComplete}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip Tour
              </button>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-5 py-2 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#15304f] rounded-lg transition-colors"
                >
                  {currentStep === tourSteps.length - 1
                    ? "🎉 Get Started!"
                    : "Next →"}
                </button>
              </div>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 pb-4">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStep(idx);
                  if (tourSteps[idx].targetPage !== pathname) {
                    router.push(tourSteps[idx].targetPage);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? "bg-[#e67e22] w-6"
                    : idx < currentStep
                    ? "bg-[#1e3a5f]"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
