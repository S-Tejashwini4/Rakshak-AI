import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "login_title": "RAKSHAK AI",
      "login_subtitle": "Real-time Analytics for Knowledge-driven Security, Heuristic Assessment & Krime Intelligence",
      "login_button": "Login",
      "dashboard": "Dashboard",
      "ai_assistant": "AI Crime Assistant",
      "crime_search": "Crime Search",
      "case_details": "Case Details",
      "analytics": "Crime Analytics",
      "network": "Relationship Network",
      "heatmap": "Heat Maps",
      "forecasting": "Crime Forecasting",
      "reports": "Reports",
      "ai_welcome": "Welcome to the Rakshak AI Intelligence Assistant. How can I assist with your investigation today?",
      "ai_placeholder": "Ask about cases, offenders, or analytical insights...",
      "ai_export": "Export Report",
      "ai_analyzing": "Analyzing intelligence databases...",
      "ai_confidence": "Confidence Score",
      "ai_reasoning": "Reasoning Path",
      "ai_evidence": "Evidence References",
    }
  },
  kn: {
    translation: {
      "login_title": "RAKSHAK AI",
      "login_subtitle": "Real-time Analytics for Knowledge-driven Security, Heuristic Assessment & Crime Intelligence",
      "login_button": "ಲಾಗಿನ್ ಮಾಡಿ",
      "ai_welcome": "Rakshak AI ಇಂಟೆಲಿಜೆನ್ಸ್ ಅಸಿಸ್ಟೆಂಟ್‌ಗೆ ಸುಸ್ವಾಗತ. ಇಂದು ನಿಮ್ಮ ತನಿಖೆಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ?",
      "ai_placeholder": "ಪ್ರಕರಣಗಳು, ಅಪರಾಧಿಗಳು ಅಥವಾ ಒಳನೋಟಗಳ ಬಗ್ಗೆ ಕೇಳಿ...",
      "ai_export": "ವರದಿ ರಫ್ತು",
      "ai_analyzing": "ಡೇಟಾಬೇಸ್ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
      "ai_confidence": "ವಿಶ್ವಾಸಾರ್ಹತೆ ಸ್ಕೋರ್",
      "ai_reasoning": "ತಾರ್ಕಿಕ ಮಾರ್ಗ",
      "ai_evidence": "ಸಾಕ್ಷ್ಯಾಧಾರಗಳು",
    }
  },
  hi: {
    translation: {
      "login_title": "RAKSHAK AI",
      "login_subtitle": "Real-time Analytics for Knowledge-driven Security, Heuristic Assessment & Krime Intelligence",
      "login_button": "लॉग इन करें",
      "ai_welcome": "Rakshak AI इंटेलिजेंस असिस्टेंट में आपका स्वागत है। आज मैं आपकी जांच में कैसे मदद कर सकता हूं?",
      "ai_placeholder": "मामलों, अपराधियों या अंतर्दृष्टि के बारे में पूछें...",
      "ai_export": "रिपोर्ट निर्यात करें",
      "ai_analyzing": "डेटाबेस का विश्लेषण किया जा रहा है...",
      "ai_confidence": "विश्वास स्कोर",
      "ai_reasoning": "तर्क मार्ग",
      "ai_evidence": "साक्ष्य संदर्भ",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
