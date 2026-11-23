import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BookOpen, Clock, Users, Award, CheckCircle2, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  titleTa: string;
  level: string;
  duration: string;
  targetAudience: string;
  description: string;
  highlights: string[];
  syllabus: string[];
}

const coursesData: Course[] = [
  {
    id: 'spoken',
    title: 'Simple Spoken Tamil',
    titleTa: 'எளிய பேச்சுத் தமிழ்',
    level: 'Beginner to Intermediate',
    duration: '30-45 Days (Flexible)',
    targetAudience: 'Adults, non-Tamil speakers, professionals & diaspora',
    description: 'Master conversational fluency in everyday colloquial Tamil. Focus on practical communication, asking questions, ordering food, traveling, and expressing emotions without complex grammar stress.',
    highlights: [
      'Speak confidently within 30 days',
      'Daily real-life dialogues & situational roleplays',
      'Phonetic English transliteration guides',
      'Interactive Web Speech API audio for pronunciation',
    ],
    syllabus: [
      'Greetings, polite words & introducing yourself',
      'Essential pronouns, question words (Who, What, Where, When)',
      'Numbers, time, days, shopping & currency transactions',
      'Tense usage in colloquial speech (Past, Present, Future)',
      'Expressing necessity, likes, dislikes, and travel directions',
    ],
  },
  {
    id: 'reading-writing',
    title: 'Tamil Reading & Writing Mastery',
    titleTa: 'தமிழ் வாசித்தல் மற்றும் எழுதுதல்',
    level: 'All Levels',
    duration: '60 Days',
    targetAudience: 'Anyone wanting to read Tamil literature, signs & books',
    description: 'Step-by-step mastery of all 247 letters, vowel modifiers (துணைக்குறிகள்), syllable math, and continuous sentence reading with real-time AI handwriting validation.',
    highlights: [
      'Complete mastery of all 247 letters',
      'Systematic breakdown of the 7 vowel sign rules',
      'Real-time neural stroke tracing and scoring in our AI Studio',
      'Read authentic Tamil newspaper excerpts and short stories',
    ],
    syllabus: [
      '12 Vowels (உயிர்) and 18 Consonants (மெய்)',
      'The 7 vowel sign patterns and 216 Uyirmei syllables',
      'Grantha letters (ஜ, ஷ, ஸ, ஹ, க்ஷ, ஸ்ரீ) and Ayutham (ஃ)',
      'Word formation, double consonants (ஒற்றெழுத்து), and punctuation',
      'Reading comprehension: Aathichudi, Thirukkural & modern prose',
    ],
  },
  {
    id: 'kids',
    title: 'Online Tamil Classes for Kids',
    titleTa: 'குழந்தைகளுக்கான தமிழ் வகுப்பு',
    level: 'Ages 4 to 14',
    duration: 'Ongoing / Grade-based',
    targetAudience: 'Children living outside Tamil Nadu (USA, UK, Singapore, etc.)',
    description: 'Gamified interactive curriculum designed specifically for young learners. Packed with animated stories, songs, rhymes, and letter games to build lifelong cultural connection and language pride.',
    highlights: [
      'Gamified quizzes, sound matching & streak rewards',
      'Animated rhymes and moral stories (Thirukkural, Panchatantra)',
      'Kid-friendly drawing canvas with neural feedback',
      'Small groups or 1-on-1 personalized attention',
    ],
    syllabus: [
      'Tamil alphabet through animals, fruits, and colors',
      'Family relations, everyday home conversational vocabulary',
      'Tamil nursery rhymes and traditional folk songs',
      'Simple sentence building and storytelling skills',
      'Basic reading and handwriting practice',
    ],
  },
  {
    id: 'samacheer',
    title: 'Samacheer Kalvi School Curriculum',
    titleTa: 'சமச்சீர் கல்வி பாடத்திட்டம்',
    level: 'Grade 1 to 10',
    duration: 'Academic Year',
    targetAudience: 'School students following Tamil Nadu state board',
    description: 'Comprehensive academic tutoring covering state syllabus textbooks, grammar (இலக்கணம்), poetry memorization, and exam preparation with top grades guarantee.',
    highlights: [
      'Aligned with latest Tamil Nadu State Board textbooks',
      'In-depth grammar coverage: Sandhi rules, cases & meter',
      'Exam practice papers and question bank solving',
    ],
    syllabus: [
      'Textbook prose (உரைநடை) and poem explanations (செய்யுள்)',
      'Detailed grammar: எழுத்து, சொல், பொருள், யாப்பு, அணி',
      'Essay writing, letter drafting, and creative composition',
      'Model exam practice and evaluation',
    ],
  },
  {
    id: 'singapore',
    title: 'Singapore MOE Tamil Syllabus',
    titleTa: 'சிங்கப்பூர் தமிழ் பாடத்திட்டம்',
    level: 'Primary 1 to Secondary 4',
    duration: 'Academic Year',
    targetAudience: 'Students preparing for PSLE & O-Level Tamil examinations',
    description: 'Tailored specifically for the Singapore Ministry of Education (MOE) Tamil curriculum, oral testing, picture description, comprehension, and paper 1 composition.',
    highlights: [
      'Targeted PSLE & GCE O-Level oral and written prep',
      'Picture discussion (பட விவரிப்பு) strategy workshops',
      'Idioms, Proverbs (பழமொழிகள்) and vocabulary drilling',
    ],
    syllabus: [
      'MOE Primary / Secondary textbook analysis',
      'Oral examination practice (Interactive video stimulus response)',
      'Situational writing (மின்னஞ்சல்) and continuous composition (கட்டுரை)',
      'Comprehension open-ended answering techniques',
    ],
  },
  {
    id: 'calligraphy',
    title: 'Classical Epigraphy & AI Calligraphy',
    titleTa: 'கல்வெட்டியல் மற்றும் கையெழுத்துக் கலை',
    level: 'Enthusiast / Advanced',
    duration: '30 Days',
    targetAudience: 'Designers, historians, and AI enthusiasts',
    description: 'Explore historical Tamil scripts—Tamil Brahmi, Vatteluttu, and modern digital typography—paired with our deep learning character synthesis and palm-leaf manuscript OCR tools.',
    highlights: [
      'Evolution from ancient 3rd century BCE Tamil Brahmi to modern font design',
      'Hands-on styling with Generative VAE stroke models',
      'Digital preservation of palm-leaf manuscripts',
    ],
    syllabus: [
      'History of Tamil scripts: Brahmi, Vatteluttu & Grantha',
      'Anatomy of Tamil letterforms: loops, baselines & terminals',
      'Digital calligraphy and Bezier trajectory styling',
      'Using neural OCR for heritage document transcription',
    ],
  },
];

export const CoursesPage: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const [selectedCourse, setSelectedCourse] = useState<Course>(coursesData[0]);

  return (
    <div className="space-y-12 py-6 max-w-6xl mx-auto px-4 select-none">
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vermilion/10 text-vermilion border border-vermilion/20 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Complete Curriculum · பாடத்திட்டங்கள்</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
          Structured Tamil Courses
        </h1>
        <p className="text-sm sm:text-base text-ink-secondary">
          Whether you want to speak fluently in 30 days, teach your child their mother tongue, or prepare for school exams, explore our targeted learning pathways.
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesData.map((course) => {
          const isSelected = selectedCourse.id === course.id;
          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className={`p-6 rounded-3xl bg-paper-surface border transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'border-vermilion ring-2 ring-vermilion/20 shadow-md'
                  : 'border-border-subtle hover:border-vermilion/50 hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-vermilion/10 text-vermilion uppercase">
                    {course.level}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-ink-tertiary">
                    <Clock className="w-3 h-3" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold font-serif-tamil text-ink-primary group-hover:text-vermilion transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs font-serif-tamil text-vermilion font-medium">
                  {course.titleTa}
                </p>

                <p className="text-xs text-ink-secondary leading-relaxed line-clamp-3">
                  {course.description}
                </p>

                <div className="pt-2 space-y-1.5 border-t border-border-subtle">
                  {course.highlights.slice(0, 3).map((hl, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-ink-tertiary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between">
                <span className="text-xs font-bold text-vermilion flex items-center gap-1">
                  <span>View Syllabus</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('contact');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-paper-muted hover:bg-vermilion hover:text-white text-ink-primary text-xs font-semibold border border-border-subtle transition-all"
                >
                  Book Demo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Course Deep Dive Detail Modal / Box */}
      {selectedCourse && (
        <div className="p-8 rounded-3xl bg-paper-surface border border-border-subtle shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
            <div>
              <span className="text-xs font-bold text-vermilion uppercase tracking-wider">
                Course Syllabus Breakdown
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-tamil text-ink-primary">
                {selectedCourse.title} · {selectedCourse.titleTa}
              </h2>
              <p className="text-xs text-ink-secondary mt-1">
                Target Audience: {selectedCourse.targetAudience}
              </p>
            </div>

            <button
              onClick={() => setActiveTab('contact')}
              className="px-6 py-3 rounded-2xl bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold shadow-md transition-all self-start sm:self-auto"
            >
              Enroll / Book Free Demo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                <Award className="w-4 h-4 text-gold" />
                <span>What You Will Master:</span>
              </h4>
              <ul className="space-y-2">
                {selectedCourse.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-ink-secondary">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-ink-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-vermilion" />
                <span>Syllabus Modules:</span>
              </h4>
              <div className="space-y-2">
                {selectedCourse.syllabus.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-paper-muted border border-border-subtle text-xs text-ink-primary flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-vermilion/10 text-vermilion font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct WhatsApp Callout */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-600/10 via-emerald-600/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-bold text-lg text-ink-primary">Need help choosing the right course?</h3>
          <p className="text-xs text-ink-secondary">Chat directly with our academic advisor on WhatsApp for personalized level assessment.</p>
        </div>
        <a
          href="https://wa.me/919035394805?text=Hi%20TamilScript%20AI!%20I%20need%20help%20choosing%20the%20right%20course."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat on WhatsApp (+91 90353 94805)</span>
        </a>
      </div>
    </div>
  );
};
