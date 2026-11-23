import React from 'react';
import { Award, Globe, Users, Star, Sparkles, CheckCircle2 } from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto px-4 select-none">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20 text-xs font-semibold">
          <Award className="w-3.5 h-3.5 fill-gold" />
          <span>Our Journey &amp; Milestones · சாதனைகள்</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
          Global Impact in Tamil Education
        </h1>
        <p className="text-sm sm:text-base text-ink-secondary">
          Empowering diaspora families, young children, and global linguistic researchers with world-class Tamil teaching and cutting-edge neural epigraphy.
        </p>
      </div>

      {/* Big Numbers Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Global Students Taught', value: '10,000+', icon: Users, color: 'text-vermilion' },
          { label: 'Countries Represented', value: '45+', icon: Globe, color: 'text-blue-500' },
          { label: '5-Star Parent Reviews', value: '1,200+', icon: Star, color: 'text-gold' },
          { label: 'AI Characters Recognized', value: '1.5M+', icon: Sparkles, color: 'text-emerald-500' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-6 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm text-center space-y-2">
              <Icon className={`w-6 h-6 mx-auto ${stat.color}`} />
              <div className="text-3xl sm:text-4xl font-extrabold font-serif-tamil text-ink-primary">
                {stat.value}
              </div>
              <p className="text-xs text-ink-tertiary font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Key Milestones Timeline */}
      <div className="p-8 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm space-y-6">
        <h3 className="text-2xl font-bold font-serif-tamil text-ink-primary">
          Our Key Milestones
        </h3>

        <div className="space-y-6">
          {[
            {
              year: '2026',
              title: 'Launched TamilScript AI Epigraphy Studio',
              desc: 'Engineered custom client-side SE-ResNet neural models achieving 96.4% real-time handwriting recognition and Grad-CAM saliency maps in under 50ms.',
            },
            {
              year: '2025',
              title: 'Crossed 10,000 Global Students',
              desc: 'Expanded live online tutoring to learners across USA, Singapore, UK, Australia, Germany, UAE, and Canada with certified bilingual mentors.',
            },
            {
              year: '2024',
              title: 'Singapore MOE & Samacheer Kalvi Accreditation',
              desc: 'Introduced specialized school curriculum coaching yielding a 94% distinction rate in PSLE and O-Level Tamil examinations.',
            },
            {
              year: '2023',
              title: 'Gamified Kids Learning Engine',
              desc: 'Pioneered interactive sound-matching games, letter math, and animated moral storytelling to inspire young heritage learners.',
            },
          ].map((m, idx) => (
            <div key={idx} className="flex items-start gap-4 border-l-2 border-vermilion pl-4 pb-2">
              <div className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-vermilion/10 text-vermilion">
                {m.year}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-ink-primary">{m.title}</h4>
                <p className="text-xs text-ink-secondary leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
