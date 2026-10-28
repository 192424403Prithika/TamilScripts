export type Lang = 'en' | 'ta';

export const translations = {
  en: {
    appTitle: "TamilScript AI",
    tagline: "Real-time Handwritten Tamil Recognition & Neural Generation",
    nav: {
      home: "Home",
      recognize: "Recognize",
      generate: "Generate",
      synthesis: "Text-to-Handwriting",
      coach: "Practice Coach",
      scanner: "Page Scanner",
      quiz: "Learn & Quiz",
      dashboard: "Dashboard",
      history: "History",
      settings: "Settings",
      about: "About"
    },
    canvas: {
      clear: "Clear Canvas",
      undo: "Undo Stroke",
      redo: "Redo",
      brushSize: "Brush Size",
      grid: "Toggle Grid",
      listen: "Speak Character",
      whyPrediction: "Why this prediction? (Grad-CAM)",
      scribbleWarning: "Warning: Scribble / Non-Tamil stroke detected",
      drawHere: "Draw any Tamil character here with touch, mouse or stylus..."
    },
    predictions: {
      title: "Neural Predictions",
      topPrediction: "Top Glyph",
      confidence: "Confidence",
      transliteration: "Transliteration",
      unicode: "Unicode",
      meaning: "Phonetic / Meaning",
      waitingForStrokes: "Start drawing to see real-time inference (< 50ms)..."
    },
    coach: {
      title: "Handwriting Practice Coach",
      subtitle: "Draw the target character inside the guide box for instant AI diagnostic feedback.",
      overallScore: "Quality Score",
      proportions: "Proportions",
      loops: "Loop Closure",
      smoothness: "Stroke Smoothness",
      nextChar: "Next Letter",
      streak: "Day Streak",
      tryAgain: "Try Again"
    },
    synthesis: {
      title: "Neural Handwriting Synthesis",
      subtitle: "Type Tamil words or sentences to watch them written in realistic animated ink strokes.",
      inputPlaceholder: "Type Tamil here or click keys below...",
      speed: "Stroke Speed",
      neatness: "Sampling Neatness (Bias)",
      slant: "Pen Slant",
      inkColor: "Ink Color",
      animate: "Generate Handwriting",
      downloadSvg: "Download SVG"
    },
    scanner: {
      title: "Handwritten Page Scanner & OCR",
      subtitle: "Upload documents or notes to automatically denoise, segment lines, and convert to digital text.",
      upload: "Upload Document Photo",
      enhance: "Neural Contrast & Shadow Removal",
      extract: "Extract Text",
      recognizedText: "Digital Output (Unicode)",
      copy: "Copy Text"
    }
  },
  ta: {
    appTitle: "தமிழ்ஸ்கிரிப்ட் AI",
    tagline: "நேரலை தமிழ் கையெழுத்து அறிதல் மற்றும் நரம்பியல் உருவாக்கம்",
    nav: {
      home: "முகப்பு",
      recognize: "அறிதல்",
      generate: "உருவாக்கு",
      synthesis: "எழுத்து-வரைதல்",
      coach: "பயிற்சி பயிற்றுநர்",
      scanner: "ஆவண ஸ்கேனர்",
      quiz: "விளையாட்டு & வினாடி",
      dashboard: "செயல்திறன் பலகை",
      history: "வரலாறு",
      settings: "அமைப்புகள்",
      about: "பற்றி"
    },
    canvas: {
      clear: "அழி",
      undo: "மீளமை",
      redo: "மீண்டும் செய்",
      brushSize: "தூரிகை அளவு",
      grid: "கட்டம் மாற்று",
      listen: "எழுத்தை ஒலி செய்",
      whyPrediction: "ஏன் இந்த கணிப்பு? (Grad-CAM)",
      scribbleWarning: "எச்சரிக்கை: முறையற்ற கிறுக்கல் கண்டறியப்பட்டது",
      drawHere: "இங்கு உங்கள் விரல் அல்லது மவுஸ் கொண்டு தமிழ் எழுத்து வரைக..."
    },
    predictions: {
      title: "நரம்பியல் கணிப்புகள்",
      topPrediction: "முதன்மை எழுத்து",
      confidence: "நம்பகத்தன்மை",
      transliteration: "ஆங்கில ஒலிப்பு",
      unicode: "யூனிகோட்",
      meaning: "பொருள் / விளக்கம்",
      waitingForStrokes: "நேரலை கணிப்பைக் காண வரையத் தொடங்குங்கள் (< 50 மி.வி)..."
    },
    coach: {
      title: "கையெழுத்து பயிற்சி பயிற்றுநர்",
      subtitle: "இலக்கு எழுத்தை வழிகாட்டி பெட்டியில் எழுதி உடனடி AI மதிப்பீட்டைப் பெறுங்கள்.",
      overallScore: "தர மதிப்பெண்",
      proportions: "அளவு விகிதம்",
      loops: "வளைவு முழுமை",
      smoothness: "மென்மை",
      nextChar: "அடுத்த எழுத்து",
      streak: "தொடர் நாட்கள்",
      tryAgain: "மீண்டும் முயற்சி"
    },
    synthesis: {
      title: "நரம்பியல் கையெழுத்து உருவாக்கம்",
      subtitle: "தமிழ் சொற்களை உள்ளிடவும், அவை உயிருள்ள கையெழுத்து கோடுகளாக வரையப்படுவதைக் காணவும்.",
      inputPlaceholder: "இங்கு தமிழில் தட்டச்சு செய்யவும்...",
      speed: "வரைதல் வேகம்",
      neatness: "கையெழுத்து ஒழுங்கு",
      slant: "சாய்வு",
      inkColor: "மை நிறம்",
      animate: "கையெழுத்தை உருவாக்கு",
      downloadSvg: "SVG தரவிறக்கு"
    },
    scanner: {
      title: "கையெழுத்து ஆவண ஸ்கேனர்",
      subtitle: "புகைப்படங்களை பதிவேற்றி தானாக நிழல்களை நீக்கி, வரிகளைப் பிரித்து டிஜிட்டல் உரையாக மாற்றவும்.",
      upload: "படத்தை பதிவேற்று",
      enhance: "நிழல் நீக்கம் & தெளிவுபடுத்துதல்",
      extract: "உரையைப் பிரித்தெடு",
      recognizedText: "டிஜிட்டல் உரை (யூனிகோட்)",
      copy: "பிரதி எடு"
    }
  }
};
