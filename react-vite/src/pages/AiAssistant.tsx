import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Download, ShieldCheck, Cpu, Mic, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useToastStore } from '../store/toastStore';
import { useCaseStore } from '../store/caseStore';
import { useTimelineStore } from '../store/timelineStore';
import axios from 'axios';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  confidence?: string;
  reasoning?: string;
  evidence?: string[];
}

const getMockResponse = (query: string, lang: string, timelineEvents: any[] = []) => {
  const q = query.toLowerCase();
  const resLang = lang === 'kn' ? 'kn' : (lang === 'hi' ? 'hi' : 'en');
  
  // Detect city dynamically for more contextual responses
  let cityEn = 'the area';
  let cityKn = 'ಪ್ರದೇಶ';
  let cityHi = 'क्षेत्र';
  
  if (q.includes('bangalore') || q.includes('ಬೆಂಗಳೂರು') || q.includes('बैंगलोर')) {
    cityEn = 'Bangalore';
    cityKn = 'ಬೆಂಗಳೂರು';
    cityHi = 'बैंगलोर';
  } else if (q.includes('mysore') || q.includes('ಮೈಸೂರು') || q.includes('मैसूर')) {
    cityEn = 'Mysore';
    cityKn = 'ಮೈಸೂರು';
    cityHi = 'मैसूर';
  }
  
  if (q.includes('robbery') || q.includes('burglary') || q.includes('bulgairy') || q.includes('ದರೋಡೆ') || q.includes('डकैती')) {
    const res = {
      en: {
        text: `I have identified 14 relevant case files regarding this in ${cityEn}. The primary hotspot appears to be the central district with an 85% correlation to previous gang activities.`,
        reasoning: 'Correlated location data from recent mobile tower dumps with known offender addresses.',
        evidence: [`FIR 104430006202600001 (${cityEn} Central)`, 'CCTV Footage (Main Road)']
      },
      kn: {
        text: `${cityKn}ನಲ್ಲಿ 14 ಪ್ರಸ್ತುತ ಪ್ರಕರಣಗಳನ್ನು ನಾನು ಗುರುತಿಸಿದ್ದೇನೆ. ಪ್ರಾಥಮಿಕ ಹಾಟ್‌ಸ್ಪಾಟ್ ಕೇಂದ್ರ ಜಿಲ್ಲೆಯಾಗಿದ್ದು, ಹಿಂದಿನ ಗ್ಯಾಂಗ್ ಚಟುವಟಿಕೆಗಳಿಗೆ 85% ಸಂಬಂಧವನ್ನು ಹೊಂದಿದೆ.`,
        reasoning: 'ಇತ್ತೀಚಿನ ಮೊಬೈಲ್ ಟವರ್ ಡಂಪ್‌ಗಳಿಂದ ಸ್ಥಳದ ಡೇಟಾವನ್ನು ತಿಳಿದಿರುವ ಅಪರಾಧಿಗಳ ವಿಳಾಸಗಳೊಂದಿಗೆ ಹೋಲಿಸಲಾಗಿದೆ.',
        evidence: [`ಎಫ್‌ಐಆರ್ 104430006202600001 (${cityKn} ಸೆಂಟ್ರಲ್)`, 'ಸಿಸಿಟಿವಿ ದೃಶ್ಯ']
      },
      hi: {
        text: `मैंने ${cityHi} में 14 प्रासंगिक मामले की फाइलों की पहचान की है। प्राथमिक हॉटस्पॉट मध्य जिला प्रतीत होता है जिसका पिछली गिरोह की गतिविधियों से 85% संबंध है।`,
        reasoning: 'ज्ञात अपराधी पतों के साथ हाल के मोबाइल टावर डंप से संबंधित स्थान डेटा।',
        evidence: [`FIR 104430006202600001 (${cityHi} सेंट्रल)`, 'सीसीटीवी फुटेज']
      }
    };
    return res[resLang];
  }

  if (q.includes('repeat offender') || q.includes('ಪುನರಾವರ್ತಿತ ಅಪರಾಧಿಗಳು') || q.includes('आदतन अपराधी')) {
    const res = {
      en: {
        text: `There are 45 known repeat offenders currently active in ${cityEn}. Cross-referencing recent bail records shows 5 individuals match the recent MO.`,
        reasoning: 'Entity matching on Name, Age, and Modus Operandi across historical FIR databases.',
        evidence: ['Bail Registry 2026', 'FIR 104430006202600002']
      },
      kn: {
        text: `${cityKn}ನಲ್ಲಿ ಪ್ರಸ್ತುತ 45 ಪುನರಾವರ್ತಿತ ಅಪರಾಧಿಗಳು ಸಕ್ರಿಯರಾಗಿದ್ದಾರೆ. ಇತ್ತೀಚಿನ ಜಾಮೀನು ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿದಾಗ, 5 ವ್ಯಕ್ತಿಗಳು ಇತ್ತೀಚಿನ ಅಪರಾಧ ಶೈಲಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಾರೆ.`,
        reasoning: 'ಹಿಂದಿನ ಎಫ್‌ಐಆರ್ ಡೇಟಾಬೇಸ್‌ಗಳಲ್ಲಿ ಹೆಸರು, ವಯಸ್ಸು ಮತ್ತು ಅಪರಾಧ ಶೈಲಿಯ ಆಧಾರದ ಮೇಲೆ ಅಸ್ತಿತ್ವದ ಹೊಂದಾಣಿಕೆ.',
        evidence: ['ಜಾಮೀನು ನೋಂದಣಿ 2026', 'ಎಫ್‌ಐಆರ್ 104430006202600002']
      },
      hi: {
        text: `${cityHi} में वर्तमान में 45 ज्ञात आदतन अपराधी सक्रिय हैं। हाल के जमानत रिकॉर्ड के क्रॉस-रेफरेंसिंग से पता चलता है कि 5 व्यक्ति हाल के एमओ से मेल खाते हैं।`,
        reasoning: 'ऐतिहासिक एफआईआर डेटाबेस में नाम, आयु और मोडस ऑपरेंडी पर इकाई मिलान।',
        evidence: ['जमानत रजिस्ट्री 2026', 'FIR 104430006202600002']
      }
    };
    return res[resLang];
  }

  if (q.includes('face') || q.includes('emotion') || q.includes('smile') || q.includes('male') || q.includes('age') || q.includes('suspect')) {
    // DYNAMIC REAL-TIME RESPONSE BASED ON RECENT ACTIONS!
    const recentFaceEvent = timelineEvents.find(e => e.title === 'Facial Intelligence Logged');
    
    if (recentFaceEvent) {
      const res = {
        en: {
          text: `I cross-referenced the global database. I found a direct hit based on the facial intelligence you recently processed! The suspect (Male, aged 20-29) is strongly linked to Case ${recentFaceEvent.caseId} in ${cityEn}.`,
          reasoning: `Real-time biometric vector match (99% confidence) against recently processed evidence at ${recentFaceEvent.time}.`,
          evidence: [`Recent AI Intelligence Upload`, `Target Case ID: ${recentFaceEvent.caseId}`, `Suspect Name: Ravi Kumar`]
        },
        kn: {
          text: `ನಾನು ಜಾಗತಿಕ ಡೇಟಾಬೇಸ್ ಅನ್ನು ಪರಿಶೀಲಿಸಿದ್ದೇನೆ. ನೀವು ಇತ್ತೀಚೆಗೆ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಿದ ಮುಖದ ಗುಪ್ತಚರ ಆಧಾರದ ಮೇಲೆ ನೇರ ಹೊಂದಾಣಿಕೆ ಕಂಡುಬಂದಿದೆ! ಶಂಕಿತನು ${cityKn}ನಲ್ಲಿನ ಪ್ರಕರಣ ${recentFaceEvent.caseId} ಗೆ ಬಲವಾಗಿ ಸಂಬಂಧ ಹೊಂದಿದ್ದಾನೆ.`,
          reasoning: `ಇತ್ತೀಚೆಗೆ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಿದ ಪುರಾವೆಗಳ ವಿರುದ್ಧ ನೈಜ-ಸಮಯದ ಬಯೋಮೆಟ್ರಿಕ್ ವೆಕ್ಟರ್ ಹೊಂದಾಣಿಕೆ (99% ವಿಶ್ವಾಸ).`,
          evidence: [`ಇತ್ತೀಚಿನ ಎಐ ಇಂಟೆಲಿಜೆನ್ಸ್ ಅಪ್‌ಲೋಡ್`, `ಪ್ರಕರಣ ಐಡಿ: ${recentFaceEvent.caseId}`]
        },
        hi: {
          text: `मैंने वैश्विक डेटाबेस को क्रॉस-रेफरेंस किया है। आपके द्वारा हाल ही में संसाधित चेहरे की खुफिया जानकारी के आधार पर एक सीधा मिलान मिला! संदिग्ध ${cityHi} में मामले ${recentFaceEvent.caseId} से मजबूती से जुड़ा है।`,
          reasoning: `हाल ही में संसाधित साक्ष्य के विरुद्ध वास्तविक समय बायोमेट्रिक वेक्टर मैच (99% विश्वास)।`,
          evidence: [`हाल ही का एआई इंटेलिजेंस अपलोड`, `टारगेट केस आईडी: ${recentFaceEvent.caseId}`]
        }
      };
      return res[resLang];
    } else {
      const res = {
        en: {
          text: 'I have analyzed the visual evidence in the historical database. I detected 12 faces in the requested dataset. Filtering by your parameters reveals 3 matches (2 Males aged 25-35 showing aggressive emotions, and 1 Female showing fear).',
          reasoning: 'Zoho Zia Face Analytics cross-referenced with demographic filtering and emotion classification thresholds.',
          evidence: ['Face ID: FID-88392 (CCTV-MG-Road)', 'Face ID: FID-88394 (FIR Photo)']
        },
        kn: {
          text: 'ನಾನು ದೃಶ್ಯ ಪುರಾವೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿದ್ದೇನೆ. ವಿನಂತಿಸಿದ ಡೇಟಾಸೆಟ್‌ನಲ್ಲಿ ನಾನು 12 ಮುಖಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಿದ್ದೇನೆ. ನಿಮ್ಮ ನಿಯತಾಂಕಗಳ ಮೂಲಕ ಫಿಲ್ಟರ್ ಮಾಡಿದಾಗ 3 ಹೊಂದಾಣಿಕೆಗಳು ಕಂಡುಬರುತ್ತವೆ.',
          reasoning: 'Zoho Zia ಮುಖ ವಿಶ್ಲೇಷಣೆ, ಜನಸಂಖ್ಯಾ ಫಿಲ್ಟರಿಂಗ್ ಮತ್ತು ಭಾವನೆ ವರ್ಗೀಕರಣ ಮಿತಿಗಳೊಂದಿಗೆ ಕ್ರಾಸ್-ರೆಫರೆನ್ಸ್ ಮಾಡಲಾಗಿದೆ.',
          evidence: ['ಮುಖ ಐಡಿ: FID-88392 (CCTV-MG-Road)', 'ಮುಖ ಐಡಿ: FID-88394 (FIR ಫೋಟೋ)']
        },
        hi: {
          text: 'मैंने दृश्य साक्ष्य का विश्लेषण किया है। मैंने अनुरोधित डेटासेट में 12 चेहरों का पता लगाया। आपके मापदंडों द्वारा फ़िल्टर करने पर 3 मिलान सामने आते हैं।',
          reasoning: 'ज़ोहो ज़िया फेस एनालिटिक्स जनसांख्यिकीय फ़िल्टरिंग और भावना वर्गीकरण थ्रेसहोल्ड के साथ क्रॉस-रेफरेंस किया गया।',
          evidence: ['चेहरा आईडी: FID-88392 (CCTV-MG-Road)', 'चेहरा आईडी: FID-88394 (FIR फोटो)']
        }
      };
      return res[resLang];
    }
  }

  if (q.includes('document') || q.includes('ocr') || q.includes('summarize') || q.includes('handwritten') || q.includes('fir')) {
    const res = {
      en: {
        text: 'I have processed the requested documents using Zoho Zia OCR. The handwritten FIR (202600001) summarizes a cyber theft incident. I extracted 3 key entities: Victim (Ramesh Kumar), Date (30th June), and Vehicle (KA-01-XX-9999).',
        reasoning: 'Multilingual OCR pipeline engaged with 96% confidence. Named Entity Recognition (NER) applied to structured text output.',
        evidence: ['Document ID: DOC-9921 (Handwritten FIR)', 'Document ID: DOC-9923 (Vehicle RC)']
      },
      kn: {
        text: 'ನಾನು ಜೋಹೋ ಜಿಯಾ ಒಸಿಆರ್ ಬಳಸಿ ವಿನಂತಿಸಿದ ದಾಖಲೆಗಳನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಿದ್ದೇನೆ. ಕೈಬರಹದ ಎಫ್‌ಐಆರ್ (202600001) ಸೈಬರ್ ಕಳ್ಳತನದ ಘಟನೆಯನ್ನು ಸಾರಾಂಶಗೊಳಿಸುತ್ತದೆ. ನಾನು 3 ಪ್ರಮುಖ ಘಟಕಗಳನ್ನು ಹೊರತೆಗೆದಿದ್ದೇನೆ: ಸಂತ್ರಸ್ತ (ರಮೇಶ್ ಕುಮಾರ್), ದಿನಾಂಕ (ಜೂನ್ 30), ಮತ್ತು ವಾಹನ (KA-01-XX-9999).',
        reasoning: '96% ವಿಶ್ವಾಸಾರ್ಹತೆಯೊಂದಿಗೆ ಬಹುಭಾಷಾ ಒಸಿಆರ್ ಪೈಪ್‌ಲೈನ್ ಬಳಸಲಾಗಿದೆ. ರಚನಾತ್ಮಕ ಪಠ್ಯಕ್ಕೆ ಹೆಸರಿಸಲಾದ ಘಟಕ ಗುರುತಿಸುವಿಕೆ (NER) ಅನ್ವಯಿಸಲಾಗಿದೆ.',
        evidence: ['ದಾಖಲೆ ಐಡಿ: DOC-9921 (ಕೈಬರಹದ ಎಫ್‌ಐಆರ್)', 'ದಾಖಲೆ ಐಡಿ: DOC-9923 (ವಾಹನ ಆರ್‌ಸಿ)']
      },
      hi: {
        text: 'मैंने ज़ोहो ज़िया ओसीआर का उपयोग करके अनुरोधित दस्तावेजों को संसाधित किया है। हस्तलिखित एफआईआर (202600001) एक साइबर चोरी की घटना का सारांश देता है। मैंने 3 प्रमुख संस्थाओं को निकाला: पीड़ित (रमेश कुमार), दिनांक (30 जून), और वाहन (KA-01-XX-9999)।',
        reasoning: '96% विश्वास के साथ बहुभाषी ओसीआर पाइपलाइन लगी हुई है। संरचित पाठ आउटपुट पर नामित इकाई पहचान (NER) लागू की गई।',
        evidence: ['दस्तावेज़ आईडी: DOC-9921 (हस्तलिखित एफआईआर)', 'दस्तावेज़ आईडी: DOC-9923 (वाहन आरसी)']
      }
    };
    return res[resLang];
  }

  if (q.includes('moderation') || q.includes('safe') || q.includes('gore') || q.includes('violence') || q.includes('flag')) {
    const res = {
      en: {
        text: 'I have analyzed the moderation logs. This week, 345 images were flagged by the Zia Evidence Safety Engine for manual review. EVID-3301 was restricted due to Graphic Violence (98% confidence).',
        reasoning: 'Queried the Image Moderation Quarantine Queue. Filtered for High Risk and Restricted items.',
        evidence: ['Moderation ID: EVID-3301', 'Moderation Report: Weekly Trends']
      },
      kn: {
        text: 'ನಾನು ಮಿತಗೊಳಿಸುವಿಕೆ ಲಾಗ್‌ಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿದ್ದೇನೆ. ಈ ವಾರ, 345 ಚಿತ್ರಗಳನ್ನು ಜಿಯಾ ಎವಿಡೆನ್ಸ್ ಸೇಫ್ಟಿ ಎಂಜಿನ್ ಕೈಯಾರೆ ಪರಿಶೀಲನೆಗಾಗಿ ಫ್ಲ್ಯಾಗ್ ಮಾಡಿದೆ. EVID-3301 ಅನ್ನು ಗ್ರಾಫಿಕ್ ಹಿಂಸೆಯ ಕಾರಣದಿಂದಾಗಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ (98% ವಿಶ್ವಾಸ).',
        reasoning: 'ಚಿತ್ರ ಮಿತಗೊಳಿಸುವಿಕೆ ಕ್ವಾರಂಟೈನ್ ಕ್ಯೂ ಅನ್ನು ಪ್ರಶ್ನಿಸಲಾಗಿದೆ. ಹೆಚ್ಚಿನ ಅಪಾಯ ಮತ್ತು ನಿರ್ಬಂಧಿತ ವಸ್ತುಗಳಿಗೆ ಫಿಲ್ಟರ್ ಮಾಡಲಾಗಿದೆ.',
        evidence: ['ಮಿತಗೊಳಿಸುವಿಕೆ ಐಡಿ: EVID-3301', 'ಮಿತಗೊಳಿಸುವಿಕೆ ವರದಿ: ಸಾಪ್ತಾಹಿಕ ಪ್ರವೃತ್ತಿಗಳು']
      },
      hi: {
        text: 'मैंने मॉडरेशन लॉग का विश्लेषण किया है। इस सप्ताह, जिया एविडेंस सेफ्टी इंजन द्वारा 345 छवियों को मैन्युअल समीक्षा के लिए फ़्लैग किया गया था। ग्राफिक हिंसा (98% विश्वास) के कारण EVID-3301 को प्रतिबंधित किया गया था।',
        reasoning: 'इमेज मॉडरेशन क्वारंटाइन कतार से पूछताछ की गई। उच्च जोखिम और प्रतिबंधित वस्तुओं के लिए फ़िल्टर किया गया।',
        evidence: ['मॉडरेशन आईडी: EVID-3301', 'मॉडरेशन रिपोर्ट: साप्ताहिक रुझान']
      }
    };
    return res[resLang];
  }

  if (q.includes('cyber') || q.includes('phishing') || q.includes('crypto') || q.includes('upi') || q.includes('fraud')) {
    const res = {
      en: {
        text: `I detected 18 new instances of UPI/Cyber fraud in ${cityEn} linking to a single offshore crypto wallet. The Modus Operandi matches a known interstate syndicate.`,
        reasoning: 'Cross-referenced financial transaction logs and IP addresses with national cybercrime databases.',
        evidence: ['Wallet ID: 0x892...', 'Cyber Complaint: CYB-2026-991']
      },
      kn: {
        text: `${cityKn}ನಲ್ಲಿ 18 ಹೊಸ ಯುಪಿಐ/ಸೈಬರ್ ವಂಚನೆ ಪ್ರಕರಣಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಲಾಗಿದೆ, ಇವು ಒಂದೇ ಆಫ್‌ಶೋರ್ ಕ್ರಿಪ್ಟೋ ವ್ಯಾಲೆಟ್‌ಗೆ ಸಂಪರ್ಕ ಹೊಂದಿವೆ.`,
        reasoning: 'ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಕ್ರೈಮ್ ಡೇಟಾಬೇಸ್‌ಗಳೊಂದಿಗೆ ಹಣಕಾಸು ವಹಿವಾಟು ಲಾಗ್‌ಗಳು ಮತ್ತು ಐಪಿ ವಿಳಾಸಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.',
        evidence: ['ವ್ಯಾಲೆಟ್ ಐಡಿ: 0x892...', 'ಸೈಬರ್ ದೂರು: CYB-2026-991']
      },
      hi: {
        text: `मैंने ${cityHi} में यूपीआई/साइबर धोखाधड़ी के 18 नए मामलों का पता लगाया है जो एक ही ऑफशोर क्रिप्टो वॉलेट से जुड़े हैं।`,
        reasoning: 'राष्ट्रीय साइबर अपराध डेटाबेस के साथ वित्तीय लेनदेन लॉग और आईपी पते को क्रॉस-रेफरेंस किया गया।',
        evidence: ['वॉलेट आईडी: 0x892...', 'साइबर शिकायत: CYB-2026-991']
      }
    };
    return res[resLang];
  }

  if (q.includes('missing') || q.includes('kidnap') || q.includes('child') || q.includes('person')) {
    const res = {
      en: {
        text: `I have cross-referenced the missing persons database for ${cityEn}. 3 matches found for the description. 2 were last seen near the central railway station based on facial recognition hits.`,
        reasoning: 'Matched reported descriptions with live transit CCTV feeds using Zia Face Analytics.',
        evidence: ['Alert ID: MP-2026-44', 'CCTV Frame: Railway Station Platform 4']
      },
      kn: {
        text: `${cityKn}ಗಾಗಿ ನಾಪತ್ತೆಯಾದ ವ್ಯಕ್ತಿಗಳ ಡೇಟಾಬೇಸ್ ಅನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ವಿವರಣೆಗೆ 3 ಹೊಂದಾಣಿಕೆಗಳು ಕಂಡುಬಂದಿವೆ. 2 ವ್ಯಕ್ತಿಗಳನ್ನು ಕೊನೆಯದಾಗಿ ಕೇಂದ್ರ ರೈಲು ನಿಲ್ದಾಣದ ಬಳಿ ನೋಡಲಾಗಿದೆ.`,
        reasoning: 'ಜಿಯಾ ಫೇಸ್ ಅನಾಲಿಟಿಕ್ಸ್ ಬಳಸಿ ಲೈವ್ ಟ್ರಾನ್ಸಿಟ್ ಸಿಸಿಟಿವಿ ಫೀಡ್‌ಗಳೊಂದಿಗೆ ವರದಿ ಮಾಡಲಾದ ವಿವರಣೆಗಳನ್ನು ಹೊಂದಿಸಲಾಗಿದೆ.',
        evidence: ['ಎಚ್ಚರಿಕೆ ಐಡಿ: MP-2026-44', 'ಸಿಸಿಟಿವಿ ಫ್ರೇಮ್: ರೈಲು ನಿಲ್ದಾಣ']
      },
      hi: {
        text: `मैंने ${cityHi} के लिए लापता व्यक्तियों के डेटाबेस को क्रॉस-रेफरेंस किया है। विवरण के लिए 3 मिलान मिले। 2 को आखिरी बार केंद्रीय रेलवे स्टेशन के पास देखा गया था।`,
        reasoning: 'ज़िया फेस एनालिटिक्स का उपयोग करके लाइव ट्रांज़िट सीसीटीवी फ़ीड के साथ रिपोर्ट किए गए विवरणों का मिलान किया गया।',
        evidence: ['अलर्ट आईडी: MP-2026-44', 'सीसीटीवी फ्रेम: रेलवे स्टेशन']
      }
    };
    return res[resLang];
  }

  if (q.includes('drugs') || q.includes('narcotics') || q.includes('smuggling') || q.includes('weed') || q.includes('cocaine')) {
    const res = {
      en: {
        text: `Analysis of recent drug busts in ${cityEn} reveals a 40% increase in synthetic narcotics. The supply chain correlates with 3 specific commercial transport companies.`,
        reasoning: 'NLP analysis on interrogation transcripts and seized vehicle manifests.',
        evidence: ['Intelligence Report: NARCO-2026', 'Vehicle Manifests (3 Operators)']
      },
      kn: {
        text: `${cityKn}ನಲ್ಲಿ ಇತ್ತೀಚಿನ ಡ್ರಗ್ಸ್ ದಾಳಿಗಳ ವಿಶ್ಲೇಷಣೆಯು ಸಿಂಥೆಟಿಕ್ ಮಾದಕವಸ್ತುಗಳಲ್ಲಿ 40% ಹೆಚ್ಚಳವನ್ನು ಬಹಿರಂಗಪಡಿಸುತ್ತದೆ. ಪೂರೈಕೆ ಸರಪಳಿಯು 3 ನಿರ್ದಿಷ್ಟ ವಾಣಿಜ್ಯ ಸಾರಿಗೆ ಕಂಪನಿಗಳೊಂದಿಗೆ ಸಂಬಂಧ ಹೊಂದಿದೆ.`,
        reasoning: 'ವಿಚಾರಣೆಯ ಪ್ರತಿಗಳು ಮತ್ತು ವಶಪಡಿಸಿಕೊಂಡ ವಾಹನಗಳ ಮ್ಯಾನಿಫೆಸ್ಟ್‌ಗಳ ಮೇಲೆ ಎನ್‌ಎಲ್‌ಪಿ ವಿಶ್ಲೇಷಣೆ.',
        evidence: ['ಗುಪ್ತಚರ ವರದಿ: NARCO-2026', 'ವಾಹನ ಮ್ಯಾನಿಫೆಸ್ಟ್‌ಗಳು']
      },
      hi: {
        text: `${cityHi} में हाल ही में नशीली दवाओं की छापेमारी के विश्लेषण से सिंथेटिक नशीले पदार्थों में 40% की वृद्धि का पता चलता है। आपूर्ति श्रृंखला 3 विशिष्ट वाणिज्यिक परिवहन कंपनियों के साथ सहसंबंधित है।`,
        reasoning: 'पूछताछ टेप और जब्त वाहन मैनिफ़ेस्ट पर एनएलपी विश्लेषण।',
        evidence: ['खुफिया रिपोर्ट: NARCO-2026', 'वाहन मैनिफ़ेस्ट']
      }
    };
    return res[resLang];
  }

  if (q.includes('gang') || q.includes('mafia') || q.includes('syndicate') || q.includes('network')) {
    const res = {
      en: {
        text: `Graph Network Analysis shows 3 rival syndicates currently competing for territory in ${cityEn}. 15 recent violent incidents are directly linked to this conflict.`,
        reasoning: 'Link Analysis (Relationship Network) across multiple FIRs, identified co-accused clusters.',
        evidence: ['Network Graph: GANG-WAR-26', 'Aggregated FIRs (15 Count)']
      },
      kn: {
        text: `ಗ್ರಾಫ್ ನೆಟ್‌ವರ್ಕ್ ವಿಶ್ಲೇಷಣೆಯು ${cityKn}ನಲ್ಲಿ 3 ಪ್ರತಿಸ್ಪರ್ಧಿ ಸಿಂಡಿಕೇಟ್‌ಗಳು ಪ್ರಸ್ತುತ ಪ್ರದೇಶಕ್ಕಾಗಿ ಸ್ಪರ್ಧಿಸುತ್ತಿರುವುದನ್ನು ತೋರಿಸುತ್ತದೆ. ಇತ್ತೀಚಿನ 15 ಹಿಂಸಾತ್ಮಕ ಘಟನೆಗಳು ಈ ಸಂಘರ್ಷಕ್ಕೆ ನೇರವಾಗಿ ಸಂಬಂಧಿಸಿವೆ.`,
        reasoning: 'ಬಹು ಎಫ್‌ಐಆರ್‌ಗಳಾದ್ಯಂತ ಲಿಂಕ್ ವಿಶ್ಲೇಷಣೆ (ಸಂಬಂಧ ನೆಟ್‌ವರ್ಕ್), ಸಹ-ಆರೋಪಿಗಳ ಕ್ಲಸ್ಟರ್‌ಗಳನ್ನು ಗುರುತಿಸಲಾಗಿದೆ.',
        evidence: ['ನೆಟ್‌ವರ್ಕ್ ಗ್ರಾಫ್: GANG-WAR-26', 'ಒಟ್ಟು ಎಫ್‌ಐಆರ್‌ಗಳು (15 ಎಣಿಕೆ)']
      },
      hi: {
        text: `ग्राफ नेटवर्क विश्लेषण से पता चलता है कि 3 प्रतिद्वंद्वी सिंडिकेट वर्तमान में ${cityHi} में क्षेत्र के लिए प्रतिस्पर्धा कर रहे हैं। 15 हालिया हिंसक घटनाएं सीधे इस संघर्ष से जुड़ी हैं।`,
        reasoning: 'कई एफआईआर में लिंक विश्लेषण (संबंध नेटवर्क), सह-आरोपी समूहों की पहचान की गई।',
        evidence: ['नेटवर्क ग्राफ: GANG-WAR-26', 'कुल एफआईआर (15 गिनती)']
      }
    };
    return res[resLang];
  }

  if (q.includes('object') || q.includes('vehicle') || q.includes('weapon') || q.includes('bag') || q.includes('detect')) {
    const res = {
      en: {
        text: 'I have queried the Visual Intelligence Engine. I found a cluster of 3 detections for a "Red Motorcycle" (Cluster ID: CL-992). The vehicle was spotted on MG Road CCTV and Indiranagar Junction across two separate active cases.',
        reasoning: 'Queried Object Intelligence database for bounding boxes classified as "Vehicle". Grouped by visual similarity clustering.',
        evidence: ['Cluster ID: CL-992', 'Object ID: OBJ-8821']
      },
      kn: {
        text: 'ನಾನು ದೃಶ್ಯ ಗುಪ್ತಚರ ಎಂಜಿನ್ ಅನ್ನು ಪ್ರಶ್ನಿಸಿದ್ದೇನೆ. ನಾನು "ಕೆಂಪು ಮೋಟಾರ್‌ಸೈಕಲ್" (ಕ್ಲಸ್ಟರ್ ಐಡಿ: ಸಿಎಲ್-992) ಗಾಗಿ 3 ಪತ್ತೆಗಳ ಸಮೂಹವನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ. ಎರಡು ಪ್ರತ್ಯೇಕ ಸಕ್ರಿಯ ಪ್ರಕರಣಗಳಲ್ಲಿ ವಾಹನವನ್ನು ಎಂಜಿ ರಸ್ತೆ ಸಿಸಿಟಿವಿ ಮತ್ತು ಇಂದಿರಾನಗರ ಜಂಕ್ಷನ್‌ನಲ್ಲಿ ಗುರುತಿಸಲಾಗಿದೆ.',
        reasoning: 'ಆಬ್ಜೆಕ್ಟ್ ಇಂಟೆಲಿಜೆನ್ಸ್ ಡೇಟಾಬೇಸ್ ಅನ್ನು "ವಾहन" ಎಂದು ವರ್ಗೀಕರಿಸಲಾದ ಬೌಂಡಿಂಗ್ ಬಾಕ್ಸ್‌ಗಳಿಗಾಗಿ ಪ್ರಶ್ನಿಸಲಾಗಿದೆ. ದೃಶ್ಯ ಹೋಲಿಕೆ ಕ್ಲಸ್ಟರಿಂಗ್ ಮೂಲಕ ಗುಂಪು ಮಾಡಲಾಗಿದೆ.',
        evidence: ['ಕ್ಲಸ್ಟರ್ ಐಡಿ: CL-992', 'ವಸ್ತು ಐಡಿ: OBJ-8821']
      },
      hi: {
        text: 'मैंने विजुअल इंटेलिजेंस इंजन से पूछताछ की है। मुझे "लाल मोटरसाइकिल" (क्लस्टर आईडी: सीएल-992) के लिए 3 डिटेक्शन का एक समूह मिला। वाहन को एमजी रोड सीसीटीवी और इंदिरानगर जंक्शन पर दो अलग-अलग सक्रिय मामलों में देखा गया था।',
        reasoning: 'ऑब्जेक्ट इंटेलिजेंस डेटाबेस को "वाहन" के रूप में वर्गीकृत बाउंडिंग बॉक्स के लिए पूछताछ की गई। दृश्य समानता क्लस्टरिंग द्वारा समूहीकृत।',
        evidence: ['क्लस्टर आईडी: CL-992', 'ऑब्जेक्ट आईडी: OBJ-8821']
      }
    };
    return res[resLang];
  }

  if (q.includes('barcode') || q.includes('qr') || q.includes('custody') || q.includes('evidence label') || q.includes('scan')) {
    const res = {
      en: {
        text: 'I scanned the requested barcode. It is a QR Code linked to Evidence Bag EVID-BAG-A42 for Case 104430006202600001. The chain of custody shows it was last transferred to Forensic Lab (Desk 4) by Insp. Ramesh.',
        reasoning: 'Zia Barcode Scanner decoded the image. Cross-referenced the decoded value with the Chain of Custody database.',
        evidence: ['Barcode ID: BAR-77192', 'Decoded Value: EVID-BAG-A42']
      },
      kn: {
        text: 'ನಾನು ವಿನಂತಿಸಿದ ಬಾರ್‌ಕೋಡ್ ಅನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ್ದೇನೆ. ಇದು 104430006202600001 ಪ್ರಕರಣಕ್ಕಾಗಿ ಎವಿಡೆನ್ಸ್ ಬ್ಯಾಗ್ EVID-BAG-A42 ಗೆ ಲಿಂಕ್ ಮಾಡಲಾದ ಕ್ಯೂಆರ್ ಕೋಡ್ ಆಗಿದೆ. ಇನ್ಸ್‌ಪೆಕ್ಟರ್ ರಮೇಶ್ ಅವರು ಇದನ್ನು ಕೊನೆಯದಾಗಿ ಫೋರೆನ್ಸಿಕ್ ಲ್ಯಾಬ್‌ಗೆ (ಡೆಸ್ಕ್ 4) ವರ್ಗಾಯಿಸಿದ್ದಾರೆ ಎಂದು ಚೈನ್ ಆಫ್ ಕಸ್ಟಡಿ ತೋರಿಸುತ್ತದೆ.',
        reasoning: 'ಜಿಯಾ ಬಾರ್‌ಕೋಡ್ ಸ್ಕ್ಯಾನರ್ ಚಿತ್ರವನ್ನು ಡಿಕೋಡ್ ಮಾಡಿದೆ. ಡಿಕೋಡ್ ಮಾಡಿದ ಮೌಲ್ಯವನ್ನು ಚೈನ್ ಆಫ್ ಕಸ್ಟಡಿ ಡೇಟಾಬೇಸ್‌ನೊಂದಿಗೆ ಅಡ್ಡ-ಉಲ್ಲೇಖಿಸಲಾಗಿದೆ.',
        evidence: ['ಬಾರ್‌ಕೋಡ್ ಐಡಿ: BAR-77192', 'ಡಿಕೋಡ್ ಮಾಡಿದ ಮೌಲ್ಯ: EVID-BAG-A42']
      },
      hi: {
        text: 'मैंने अनुरोधित बारकोड को स्कैन किया। यह केस 104430006202600001 के लिए एविडेंस बैग EVID-BAG-A42 से जुड़ा एक क्यूआर कोड है। चेन ऑफ कस्टडी से पता चलता है कि इसे आखिरी बार इंस्पेक्टर रमेश द्वारा फोरेंसिक लैब (डेस्क 4) में स्थानांतरित किया गया था।',
        reasoning: 'ज़िया बारकोड स्कैनर ने छवि को डिकोड किया। चेन ऑफ कस्टडी डेटाबेस के साथ डिकोड किए गए मूल्य को क्रॉस-रेफरेंस किया गया।',
        evidence: ['बारकोड आईडी: BAR-77192', 'डिकोड किया गया मूल्य: EVID-BAG-A42']
      }
    };
    return res[resLang];
  }

  // Default response
  const defaultRes = {
    en: {
      text: `Based on the latest intelligence database query regarding "${query}", I have processed the request. However, I need more specific keywords (like "Mysore" or "Bangalore") to provide a detailed match.`,
      reasoning: 'Semantic search executed across standard FIR fields.',
      evidence: ['Global Crime Index']
    },
    kn: {
      text: `"${query}" ಕುರಿತಾದ ಇತ್ತೀಚಿನ ಇಂಟೆಲಿಜೆನ್ಸ್ ಡೇಟಾಬೇಸ್ ಪ್ರಶ್ನೆಯ ಆಧಾರದ ಮೇಲೆ, ನಾನು ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಿದ್ದೇನೆ. ವಿವರವಾದ ಹೊಂದಾಣಿಕೆಯನ್ನು ಒದಗಿಸಲು ನನಗೆ ಹೆಚ್ಚು ನಿರ್ದಿಷ್ಟವಾದ ಕೀವರ್ಡ್‌ಗಳ ಅಗತ್ಯವಿದೆ (ಉದಾಹರಣೆಗೆ "ಮೈಸೂರು" ಅಥವಾ "ಬೆಂಗಳೂರು").`,
      reasoning: 'ಪ್ರಮಾಣಿತ ಎಫ್‌ಐಆರ್ ಕ್ಷೇತ್ರಗಳಾದ್ಯಂತ ಸೆಮ್ಯಾಂಟಿಕ್ ಹುಡುಕಾಟವನ್ನು ಕಾರ್ಯಗತಗೊಳಿಸಲಾಗಿದೆ.',
      evidence: ['ಜಾಗತಿಕ ಅಪರಾಧ ಸೂಚ್ಯಂಕ']
    },
    hi: {
      text: `"${query}" के संबंध में नवीनतम इंटेलिजेंस डेटाबेस क्वेरी के आधार पर, मैंने अनुरोध को संसाधित किया है। हालाँकि, विस्तृत मिलान प्रदान करने के लिए मुझे अधिक विशिष्ट कीवर्ड (जैसे "मैसूर" या "बैंगलोर") की आवश्यकता है।`,
      reasoning: 'मानक एफआईआर क्षेत्रों में निष्पादित सिमेंटिक खोज।',
      evidence: ['वैश्विक अपराध सूचकांक']
    }
  };
  return defaultRes[resLang];
};


const AiAssistant = () => {
  const { t, i18n } = useTranslation();
  const { events } = useTimelineStore();
  const { cases } = useCaseStore();
  const { addToast } = useToastStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: t('ai_welcome'),
      sender: 'ai',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle translation of initial welcome message when language changes
  useEffect(() => {
    setMessages(prev => prev.map(m => m.id === 1 ? { ...m, text: t('ai_welcome') } : m));
  }, [i18n.language, t]);

  const handleExport = async () => {
    if (!chatContainerRef.current) return;
    setIsExporting(true);
    
    const element = chatContainerRef.current;
    
    // Save original styles
    const originalOverflow = element.style.overflow;
    const originalHeight = element.style.height;
    
    try {
      // Temporarily expand container to capture everything without scrollbars/chopping
      element.style.overflow = 'visible';
      element.style.height = 'max-content';

      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0f1c', // Match dark theme bg
        scale: 2,
        logging: false,
        useCORS: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Standard A4 dimensions in mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image height based on A4 width to maintain aspect ratio
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if the chat is long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('Rakshak-AI-Intelligence-Report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // Restore original styles
      element.style.overflow = originalOverflow;
      element.style.height = originalHeight;
      setIsExporting(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) return;
    setIsListening(true);
    addToast('Voice command active. Listening...', 'info');
    setTimeout(() => {
      setInput(i18n.language === 'kn' ? 'ಮೈಸೂರಿನಲ್ಲಿರುವ ಎಲ್ಲಾ ದರೋಡೆ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸಿ' : 'Show all robbery cases in Mysore');
      setIsListening(false);
      addToast('Voice command processed.', 'success');
    }, 2500);
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const newUserMsg: Message = { id: Date.now(), text, sender: 'user' };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Hit real backend endpoint which queries ZCQL and passes to QuickML
      const response = await axios.post('/server/rakshak_function/api/assistant/chat', { 
          query: text,
          contextCases: cases
      });
      
      const newAiMsg: Message = {
        id: Date.now() + 1,
        text: response.data.text,
        sender: 'ai',
        confidence: '95%', // Example dynamic confidence could be passed from backend
        reasoning: response.data.reasoning,
        evidence: response.data.evidence
      };
      
      setMessages((prev) => [...prev, newAiMsg]);
    } catch (error) {
      console.error("AI Assistant API Error:", error);
      
      const errorAiMsg: Message = {
        id: Date.now() + 1,
        text: "Sorry, I am currently unable to access the real-time database.",
        sender: 'ai',
        confidence: '0%',
        reasoning: 'API Connection Error',
        evidence: []
      };
      setMessages((prev) => [...prev, errorAiMsg]);
    }
    
    setIsTyping(false);
  };

  const suggestions = [
    { en: "Show all robbery cases in Mysore", kn: "ಮೈಸೂರಿನಲ್ಲಿರುವ ಎಲ್ಲಾ ದರೋಡೆ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸಿ", hi: "मैसूर में डकैती के सभी मामले दिखाएं" },
    { en: "Who are repeat offenders in Bangalore South?", kn: "ಬೆಂಗಳೂರು ದಕ್ಷಿಣದಲ್ಲಿ ಪುನರಾವರ್ತಿತ ಅಪರಾಧಿಗಳು ಯಾರು?", hi: "बैंगलोर साउथ में आदतन अपराधी कौन हैं?" }
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Cpu className="mr-2 text-primary" /> {t('ai_assistant')}
        </h2>
        <div className="flex space-x-3">
          <div className="flex items-center bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2">
            <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
            <select 
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-300 text-xs font-bold uppercase focus:outline-none appearance-none cursor-pointer"
            >
              <option value="en" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">EN (English)</option>
              <option value="kn" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">KN (Kannada)</option>
              <option value="hi" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">HI (Hindi)</option>
            </select>
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={`bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 px-4 py-2 rounded-lg flex items-center transition-colors text-sm text-gray-700 dark:text-gray-300 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Download className="w-4 h-4 mr-2" /> {isExporting ? 'Exporting...' : t('ai_export')}
          </button>
        </div>
      </div>

      <div className="flex-1 glass rounded-xl overflow-hidden flex flex-col border border-gray-200 dark:border-white/10 relative">
        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-background-dark/50">
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' ? 'bg-primary ml-3' : 'bg-secondary mr-3'
                }`}>
                  {msg.sender === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-primary" />}
                </div>
                
                <div className={`p-4 rounded-2xl ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-300 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  
                  {msg.confidence && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 text-sm space-y-2">
                      <div className="flex items-center text-success">
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        <span className="font-semibold">{t('ai_confidence')}: {msg.confidence}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{t('ai_reasoning')}:</span>
                        <p className="text-gray-600 dark:text-gray-500 mt-1">{msg.reasoning}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{t('ai_evidence')}:</span>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-500 mt-1 space-y-1">
                          {msg.evidence?.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex max-w-[80%] flex-row">
                <div className="w-8 h-8 rounded-full bg-secondary mr-3 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-tl-none flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{t('ai_analyzing')}</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 backdrop-blur-md">
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {suggestions.map((suggestion, i) => {
               const sLang = i18n.language === 'kn' ? 'kn' : (i18n.language === 'hi' ? 'hi' : 'en');
               return (
              <button 
                key={i}
                onClick={() => handleSend(suggestion[sLang])}
                className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 px-4 py-2 rounded-full text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap transition-colors"
              >
                {suggestion[sLang]}
              </button>
            )})}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('ai_placeholder')}
              className="flex-1 bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-600 rounded-xl px-5 py-4 focus:outline-none focus:border-primary text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button 
              onClick={handleMicClick}
              className={`p-4 rounded-xl transition-colors flex-shrink-0 border ${
                isListening 
                  ? 'bg-danger/20 text-danger border-danger/30 glow' 
                  : 'bg-gray-100 dark:bg-black/40 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-gray-300 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
            </button>
            <button 
              onClick={() => handleSend()}
              className="bg-primary hover:bg-blue-600 p-4 rounded-xl transition-colors glow flex-shrink-0"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
