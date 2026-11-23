/**
 * Web Speech API helper for Tamil Text-to-Speech (ta-IN).
 * Falls back gracefully if speech synthesis is not supported.
 */

export function speakTamil(text: string, rate: number = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ta-IN';
      utterance.rate = rate;

      const voices = window.speechSynthesis.getVoices();
      const taVoice = voices.find((v) => v.lang.toLowerCase().includes('ta'));
      if (taVoice) {
        utterance.voice = taVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

export const speakTamilText = speakTamil;
