
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, RefreshCw, Volume2, Play, AlertCircle, CheckCircle, Sparkles, MessageSquare, User, Brain, ArrowRight, X, Upload, FileText, RotateCcw } from 'lucide-react';
import { generateInterviewQuestion, evaluateInterviewResponse } from '../services/geminiService';
import { InterviewFeedback, CandidateProfile } from '../types';
import { api } from '../lib/api';

interface MockInterviewProps {
  candidate: CandidateProfile;
}

export const MockInterview: React.FC<MockInterviewProps> = ({ candidate }) => {
  const [mode, setMode] = useState<'cv' | 'setup' | 'interview' | 'feedback'>('cv');
  const topic = 'behavioral' as const;
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // CV state
  const [cvText, setCvText] = useState<string>(candidate.cvText ?? '');
  const [cvFileName, setCvFileName] = useState<string>(
    candidate.cvFileUrl ? 'CV on file' : ''
  );
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // If candidate already has a CV, skip straight to setup
  useEffect(() => {
    if (candidate.cvText) {
      setCvText(candidate.cvText);
      setCvFileName(candidate.cvFileUrl ? 'CV on file' : 'CV on file');
      setMode('setup');
    }
  }, [candidate.cvText, candidate.cvFileUrl]);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if (!isListening) {
      setRecordingSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isListening]);

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimTranscript(interim);
      if (final) {
        setAnswer(prev => (prev + ' ' + final).trim());
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return;
      setIsListening(false);
      isListeningRef.current = false;
      setInterimTranscript('');
      if (event.error === 'no-speech') {
        setMicError('No speech detected. Try speaking closer to the microphone, or type your answer below.');
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setMicError('Microphone access denied. Enable permissions in your browser settings, or type your answer below.');
      } else {
        setMicError(`Speech recognition error: ${event.error}. Please type your answer below.`);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
          isListeningRef.current = false;
          setInterimTranscript('');
        }
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.abort(); } catch { /* ignore */ }
    };
  }, []);

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCvError(null);

    const allowed = ['application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      setCvError('Please upload a PDF, TXT, or Word document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCvError('CV must be under 10MB.');
      return;
    }

    setUploadingCv(true);
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const res = (await api.postForm('/profiles/upload-cv/', formData)) as any;
      if (res?.cv_text) {
        setCvText(res.cv_text);
        setCvFileName(file.name);
        setMode('setup');
      } else {
        setCvError('Could not extract text from this CV. Try a PDF or TXT file.');
      }
    } catch {
      setCvError('Upload failed. Please try again.');
    } finally {
      setUploadingCv(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setMicError('Voice input not supported in this browser. Please type your answer.');
      return;
    }
    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      setMicError(null);
      try {
        isListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        isListeningRef.current = false;
        setMicError('Microphone access denied. Enable permissions in your browser settings, or type your answer below.');
      }
    }
  };

  const startInterview = async () => {
    setLoading(true);
    setFeedback(null);
    setAnswer('');
    setSubmitError(null);
    try {
      const q = await generateInterviewQuestion(
        candidate.title,
        topic,
        {
          skills: candidate.skills ? Object.keys(candidate.skills).join(', ') : '',
          experienceYears: String(candidate.yearsOfExperience ?? ''),
          bio: candidate.bio ?? '',
          cvText,
        }
      );
      setQuestion(q);
      setMode('interview');
      speak(q);
    } catch {
      setSubmitError('Failed to load interview question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    setLoading(true);
    setSubmitError(null);
    try {
      const result = await evaluateInterviewResponse(question, answer);
      setFeedback(result);
      setMode('feedback');
    } catch {
      setSubmitError('Failed to get AI feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ScoreBar = ({ label, score, color, subtitle }: { label: string; score: number; color: string; subtitle: string }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm font-bold mb-1">
        <span className="text-slate-700">
          {label}
          <span className="text-gray-400 font-normal text-xs ml-1">({subtitle})</span>
        </span>
        <span className={score >= 80 ? 'text-green-600' : score >= 60 ? 'text-orange' : 'text-red-500'}>{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl mb-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <MessageSquare size={24} className="text-orange-300" />
            </div>
            <h2 className="text-3xl font-bold">AI Interview Coach</h2>
          </div>
          <p className="text-slate-300 max-w-lg">Master your interview skills with real-time AI feedback on clarity, confidence, and relevance.</p>
        </div>
      </div>

      {/* Step 1: CV Upload (mandatory) */}
      {mode === 'cv' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={36} className="text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Upload Your CV First</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Your CV lets the AI tailor questions to your actual experience — referencing your real projects, roles, and skills instead of generic questions.
            </p>
          </div>

          {/* Upload zone */}
          <div
            className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all"
            onClick={() => cvInputRef.current?.click()}
          >
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleCvUpload}
              className="hidden"
            />
            {uploadingCv ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={32} className="text-slate-400 animate-spin" />
                <p className="text-slate-500 font-medium">Extracting CV text...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={32} className="text-slate-400" />
                <p className="font-semibold text-slate-700">Click to upload your CV</p>
                <p className="text-sm text-slate-400">PDF, TXT, or Word — up to 10MB</p>
              </div>
            )}
          </div>

          {cvError && (
            <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{cvError}</p>
            </div>
          )}

          <p className="text-center text-xs text-slate-400 mt-6">
            Your CV is used only to personalise interview questions and is not shared with anyone.
          </p>
        </div>
      )}

      {/* Step 2: Setup (CV loaded) */}
      {mode === 'setup' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center py-12">
          {/* CV indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm text-green-700 font-medium mb-8">
            <CheckCircle size={16} className="text-green-500" />
            <span className="max-w-xs truncate">{cvFileName || 'CV loaded'}</span>
            <button
              onClick={() => { setCvText(''); setCvFileName(''); setMode('cv'); }}
              className="ml-1 text-green-400 hover:text-green-600 transition"
              title="Replace CV"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain size={40} className="text-orange" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to practice?</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Questions will be tailored to your actual experience from your CV — your real projects, roles, and skills.
          </p>

          <div className="flex justify-center mb-8">
            <span className="px-6 py-3 rounded-xl font-bold border-2 border-orange bg-orange-50 text-orange-900">
              Behavioral Interview · CV-Tailored
            </span>
          </div>

          {submitError && (
            <div className="mb-4 mx-auto max-w-md flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{submitError}</p>
            </div>
          )}

          <button
            onClick={startInterview}
            disabled={loading}
            className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-lg shadow-orange-500/20 flex items-center gap-2 mx-auto"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <Play size={20} fill="currentColor" />}
            Start Session
          </button>
        </div>
      )}

      {(mode === 'interview' || mode === 'feedback') && (
        <div className="space-y-6">
          {/* Question Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative">
            <span className="absolute top-6 right-6 text-xs font-bold text-gray-400 uppercase tracking-wider">AI Interviewer</span>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-6 h-6 bg-orange rounded-full animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none text-slate-800 font-medium text-lg leading-relaxed mb-2">
                  "{question}"
                </div>
                <button
                  onClick={() => speak(question)}
                  className="text-xs font-bold text-gray-500 flex items-center gap-1 hover:text-black"
                >
                  <Volume2 size={14} /> Replay Audio
                </button>
              </div>
            </div>
          </div>

          {/* Answer Area */}
          {mode === 'interview' && (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-orange-100 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900 flex items-center gap-2"><User size={18} /> Your Answer</h4>
                <button
                  onClick={toggleListening}
                  aria-label="Toggle voice recording"
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition ${isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  {isListening ? 'Stop Recording' : 'Record Answer'}
                </button>
              </div>

              {micError && (
                <div className="mb-3 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-in slide-in-from-top">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800 flex-1">{micError}</p>
                  <button onClick={() => setMicError(null)} className="text-amber-400 hover:text-amber-600 transition flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>
              )}

              {isListening && (
                <div role="status" className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl animate-in slide-in-from-top">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-red-700 uppercase">Listening...</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-600 ml-1">{formatRecordingTime(recordingSeconds)}</span>
                    <div className="flex items-center gap-1 ml-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1 bg-red-400 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms`, height: `${Math.random() * 12 + 6}px` }} />
                      ))}
                    </div>
                  </div>
                  {interimTranscript && (
                    <p className="text-sm text-gray-500 italic">
                      <span className="font-medium">Live transcript (not saved yet): </span>
                      <span className="italic">{interimTranscript}</span>
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2 mb-3 text-center">Speak clearly into your microphone, or type your answer below.</p>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer will appear here as you speak, or you can type it directly…"
                className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange focus:border-transparent text-sm text-gray-800 mb-3"
              />

              {submitError && (
                <div className="mb-3 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 flex-1">{submitError}</p>
                  <button onClick={() => setSubmitError(null)} className="text-red-400 hover:text-red-600 transition flex-shrink-0"><X size={16} /></button>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !answer.trim()}
                  className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Submit Answer'}
                  {!loading && <Send size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {mode === 'feedback' && feedback && (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
              <div className="bg-orange-50 p-6 border-b border-orange-100">
                <h3 className="font-bold text-xl text-orange-900 flex items-center gap-2">
                  <Sparkles className="text-orange" /> Analysis Results
                </h3>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-wider">Performance Metrics</h4>
                  <ScoreBar label="Communication Clarity" score={feedback.clarity} color="bg-blue-500" subtitle="how clearly you communicated" />
                  <ScoreBar label="Confidence Tone" score={feedback.confidence} color="bg-purple-500" subtitle="vocal delivery and assertiveness" />
                  <ScoreBar label="Content Relevance" score={feedback.relevance} color="bg-teal-500" subtitle="how well your answer addressed the question" />
                  <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-slate-900 mb-2 text-sm">AI Feedback</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{feedback.feedback}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-wider">Suggested Improvement</h4>
                  <div className="bg-green-50 p-6 rounded-xl border border-green-100 relative">
                    <div className="absolute -left-1 top-6 bottom-6 w-1 bg-green-400 rounded-r-full" />
                    <p className="text-sm text-green-800 italic leading-relaxed">"{feedback.improvedAnswer}"</p>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => { setMode('setup'); setSubmitError(null); }}
                      className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2"
                    >
                      Next Question <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
