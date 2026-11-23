import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goal: 'spoken',
    ageGroup: 'adult',
    timezone: 'IST',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto px-4 select-none">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vermilion/10 text-vermilion border border-vermilion/20 text-xs font-semibold">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Get in Touch · எங்களை தொடர்பு கொள்ள</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-primary font-serif-tamil tracking-tight">
          Book a Free Demo &amp; Contact Us
        </h1>
        <p className="text-sm sm:text-base text-ink-secondary">
          Ready to start your Tamil learning journey? Schedule a complimentary 1-on-1 demo session or reach out to our academic team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-paper-surface border border-border-subtle shadow-sm space-y-6">
            <h3 className="text-xl font-bold font-serif-tamil text-ink-primary">
              Direct Contact Channels
            </h3>

            <div className="space-y-4">
              <a
                href="https://wa.me/919035394805?text=Hi%20TamilScript%20AI!%20I%20would%20like%20to%20learn%20Tamil."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink-primary">WhatsApp Us</h4>
                  <p className="text-xs text-ink-secondary">+91 90353 94805</p>
                  <span className="text-[10px] text-emerald-600 font-bold">Instant replies · Available 24/7</span>
                </div>
              </a>

              <a
                href="mailto:support@tamilscript.ai"
                className="flex items-start gap-4 p-4 rounded-2xl bg-paper-muted hover:bg-paper-muted/80 border border-border-subtle transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-vermilion text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink-primary">Email Support</h4>
                  <p className="text-xs text-ink-secondary">support@tamilscript.ai</p>
                  <span className="text-[10px] text-ink-tertiary">Responses within 2-4 hours</span>
                </div>
              </a>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-paper-muted border border-border-subtle">
                <div className="p-2.5 rounded-xl bg-paper-surface text-ink-secondary flex-shrink-0 border border-border-subtle">
                  <MapPin className="w-5 h-5 text-vermilion" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink-primary">Registered Office</h4>
                  <p className="text-xs text-ink-secondary">
                    309 Mangam Elite, HSR Layout, Sector-2, Bengaluru, Karnataka, India - 560102
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-paper-muted border border-border-subtle">
                <div className="p-2.5 rounded-xl bg-paper-surface text-ink-secondary flex-shrink-0 border border-border-subtle">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink-primary">Teaching Hours</h4>
                  <p className="text-xs text-ink-secondary">
                    7:00 AM – 11:00 PM IST (Covers USA, Europe, Singapore &amp; Australia time zones)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-7">
          <div className="p-8 sm:p-10 rounded-3xl bg-paper-surface border border-border-subtle shadow-md space-y-6">
            <div>
              <h3 className="text-2xl font-bold font-serif-tamil text-ink-primary">
                Book a Free 30-Minute Live Demo
              </h3>
              <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                Experience our personalized 1-on-1 live teaching methodology and evaluate your current proficiency level.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-xl font-bold font-serif-tamil text-ink-primary">
                  Demo Session Requested!
                </h4>
                <p className="text-xs sm:text-sm text-ink-secondary max-w-md mx-auto">
                  Thank you, <strong>{formData.name}</strong>. Our academic team will reach out via WhatsApp at <strong>{formData.phone}</strong> to confirm your complimentary session.
                </p>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/919035394805?text=Hello%20TamilScript%20AI!%20I%20just%20submitted%20a%20demo%20request%20for%20${encodeURIComponent(formData.name)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Confirm Instantly on WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-secondary mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anandha Kumar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-paper-muted border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-secondary mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-paper-muted border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-secondary mb-1">WhatsApp / Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000 or +91..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-paper-muted border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-secondary mb-1">Learning Goal *</label>
                    <select
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-paper-muted border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary"
                    >
                      <option value="spoken">Simple Spoken Tamil</option>
                      <option value="reading-writing">Reading &amp; Writing (247 Letters)</option>
                      <option value="kids">Online Tamil for Kids</option>
                      <option value="school">Samacheer / Singapore School Syllabus</option>
                      <option value="calligraphy">Classical Calligraphy &amp; AI</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-secondary mb-1">Learner Age Group</label>
                    <select
                      value={formData.ageGroup}
                      onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-paper-muted border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary"
                    >
                      <option value="adult">Adult (18+)</option>
                      <option value="teen">Teen (12-17)</option>
                      <option value="kid">Kid (4-11)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-secondary mb-1">Timezone</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-paper-muted border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary"
                    >
                      <option value="IST">India (IST)</option>
                      <option value="EST">USA East (EST)</option>
                      <option value="PST">USA West (PST)</option>
                      <option value="GMT">UK / Europe (GMT/CET)</option>
                      <option value="SGT">Singapore / Malaysia (SGT)</option>
                      <option value="AEST">Australia (AEST)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-secondary mb-1">Any specific questions or goals? (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your learning background, goals, or preferred times..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-paper-muted border border-border-subtle focus:border-vermilion focus:outline-none text-sm text-ink-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit &amp; Schedule Demo</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
