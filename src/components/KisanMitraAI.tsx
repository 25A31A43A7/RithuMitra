import React, { useState, useEffect, useRef } from 'react';
import {
  Language,
  ProcurementCentre,
  BookingRecord,
  CommodityId,
  UnitType,
  UserAccount,
  FarmerProfile,
} from '../types';
import { COMMODITIES, UNIT_LABELS, convertUnits, calculateEstimatedPayout } from '../utils/units';
import { TRANSLATIONS } from '../utils/translations';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface KisanMitraAIProps {
  centres: ProcurementCentre[];
  bookings: BookingRecord[];
  lang: Language;
  currentUser?: UserAccount | null;
  activeProfile?: FarmerProfile | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  chips?: Array<{ label: string; query: string }>;
}

export const KisanMitraAI: React.FC<KisanMitraAIProps> = ({
  centres,
  bookings,
  lang,
  currentUser,
  activeProfile,
}) => {
  const t = TRANSLATIONS[lang];

  // UI Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');

  // Audio & Speech States (Strict Mute & Speaking controls)
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micToast, setMicToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'bot',
      text:
        lang === 'te'
          ? 'నమస్కారం! నేను ఫామ్‌గెయిన్ (FarmGain) అందించే కిసాన్ మిత్ర AI సహాయకుడిని. ధాన్యం కొనుగోలు కేంద్రాలు, కనీస మద్దతు ధర (MSP), బస్తాల నుండి క్వింటాళ్ల లెక్కలు, లేదా మీ వేబ్రిడ్జ్ టోకెన్ స్థితి గురించి ఏదైనా అడగవచ్చు.'
          : lang === 'hi'
          ? 'नमस्कार! मैं फार्म-गेन (FarmGain) द्वारा संचालित किसान मित्र एआई हूँ। आप मुझसे न्यूनतम समर्थन मूल्य (MSP), कम प्रतीक्षा वाली मंडियों, बोरी-क्विंटल गणना, या अपने कांटा टोकन के बारे में पूछ सकते हैं।'
          : 'Namaskaram! I am Kisan Mitra, your AI assistant powered by FarmGain. Ask me about lowest-wait APMC & PACS depots, live MSP calculations across bags and quintals, moisture guidelines, or your weighbridge gate token.',
      timestamp: 'Just now',
      chips: [
        { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
        { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
        { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
        { label: '🛡️ How to verify a procurement centre?', query: 'How to verify a procurement centre?' },
      ],
    },
  ]);

  // Auto-scroll on new messages or open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Clean-up speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Web Speech Synthesis (Speech Output) with strict mute enforcement
  const speakText = (rawText: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean markdown, symbols, and emojis so speech synthesis speaks smoothly
      const cleanText = rawText
        .replace(/[*#_~`]/g, '')
        .replace(/₹/g, ' Rupees ')
        .replace(/[🌾🌽🌱💰🔍🛡️⚠️⚡📍➔✓]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (lang === 'te') {
        utterance.lang = 'te-IN';
      } else if (lang === 'hi') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failure:', err);
      setIsSpeaking(false);
    }
  };

  // Toggle Mute / Speaker button
  const handleToggleMute = () => {
    if (!isMuted) {
      // User is muting: stop any ongoing or queued speech immediately
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Close Chat Modal: immediately cancel audio and mic
  const handleCloseChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsListening(false);
    setIsOpen(false);
  };

  // Toast helper for sandbox mic restrictions
  const showMicToast = (msg: string) => {
    setMicToast(msg);
    setTimeout(() => {
      setMicToast(null);
    }, 3800);
  };

  // Speech Recognition (Microphone Input)
  const handleToggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showMicToast('Microphone blocked in sandbox. Please type below');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          setInputQuery(transcript);
          handleSendQuery(transcript.trim());
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        showMicToast('Microphone blocked in sandbox. Please type below');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
      showMicToast('Microphone blocked in sandbox. Please type below');
    }
  };

  // -------------------------------------------------------------
  // INTELLIGENT QUESTION MATCHING & ACCURATE DYNAMIC ANSWER ENGINE
  // -------------------------------------------------------------
  const generateBotAnswer = (rawQuery: string): { text: string; chips?: Array<{ label: string; query: string }> } => {
    const q = rawQuery.toLowerCase();

    // 1. QUESTION ABOUT "WHERE CAN I DELIVER [CROP] / SHORTEST WAIT TIME?"
    if (
      q.includes('where') ||
      q.includes('deliver') ||
      q.includes('best depot') ||
      q.includes('mandi') ||
      q.includes('shortest wait') ||
      q.includes('least wait') ||
      q.includes('low wait') ||
      q.includes('queue') ||
      q.includes('traffic') ||
      q.includes('రద్దీ') ||
      q.includes('ఎక్కడ') ||
      q.includes('డిపో') ||
      q.includes('कहाँ') ||
      q.includes('प्रतीक्षा')
    ) {
      // Determine crop requested
      let cropKey: CommodityId = 'paddy_grade_a';
      if (q.includes('common') || q.includes('సాధారణ')) cropKey = 'paddy_common';
      else if (q.includes('maize') || q.includes('corn') || q.includes('makka') || q.includes('మొక్కజొన్న') || q.includes('मक्का')) cropKey = 'maize';
      else if (q.includes('black') || q.includes('urad') || q.includes('మినుములు') || q.includes('उड़द')) cropKey = 'black_gram';

      // Find depot accepting crop with lowest wait time
      const matchingCentres = centres.filter((c) => c.acceptedCommodities.includes(cropKey));
      const pool = matchingCentres.length > 0 ? matchingCentres : centres;

      // Sort by green/optimal status and queue time
      const sorted = [...pool].sort((a, b) => {
        if (a.status === 'GREEN' && b.status !== 'GREEN') return -1;
        if (b.status === 'GREEN' && a.status !== 'GREEN') return 1;
        return a.queueHours - b.queueHours;
      });

      const best = sorted[0];
      const congested = sorted.find((c) => c.status === 'RED' || c.queueHours >= 4.0);
      const cropName = COMMODITIES[cropKey]?.name[lang] || COMMODITIES[cropKey]?.name.en;

      if (lang === 'te') {
        let resp = `రైతు సోదరులారా! ${cropName} కోసం ప్రస్తుతం ఉత్తమ కొనుగోలు కేంద్రం: **${best.name}** (${best.distanceKm} కి.మీ దూరం). ఇది కేవలం **${best.currentCapacityPct}%** సామర్థ్యంతో నడుస్తోంది మరియు అంచనా వేచి ఉండే సమయం కేవలం **${best.queueTimeStr}** (${best.baysCount} వేబ్రిడ్జ్ స్కేళ్ళు తెరిచి ఉన్నాయి). ఇది ${best.govtVerified ? '🛡️ ప్రభుత్వం ధృవీకరించిన (Govt-Verified) కేంద్రం' : '⚠️ ధృవీకరణ పెండింగ్‌లో ఉన్న కేంద్రం'}.`;
        if (congested) {
          resp += `\n\n⚡ సలహా: **${congested.name}** వద్ద సుమారు ${congested.queueTimeStr} విపరీతమైన రద్దీ ఉంది. రైతుమిత్ర ద్వారా ${best.name} కు వెళితే ట్రాక్టర్ అద్దెలో దాదాపు ₹2,400 వరకు ఆదా అవుతుంది!`;
        }
        return {
          text: resp,
          chips: [
            { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
            { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
          ],
        };
      } else if (lang === 'hi') {
        let resp = `किसान भाई! ${cropName} के लिए वर्तमान में सबसे उपयुक्त केंद्र: **${best.name}** (${best.distanceKm} किमी दूर) है। यह केवल **${best.currentCapacityPct}%** क्षमता पर चल रहा है और अनुमानित प्रतीक्षा समय मात्र **${best.queueTimeStr}** है (${best.baysCount} कांटा लेन उपलब्ध)। यह केंद्र ${best.govtVerified ? '🛡️ सरकार द्वारा प्रमाणित (Govt-Verified)' : '⚠️ प्रमाणीकरण प्रक्रियाधीन'} है।`;
        if (congested) {
          resp += `\n\n⚡ सुझाव: **${congested.name}** पर ${congested.queueTimeStr} की भारी कतार है। ${best.name} का चयन करने पर ट्रैक्टर भाड़े में ₹2,400 तक की बचत होगी।`;
        }
        return {
          text: resp,
          chips: [
            { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
            { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
          ],
        };
      } else {
        let resp = `The best place right now is **${best.name}** (${best.distanceKm} km away). It is operating at only **${best.currentCapacityPct}%** capacity with an estimated wait time of **${best.queueTimeStr}** (${best.baysCount} weighbridge bay scales open). It is ${best.govtVerified ? '🛡️ Govt-Verified' : '⚠️ Pending Verification'}.`;
        if (congested) {
          resp += `\n\n⚡ Traffic Tip: Avoid congested hubs like **${congested.name}** (operating at ${congested.currentCapacityPct}% capacity with ~${congested.queueTimeStr} wait). Diverting to ${best.name} saves up to ₹2,400 in idle tractor hire charges.`;
        }
        return {
          text: resp,
          chips: [
            { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
            { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
            { label: '🛡️ How to verify a procurement centre?', query: 'How to verify a procurement centre?' },
          ],
        };
      }
    }

    // 2. QUESTION ABOUT "MSP / PRICE / UNIT CONVERSION"
    if (
      q.includes('msp') ||
      q.includes('price') ||
      q.includes('payout') ||
      q.includes('calculate') ||
      q.includes('cost') ||
      q.includes('rate') ||
      q.includes('bag') ||
      q.includes('quintal') ||
      q.includes('ton') ||
      q.includes('ధర') ||
      q.includes('మద్దతు ధర') ||
      q.includes('లెక్క') ||
      q.includes('చెల్లింపు') ||
      q.includes('रेट') ||
      q.includes('कीमत') ||
      q.includes('भुगतान')
    ) {
      // Extract commodity
      let commodityKey: CommodityId = 'paddy_grade_a';
      let isWheat = false;

      if (q.includes('wheat') || q.includes('గోధుమ') || q.includes('गेहूं')) {
        isWheat = true;
      } else if (q.includes('common') || q.includes('సాధారణ')) {
        commodityKey = 'paddy_common';
      } else if (q.includes('maize') || q.includes('corn') || q.includes('makka') || q.includes('మొక్కజొన్న') || q.includes('मक्का')) {
        commodityKey = 'maize';
      } else if (q.includes('black') || q.includes('urad') || q.includes('మినుములు') || q.includes('उड़द')) {
        commodityKey = 'black_gram';
      }

      // Extract numbers
      const numMatch = rawQuery.match(/\d+(\.\d+)?/);
      const qty = numMatch ? parseFloat(numMatch[0]) : 100;

      // Extract unit
      let unit: UnitType = 'bag';
      if (q.includes('quintal') || q.includes('qtl') || q.includes('క్వింటా') || q.includes('क्विंटल')) {
        unit = 'qtl';
      } else if (q.includes('ton') || q.includes('mt') || q.includes('టన్ను') || q.includes('टन')) {
        unit = 'ton';
      } else if (q.includes('kg') || q.includes('kilo') || q.includes('కిలో') || q.includes('किग्रा')) {
        unit = 'kg';
      } else if (q.includes('maund') || q.includes('mann') || q.includes('మణగు') || q.includes('मन')) {
        unit = 'maund';
      } else {
        unit = 'bag';
      }

      const conv = convertUnits(qty, unit);

      let mspPerQtl = COMMODITIES[commodityKey].mspPerQtl;
      let maxMoisture = COMMODITIES[commodityKey].maxMoisture;
      let cropName = COMMODITIES[commodityKey].name[lang] || COMMODITIES[commodityKey].name.en;

      if (isWheat) {
        mspPerQtl = 2275;
        maxMoisture = 12;
        cropName = lang === 'te' ? 'గోధుమలు (Wheat)' : lang === 'hi' ? 'गेहूं (Wheat)' : 'Wheat';
      }

      const payout = Math.round(conv.qtl * mspPerQtl);
      const unitLabel = UNIT_LABELS[unit].short;

      if (lang === 'te') {
        const resp = `📊 **మల్టీ-యూనిట్ లెక్క & MSP చెల్లింపు వివరాలు:**\n` +
          `• మీరు నమోదు చేసినది: **${qty} ${unitLabel}** ${cropName}\n` +
          `• యూనిట్ల మార్పిడి: **${conv.qtl} క్వింటాళ్లు** = **${conv.ton} మెట్రిక్ టన్నులు** = **${conv.kg.toLocaleString('en-IN')} కేజీలు** = **${conv.bag} జూట్ బస్తాలు (50kg)** = **${conv.maund} మణుగులు**\n` +
          `• అధికారిక 2026 MSP రేటు: **₹${mspPerQtl.toLocaleString('en-IN')} / క్వింటాల్** (₹${(mspPerQtl / 100).toFixed(2)}/kg)\n` +
          `• అంచనా ప్రభుత్వ DBT చెల్లింపు: **₹${payout.toLocaleString('en-IN')}** (బ్యాంక్ ఖాతాకు నేరుగా జమ)\n` +
          `• గరిష్ట అనుమతించబడిన తేమ పరిమితి: **${maxMoisture}%** (డిజిటల్ మీటర్ ద్వారా పరీక్షించబడుతుంది).`;
        return {
          text: resp,
          chips: [
            { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
            { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
          ],
        };
      } else if (lang === 'hi') {
        const resp = `📊 **इकाई रूपांतरण एवं एमएसपी भुगतान गणना:**\n` +
          `• दर्ज मात्रा: **${qty} ${unitLabel}** ${cropName}\n` +
          `• सटीक रूपांतरण: **${conv.qtl} क्विंटल** = **${conv.ton} मीट्रिक टन** = **${conv.kg.toLocaleString('en-IN')} किग्रा** = **${conv.bag} बोरी (50 किग्रा)** = **${conv.maund} मन**\n` +
          `• आधिकारिक 2026 एमएसपी: **₹${mspPerQtl.toLocaleString('en-IN')} / क्विंटल**\n` +
          `• अनुमानित सरकारी डीबीटी भुगतान: **₹${payout.toLocaleString('en-IN')}**\n` +
          `• अधिकतम स्वीकार्य नमी सीमा: **${maxMoisture}%** (कांटा गेट पर डिजिटल जांच)।`;
        return {
          text: resp,
          chips: [
            { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
            { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
          ],
        };
      } else {
        const resp = `📊 **Multi-Unit Breakdown & Official MSP Payout:**\n` +
          `• Entered Quantity: **${qty} ${unitLabel}** of ${cropName}\n` +
          `• Equivalent Conversion: **${conv.qtl} Quintals** | **${conv.ton} Metric Tonnes** | **${conv.kg.toLocaleString('en-IN')} kg** | **${conv.bag} Jute Bags (50kg)** | **${conv.maund} Maunds**\n` +
          `• Official 2026 Govt. MSP: **₹${mspPerQtl.toLocaleString('en-IN')} per Quintal** (₹${(mspPerQtl / 100).toFixed(2)}/kg)\n` +
          `• Total Estimated DBT Payout: **₹${payout.toLocaleString('en-IN')}** (disbursed directly via PFMS to bank)\n` +
          `• Max Permissible Moisture Threshold: **${maxMoisture}%** (assayed at depot gate).`;
        return {
          text: resp,
          chips: [
            { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
            { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
            { label: '🛡️ How to verify a procurement centre?', query: 'How to verify a procurement centre?' },
          ],
        };
      }
    }

    // 3. QUESTION ABOUT "TOKEN / BOOKING STATUS"
    if (
      q.includes('token') ||
      q.includes('track') ||
      q.includes('truck') ||
      q.includes('booking') ||
      q.includes('status') ||
      q.includes('gate pass') ||
      q.includes('pass') ||
      q.includes('టోకెన్') ||
      q.includes('స్టేటస్') ||
      q.includes('పాస్') ||
      q.includes('टोकन') ||
      q.includes('स्थिति') ||
      rawQuery.match(/(?:RM|FG)-[A-Z0-9-]+/i)
    ) {
      // Find token code
      const tokenMatch = rawQuery.match(/(?:RM|FG)-[A-Z0-9-]+/i);
      let record: BookingRecord | undefined;

      if (tokenMatch) {
        record = bookings.find((b) => b.id.toUpperCase() === tokenMatch[0].toUpperCase());
      }

      // If not specified by code, find user's active booking
      if (!record) {
        if (currentUser?.loginId) {
          record = bookings.find((b) => b.farmerPhone === currentUser.loginId);
        }
        if (!record && activeProfile?.id) {
          record = bookings.find((b) => b.farmerId === activeProfile.id);
        }
        if (!record && bookings.length > 0) {
          record = bookings[0];
        }
      }

      if (record) {
        const readableStatusMap: Record<string, string> = {
          BOOKED: 'Confirmed & Slotted / Awaiting Gate Arrival',
          CHECKED_IN: 'Gate Security Check Complete / Queued for Scale',
          GROSS_WEIGHED: 'Gross Weighment Complete / Awaiting Tare',
          MOISTURE_TESTED: 'Moisture Assayed / Approved within Limit',
          TARE_WEIGHED: 'Tare Scale Complete / Net Yield Finalized',
          SETTLED: 'DBT Payment Disbursed to Bank Account',
        };

        const readableStatus = readableStatusMap[record.status] || record.status;

        if (lang === 'te') {
          const resp = `🎟️ **డిజిటల్ గేట్ పాస్ & టోకెన్ వివరాలు:**\n` +
            `• టోకెన్ సంఖ్య: **${record.id}**\n` +
            `• ప్రస్తుత స్థితి: **[${record.status}]** (${readableStatus})\n` +
            `• రైతు పేరు: **${record.farmerName}** (ఫోన్: ${record.farmerPhone})\n` +
            `• పంట & పరిమాణం: **${record.commodityName}** — ${record.inputQuantity} ${record.inputUnit} (**${record.quintals} క్వింటాళ్లు**)\n` +
            `• కేటాయించిన కేంద్రం: **${record.centreName}**\n` +
            `• కేటాయించిన స్కేలు లేన్: **${record.assignedBay}**\n` +
            `• వాహనం: **${record.vehicleType}** (${record.vehicleNumber})\n` +
            `• స్లాట్ సమయం: **${record.slotDate} (${record.slotTime})**\n` +
            `• ${record.status === 'SETTLED' ? `చెల్లింపు: ₹${record.finalPayoutInr?.toLocaleString('en-IN')} DBT ద్వారా జమ చేయబడింది.` : 'గమనిక: మీ 2-గంటల రిజర్వ్డ్ స్లాట్‌లో వేబ్రిడ్జ్ వద్దకు చేరుకోండి.'}`;
          return {
            text: resp,
            chips: [
              { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
              { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
            ],
          };
        } else if (lang === 'hi') {
          const resp = `🎟️ **डिजिटल गेट पास एवं टोकन स्थिति:**\n` +
            `• टोकन नंबर: **${record.id}**\n` +
            `• वर्तमान स्थिति: **[${record.status}]** (${readableStatus})\n` +
            `• किसान का नाम: **${record.farmerName}** (फोन: ${record.farmerPhone})\n` +
            `• फसल एवं मात्रा: **${record.commodityName}** — ${record.inputQuantity} ${record.inputUnit} (**${record.quintals} क्विंटल**)\n` +
            `• आवंटित मंडी केंद्र: **${record.centreName}**\n` +
            `• कांटा लेन: **${record.assignedBay}**\n` +
            `• वाहन नंबर: **${record.vehicleType}** (${record.vehicleNumber})\n` +
            `• स्लाट समय: **${record.slotDate} (${record.slotTime})**\n` +
            `• ${record.status === 'SETTLED' ? `डीबीटी भुगतान: ₹${record.finalPayoutInr?.toLocaleString('en-IN')} बैंक खाते में भेजा जा चुका है।` : 'कांटे पर निर्धारित 2-घंटे के स्लॉट में पहुंचे।'}`;
          return {
            text: resp,
            chips: [
              { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
              { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
            ],
          };
        } else {
          const resp = `🎟️ **Digital Gate Token Status:**\n` +
            `Token **${record.id}** is currently in status: **${readableStatus}** [${record.status}].\n\n` +
            `• Farmer: **${record.farmerName}** (Phone: +91-${record.farmerPhone})\n` +
            `• Commodity: **${record.commodityName}** — ${record.inputQuantity} ${record.inputUnit} (**${record.quintals} Quintals**)\n` +
            `• Assigned Depot: **${record.centreName}**\n` +
            `• Designated Weighbridge: **${record.assignedBay}**\n` +
            `• Vehicle: **${record.vehicleType}** (${record.vehicleNumber})\n` +
            `• Scheduled Window: **${record.slotDate}** (${record.slotTime})\n` +
            `• Settlement Status: ${record.status === 'SETTLED' ? `✅ Direct Benefit Transfer (DBT) of ₹${record.finalPayoutInr?.toLocaleString('en-IN')} has been disbursed!` : '⏳ Guaranteed lane access active upon gate check-in.'}`;
          return {
            text: resp,
            chips: [
              { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
              { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
              { label: '🛡️ How to verify a procurement centre?', query: 'How to verify a procurement centre?' },
            ],
          };
        }
      } else {
        return {
          text: lang === 'te'
            ? 'క్షమించండి, మీ ప్రొఫైల్‌లో క్రియాశీల టోకెన్ ఏదీ కనుగొనబడలేదు. దయచేసి నిర్దిష్ట టోకెన్ ఐడీని నమోదు చేయండి (ఉదా: RM-RJY-PDY-104) లేదా కొత్త స్లాట్‌ను బుక్ చేయండి.'
            : 'No active booking record found for your account. Please enter your specific Token ID (e.g. RM-RJY-PDY-104) to track, or reserve a fresh slot in the Farmer Portal.',
          chips: [
            { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
            { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
          ],
        };
      }
    }

    // 4. QUESTION ABOUT "HIGH MOISTURE / REJECTION"
    if (
      q.includes('moisture') ||
      q.includes('reject') ||
      q.includes('wet') ||
      q.includes('rain') ||
      q.includes('damp') ||
      q.includes('drying') ||
      q.includes('తేమ') ||
      q.includes('నమీ') ||
      q.includes('రిజెక్ట్') ||
      q.includes('नमी') ||
      q.includes('खारिज')
    ) {
      if (lang === 'te') {
        return {
          text: `🌾 **తేమ పరిమితులు & తిరస్కరణ నియమావళి (APMC/FCI నిబంధనలు):**\n\n` +
            `1. **అధికారిక గరిష్ట తేమ పరిమితులు:**\n` +
            `   • వరి / ధాన్యం (Paddy Grade A / Common): **గరిష్టంగా 17%**\n` +
            `   • గోధుమలు / మినుములు (Wheat & Urad): **గరిష్టంగా 12%**\n` +
            `   • మొక్కజొన్న (Maize): **గరిష్టంగా 14%**\n\n` +
            `2. **తేమ ఎక్కువ ఉంటే ఏమి చేయాలి?**\n` +
            `   • తేమ నిర్దేశిత పరిమితి దాటితే డిపో వద్ద ఆటో-రిజెక్షన్ జరగదు; బదులుగా డిపో మేనేజర్ ట్రాలీని సమీపంలోని ప్రభుత్వ ఆరబెట్టే స్థలానికి (Drying Yard) మళ్లిస్తారు.\n` +
            `   • 24 నుండి 48 గంటలు ఎండబెట్టిన తర్వాత అదే స్లాట్ నంబర్‌తో తిరిగి కాటా వేయించవచ్చు.\n` +
            `   • వర్షం తగలకుండా వాహనంపై టార్పాలిన్ కప్పడం తప్పనిసరి.`,
          chips: [
            { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
            { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
          ],
        };
      } else if (lang === 'hi') {
        return {
          text: `🌾 **नमी मानक एवं दिशा-निर्देश (APMC / FCI नियम):**\n\n` +
            `1. **अधिकतम स्वीकार्य नमी:**\n` +
            `   • धान (Paddy): **अधिकतम 17%**\n` +
            `   • गेहूं एवं उड़द: **अधिकतम 12%**\n` +
            `   • मक्का: **अधिकतम 14%**\n\n` +
            `2. **यदि नमी अधिक पाई जाती है:**\n` +
            `   • फसल सीधे खारिज नहीं होती; मंडी में सुखाने के यार्ड का उपयोग करने की अनुमति दी जाती है।\n` +
            `   • धूप में सुखाने के उपरांत उसी टोकन पर पुनः कांटा कराया जा सकता है।\n` +
            `   • परिवहन के दौरान तिरपाल से ढकना सुनिश्चित करें।`,
          chips: [
            { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
            { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
          ],
        };
      } else {
        return {
          text: `🌾 **Moisture Guidelines & Quality Assaying (APMC & FCI Rules):**\n\n` +
            `• **Maximum Permissible Moisture Thresholds:**\n` +
            `  - **Paddy (Grade A & Common)**: Maximum **17%**\n` +
            `  - **Wheat & Black Gram (Urad)**: Maximum **12%**\n` +
            `  - **Maize**: Maximum **14%**\n\n` +
            `• **What happens if moisture exceeds 17%?**\n` +
            `  Under official procurement regulations, grain exceeding the threshold is redirected to the depot's on-site sun-drying yard. Farmers are granted 24–48 hours for moisture reduction and can re-slot on the calibrated digital assaying scale without forfeiting their booking priority.\n\n` +
            `• **Transit Tip**: Always secure heavy-duty tarpaulins over your tractor-trolley or mini-truck during transit to prevent dew or rain absorption.`,
          chips: [
            { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
            { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
            { label: '🛡️ How to verify a procurement centre?', query: 'How to verify a procurement centre?' },
          ],
        };
      }
    }

    // 5. QUESTION ABOUT "HOW TO VERIFY A PROCUREMENT CENTRE / GOVT BADGES"
    if (
      q.includes('verify') ||
      q.includes('govt') ||
      q.includes('badge') ||
      q.includes('genuine') ||
      q.includes('apmc') ||
      q.includes('pacs') ||
      q.includes('ధృవీకరణ') ||
      q.includes('ప్రభుత్వ') ||
      q.includes('सत्यापन') ||
      q.includes('प्रमाणित')
    ) {
      if (lang === 'te') {
        return {
          text: `🛡️ **ప్రభుత్వ ధృవీకరించిన (Govt-Verified) కేంద్రాల గుర్తింపు:**\n\n` +
            `ఫామ్‌గెయిన్ (FarmGain) మ్యాప్‌లో నీలిరంగు **🛡️ Govt-Verified** బ్యాడ్జ్ ఉన్న కేంద్రాలు ప్రభుత్వంచే అధికారికంగా గుర్తించబడినవి:\n` +
            `1. **డిజిటల్ కాలిబ్రేటెడ్ స్కేళ్లు**: ఎలక్ట్రానిక్ వేబ్రిడ్జ్ కాటాలు లీగల్ మెట్రాలజీ శాఖ వారి సీల్‌తో ట్యాంపరింగ్ లేకుండా ఉంటాయి.\n` +
            `2. **MSP ధర రక్షణ**: కేంద్ర ప్రభుత్వం మరియు ఏపీ పౌరసరఫరాల శాఖ నిర్దేశించిన పూర్తి మద్దతు ధర చెల్లింపు హామీ.\n` +
            `3. **డైరెక్ట్ DBT లింక్**: మీ రైతు భరోసా / ఆధార్ అనుసంధాన బ్యాంక్ ఖాతాకు 24-48 గంటల్లో నిధులు జమ.\n\n` +
            `⚠️ ప్రైవేట్ లేదా ధృవీకరించబడని యార్డులను పసుపు రంగు హెచ్చరికతో చూపిస్తాము.`,
          chips: [
            { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
            { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
          ],
        };
      } else {
        return {
          text: `🛡️ **Govt-Verified Centre Certification & Protection:**\n\n` +
            `Authorized APMC Market Yards and Primary Agricultural Credit Societies (PACS) carry the prominent blue **🛡️ Govt-Verified** shield badge in FarmGain. This guarantees:\n\n` +
            `1. **Tamper-Proof Calibrated Weighbridges**: Certified by the Department of Legal Metrology with digital gross & tare recording.\n` +
            `2. **Full MSP Price Guarantee**: Backed by AP State Civil Supplies Corporation and Food Corporation of India (FCI).\n` +
            `3. **Direct Benefit Transfer (DBT)**: Payout is transmitted directly to your verified Rythu Bharosa / PM-KISAN bank account with zero middleman deductions.\n\n` +
            `⚠️ Private or unverified yards without calibrated digital scales display an amber warning badge.`,
          chips: [
            { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
            { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
            { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
          ],
        };
      }
    }

    // 6. DEFAULT POLITE DIRECT 2-SENTENCE FALLBACK
    if (lang === 'te') {
      return {
        text: `నమస్కారం! నేను ఫామ్‌గెయిన్ (FarmGain) అందించే కిసాన్ మిత్ర AI సహాయకుడిని. తక్కువ రద్దీ గల APMC/PACS డిపోలను గుర్తించడంలో, బస్తాలు మరియు క్వింటాళ్ల మద్దతు ధర (MSP) గణించడంలో మరియు మీ కాటా టోకెన్‌లను ట్రాక్ చేయడంలో సహాయపడతాను.`,
        chips: [
          { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
          { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
          { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
        ],
      };
    } else if (lang === 'hi') {
      return {
        text: `नमस्कार! मैं फार्म-गेन (FarmGain) द्वारा संचालित किसान मित्र एआई हूँ। मैं निकटतम कम प्रतीक्षा वाली सरकारी मंडियों को खोजने, एमएसपी दर की गणना करने और आपके कांटा टोकन को ट्रैक करने में आपकी सहायता कर सकता हूँ।`,
        chips: [
          { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
          { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
          { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
        ],
      };
    } else {
      return {
        text: `Namaskaram! I am Kisan Mitra, your AI assistant powered by FarmGain. I help you discover low-wait APMC & PACS depots, compute exact MSP earnings across bags and quintals, and track your weighbridge gate passes.`,
        chips: [
          { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
          { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
          { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
        ],
      };
    }
  };

  // Submit and process user query
  const handleSendQuery = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');

    // Answer with a slight realistic typing delay
    setTimeout(() => {
      const { text, chips } = generateBotAnswer(trimmed);
      const botMessage: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips,
      };

      setMessages((prev) => [...prev, botMessage]);
      speakText(text);
    }, 400);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuery(inputQuery);
  };

  // 4 Prominent Quick-Tap Question Pills
  const primaryQuickPills = [
    { label: '🌾 Best depot for Paddy right now?', query: 'Best depot for Paddy right now?' },
    { label: '💰 Calculate 100 bags Paddy MSP payout', query: 'Calculate 100 bags Paddy MSP payout' },
    { label: '🔍 Track token RM-RJY-PDY-104', query: 'Track token RM-RJY-PDY-104' },
    { label: '🛡️ How to verify a procurement centre?', query: 'How to verify a procurement centre?' },
  ];

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 px-5 py-3.5 rounded-full bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white shadow-xl transition-all border border-emerald-700/50 group cursor-pointer"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-emerald-200" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold block">{t.aiAssistantTitle || 'Kisan Mitra AI'}</span>
              <span className="text-[10px] text-emerald-200 block">Voice & Mandi Copilot</span>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 w-[95vw] sm:w-[440px] max-w-[460px] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col h-[590px] animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between border-b border-emerald-900 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-700/90 flex items-center justify-center border border-emerald-500/30">
                <Bot className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">Kisan Mitra AI</h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                    Mandi Copilot
                  </span>
                </div>
                <span className="text-[10px] text-emerald-200 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live APMC & PACS Intelligence Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Speaker / Mute Button with clear visual indicator */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`relative px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isMuted
                    ? 'bg-stone-800/80 hover:bg-stone-800 text-stone-300 border-stone-600'
                    : 'bg-emerald-900 hover:bg-emerald-950 text-white border-emerald-600'
                }`}
                title={isMuted ? 'Voice is Muted (Click to Unmute)' : 'Voice is Active (Click to Mute)'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span className="text-[10px] text-red-300">Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] text-emerald-200">Voice ON</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseChat}
                className="w-8 h-8 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice Waveform Banner when speaking or listening */}
          {(isSpeaking || isListening) && (
            <div className="bg-emerald-950 text-emerald-200 px-4 py-2 flex items-center justify-between text-xs border-b border-emerald-900">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="font-medium text-[11px]">
                  {isListening ? 'Listening to speech...' : 'Kisan Mitra speaking answer...'}
                </span>
              </span>
              <div className="flex items-center gap-1 h-3.5">
                <span className="w-1 bg-emerald-400 h-full animate-pulse rounded" />
                <span className="w-1 bg-emerald-300 h-2/3 animate-bounce rounded" />
                <span className="w-1 bg-emerald-400 h-4/5 animate-pulse rounded" />
                <span className="w-1 bg-emerald-200 h-1/2 animate-bounce rounded" />
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 space-y-1.5 shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-emerald-700 text-white rounded-br-none'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line text-xs font-sans">
                    {m.text}
                  </p>
                  <span
                    className={`text-[9px] block text-right font-mono ${
                      m.sender === 'user' ? 'text-emerald-200' : 'text-stone-400'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {/* Follow-up Quick Chips inside message */}
                {m.chips && m.chips.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 max-w-[90%]">
                    {m.chips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendQuery(chip.query)}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 text-[11px] font-semibold border border-stone-200 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer text-left"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Sandbox Microphone Toast Alert */}
          {micToast && (
            <div className="px-4 py-2 bg-amber-50 text-amber-900 border-t border-amber-200 text-[11px] flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {micToast}
              </span>
              <button
                type="button"
                onClick={() => setMicToast(null)}
                className="text-amber-700 hover:text-amber-950 text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* 4 Interactive Quick-Tap Question Pills Bar */}
          <div className="px-3.5 py-2.5 bg-stone-100 border-t border-stone-200 space-y-1.5">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Quick Questions:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {primaryQuickPills.map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendQuery(pill.query)}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 active:scale-98 text-stone-800 hover:text-emerald-900 text-[11px] font-semibold text-left border border-stone-200 hover:border-emerald-300 shadow-2xs transition-all truncate cursor-pointer"
                  title={pill.query}
                >
                  <span className="truncate block">{pill.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Text Input & Voice Controls */}
          <form
            onSubmit={handleFormSubmit}
            className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
          >
            {/* Microphone Button with animated pulsing ring when listening */}
            <button
              type="button"
              onClick={handleToggleListening}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white ring-4 ring-red-300 animate-pulse'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
              title={isListening ? 'Stop listening' : 'Speak your question (Voice input)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              placeholder="Ask anything about mandis, MSP, bags, tokens..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 h-10 px-3.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs font-medium focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-stone-800"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                inputQuery.trim()
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer shadow-xs'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
              title="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
