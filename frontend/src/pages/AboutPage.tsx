import React from 'react';
import { Card, Badge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { ShieldAlert, Layers, BookOpen, Feather } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { currentLang } = useAppStore();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif-tamil font-bold text-ink-primary tracking-tight">
              {currentLang === 'ta' ? 'திட்டம் & தொழில்நுட்ப ஆய்வுக் குறிப்பு' : 'About TamilScript AI & Research Notes'}
            </h1>
            <Badge variant="gold">
              Epigraphic Research
            </Badge>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            {currentLang === 'ta'
              ? 'தொழில்நுட்ப கட்டமைப்பு, தரவுத்தொகுப்பு விவரங்கள் மற்றும் நெறிமுறை பாதுகாப்பு பரிசீலனைகள்.'
              : 'Deep learning architecture specifications, dataset provenance, and ethical guardrails.'}
          </p>
        </div>
      </div>

      {/* Ethics & Limitations Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-vermilion">
          <ShieldAlert className="w-5 h-5 text-vermilion" />
          <h2 className="text-base font-bold font-sans">
            Ethical Guardrails &amp; Model Limitations
          </h2>
        </div>

        <div className="space-y-3 text-xs text-ink-secondary leading-relaxed">
          <p>
            <strong className="text-ink-primary">Dataset Demographic Representation:</strong> The HP Labs Isolated Handwritten Tamil Character Dataset contains native adult scribes. Minor variations in handwriting motor skill (e.g. young children or tremors) may exhibit lower confidence scores.
          </p>
          <p>
            <strong className="text-ink-primary">Visually Confusable Tamil Graphemes:</strong> Subtly differentiated Tamil characters (e.g., <strong>ல</strong>, <strong>ள</strong>, and <strong>ழ</strong>; or <strong>ந</strong>, <strong>ன</strong>, and <strong>ண</strong>) are disambiguated using Squeeze-and-Excitation channel attention. The top-3 candidates are provided for low-confidence inputs.
          </p>
          <p>
            <strong className="text-ink-primary">Protection Against Signature Forgery:</strong> Generated continuous pen strokes embed discrete digital watermarks to protect against unauthorized calligraphic signature imitation.
          </p>
        </div>
      </Card>

      {/* 7 Models Architecture Breakdown */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-vermilion" />
          <h2 className="text-base font-bold text-ink-primary font-sans">
            7 Deep Learning Architectures
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-paper-canvas border border-border-subtle space-y-1">
            <span className="font-bold text-vermilion font-sans block">1. Client-Side Real-Time Recognizer</span>
            <p className="text-ink-secondary">Lightweight ResNet with Squeeze-and-Excitation channel attention running directly in the browser via WebGL Web Worker (&lt; 5 ms latency).</p>
          </div>

          <div className="p-4 rounded-xl bg-paper-canvas border border-border-subtle space-y-1">
            <span className="font-bold text-vermilion font-sans block">2. Online Stroke Trajectory Recognizer</span>
            <p className="text-ink-secondary">BiLSTM recurrent network processing raw coordinate velocity and pen-lift sequences, fused with image logits via neural ensemble.</p>
          </div>

          <div className="p-4 rounded-xl bg-paper-canvas border border-border-subtle space-y-1">
            <span className="font-bold text-gold font-sans block">3. Conditional cGAN Generator</span>
            <p className="text-ink-secondary">Spectral-normalized discriminator generating realistic isolated glyphs conditioned on class label and continuous style latents.</p>
          </div>

          <div className="p-4 rounded-xl bg-paper-canvas border border-border-subtle space-y-1">
            <span className="font-bold text-gold font-sans block">4. Graves LSTM-MDN Synthesizer</span>
            <p className="text-ink-secondary">Recurrent Mixture Density Network predicting continuous 2D Gaussian stroke distributions and pen-up states for arbitrary typed sentences.</p>
          </div>

          <div className="p-4 rounded-xl bg-paper-canvas border border-border-subtle space-y-1">
            <span className="font-bold text-sage font-sans block">5. Siamese Handwriting Evaluator</span>
            <p className="text-ink-secondary">Twin convolutional network computing cosine embedding similarity to evaluate loop closure, proportions, and curve smoothness.</p>
          </div>

          <div className="p-4 rounded-xl bg-paper-canvas border border-border-subtle space-y-1">
            <span className="font-bold text-sage font-sans block">6. TamilCRNN Word Recognizer</span>
            <p className="text-ink-secondary">Multi-line convolutional recurrent model with CTC Loss decoding for unsegmented handwritten Tamil words and manuscript pages.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AboutPage;
