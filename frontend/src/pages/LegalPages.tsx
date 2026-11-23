import React, { useState } from 'react';
import { ShieldCheck, FileText, RefreshCw } from 'lucide-react';

export const LegalPages: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'refund'>('privacy');

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto px-4 select-none">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
          Policies &amp; Legal Terms
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary">
          Transparent, secure, and privacy-first commitments to our global students and families.
        </p>

        {/* Tab switcher */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {[
            { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
            { id: 'terms', label: 'Terms & Conditions', icon: FileText },
            { id: 'refund', label: 'Refund Policy', icon: RefreshCw },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-vermilion text-white shadow-sm'
                    : 'bg-paper-surface text-ink-secondary hover:text-ink-primary border border-border-subtle'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm space-y-6 text-ink-secondary text-xs sm:text-sm leading-relaxed">
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-serif-tamil text-ink-primary">
              Privacy Policy (தனியுரிமைக் கொள்கை)
            </h2>
            <p>
              Your privacy is of paramount importance to us. At TamilScript AI, we adhere to strict international privacy standards including COPPA and GDPR.
            </p>
            <h3 className="font-bold text-ink-primary pt-2">1. Client-Side AI Execution</h3>
            <p>
              Our deep learning handwriting models and Web Speech API operate client-side directly in your browser. Your drawing strokes, canvas coordinates, and microphone audio never leave your device unless you explicitly opt in to submit feedback.
            </p>
            <h3 className="font-bold text-ink-primary pt-2">2. Personal Information Collected</h3>
            <p>
              When booking a live demo class, we only collect essential contact coordinates (Name, Email, Phone/WhatsApp) solely to coordinate class schedules. We never sell, rent, or trade student details to third parties.
            </p>
            <h3 className="font-bold text-ink-primary pt-2">3. Child Safety</h3>
            <p>
              For children participating in live online sessions, parental supervision is welcome. All our certified tutors are thoroughly background-verified and adhere to strict child safety protocols.
            </p>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-serif-tamil text-ink-primary">
              Terms &amp; Conditions (விதிமுறைகள்)
            </h2>
            <p>
              By accessing TamilScript AI and our associated learning platforms, you agree to be bound by these Terms of Service.
            </p>
            <h3 className="font-bold text-ink-primary pt-2">1. Educational Usage</h3>
            <p>
              All curriculum materials, 247 alphabet charts, games, and neural handwriting models are provided for personal educational enrichment and linguistic research.
            </p>
            <h3 className="font-bold text-ink-primary pt-2">2. Live Class Rescheduling</h3>
            <p>
              Students may reschedule any 1-on-1 live session with at least 12 hours advance notice via WhatsApp or email to ensure mentor availability.
            </p>
            <h3 className="font-bold text-ink-primary pt-2">3. Intellectual Property</h3>
            <p>
              The TamilScript AI neural network architectures, custom datasets, and interactive curriculum are proprietary educational assets protected under copyright law.
            </p>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-serif-tamil text-ink-primary">
              Refund &amp; Cancellation Policy (பணம் திரும்பப்பெறும் கொள்கை)
            </h2>
            <p>
              We believe in 100% student satisfaction. If for any reason our course does not meet your expectations, our refund policy is straightforward:
            </p>
            <h3 className="font-bold text-ink-primary pt-2">1. 100% Money-Back Guarantee (First 14 Days)</h3>
            <p>
              If after completing your first two live classes you feel the course is not suitable for your learning pace, notify us within 14 days of enrollment for an unconditional 100% refund.
            </p>
            <h3 className="font-bold text-ink-primary pt-2">2. Pro-Rata Course Cancellation</h3>
            <p>
              For longer annual programs, students moving due to unforeseen academic shifts can request a pro-rated refund for all unused upcoming sessions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
