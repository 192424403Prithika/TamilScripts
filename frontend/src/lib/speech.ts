/**
 * Web Speech API Voice synthesizer with fallback for Tamil (ta-IN)
 */

export function speakTamilText(text: string, rate: number = 0.9): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      resolve();
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ta-IN";
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Look for dedicated Tamil voice if present
    const voices = window.speechSynthesis.getVoices();
    const tamilVoice = voices.find(v => v.lang.includes("ta") || v.lang.includes("TAM"));
    if (tamilVoice) {
      utterance.voice = tamilVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.warn("Speech error:", e);
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}
