import React, { useState } from 'react';
import { Star, Quote, MapPin, CheckCircle, MessageSquare, ThumbsUp } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  course: string;
  rating: number;
  quote: string;
  highlight: string;
}

const testimonialsData: Testimonial[] = [
  {
    id: 't1',
    name: 'Priya & Karthik Sundaram',
    location: 'San Jose, California, USA',
    course: 'Online Tamil Classes for Kids',
    rating: 5,
    quote: 'Our 7-year-old daughter was born in the US and could barely understand Tamil when her grandparents visited. After 4 months with this curriculum, she now speaks fluent daily sentences and loves playing the letter matching games! The AI tracing coach made handwriting practice fun for her.',
    highlight: 'Daughter speaks confident Tamil with grandparents',
  },
  {
    id: 't2',
    name: 'Dr. Michael Davies',
    location: 'London, United Kingdom',
    course: 'Simple Spoken Tamil',
    rating: 5,
    quote: 'I needed colloquial Tamil for a healthcare initiative in Chennai. Learning with this structured phrasebook and native audio pronunciation helped me understand patient dialogues within 6 weeks. The breakdown of grammar without intimidating jargon was refreshing.',
    highlight: 'Achieved conversational fluency in 6 weeks',
  },
  {
    id: 't3',
    name: 'Meena Rajaratnam',
    location: 'Singapore',
    course: 'Singapore MOE Tamil Syllabus (Primary 5)',
    rating: 5,
    quote: 'My son was struggling with the PSLE picture composition and oral examination format. The specialized drills on situational writing and oral video responses helped him jump from AL4 to AL1 in his school prelims. Truly grateful!',
    highlight: 'Jumped from AL4 to AL1 in Singapore school exams',
  },
  {
    id: 't4',
    name: 'Ananya Sharma',
    location: 'Bengaluru, India',
    course: 'Tamil Reading & Writing Mastery',
    rating: 5,
    quote: 'Moving from Delhi to Chennai for work, I wanted to read signboards and communicate with local vendors. In just 45 days, I learned all 247 letters. The interactive 247 alphabet grid and stroke feedback are brilliantly executed.',
    highlight: 'Mastered all 247 letters in 45 days',
  },
  {
    id: 't5',
    name: 'Rajesh & Kavitha',
    location: 'Melbourne, Australia',
    course: 'Kids Heritage Tamil Curriculum',
    rating: 5,
    quote: 'Finding quality Tamil educators in Australia is tough. The flexible online scheduling and gamified streak system kept our twin boys engaged every single week. They especially love the Thirukkural story sessions.',
    highlight: 'Twins actively look forward to their weekly class',
  },
  {
    id: 't6',
    name: 'Suresh Kumar',
    location: 'Toronto, Canada',
    course: 'Classical Epigraphy & AI Calligraphy',
    rating: 5,
    quote: 'As a software engineer fascinated by ancient scripts, the fusion of classical Tamil epigraphy with modern deep learning recognition is extraordinary. The palm-leaf OCR tool and generative stroke synthesis are world-class.',
    highlight: 'World-class deep learning epigraphy tools',
  },
];

export const TestimonialsPage: React.FC = () => {
  const [filterRating, setFilterRating] = useState<number>(0);

  const filtered = testimonialsData.filter(
    (t) => filterRating === 0 || t.rating === filterRating
  );

  return (
    <div className="space-y-10 py-6 max-w-6xl mx-auto px-4 select-none">
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20 text-xs font-semibold">
          <Star className="w-3.5 h-3.5 fill-gold" />
          <span>Student Success Stories · மாணவர் நற்சான்றுகள்</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
          Loved by 10,000+ Learners Worldwide
        </h1>
        <p className="text-sm sm:text-base text-ink-secondary">
          Hear from students, parents, and working professionals across USA, UK, Singapore, Australia, and India who achieved fluency with our platform.
        </p>

        {/* Aggregate Ratings Banner */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="flex items-center gap-1.5">
            <div className="flex text-gold">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-gold" />
              ))}
            </div>
            <span className="text-sm font-bold text-ink-primary">4.9 / 5.0</span>
          </div>
          <span className="text-xs text-ink-tertiary">•</span>
          <span className="text-xs font-medium text-ink-secondary">Over 1,200+ Verified 5-Star Reviews</span>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex text-gold">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold" />
                  ))}
                </div>
                <Quote className="w-5 h-5 text-ink-tertiary/40" />
              </div>

              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed italic">
                "{item.quote}"
              </p>
            </div>

            <div className="pt-4 border-t border-border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{item.highlight}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <h4 className="text-sm font-bold text-ink-primary">{item.name}</h4>
                  <p className="text-[11px] text-ink-tertiary flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-vermilion" />
                    <span>{item.location}</span>
                  </p>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-paper-muted text-ink-secondary border border-border-subtle">
                  {item.course}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
