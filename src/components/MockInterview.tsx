
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, RefreshCw, Volume2, Play, AlertCircle, CheckCircle, Sparkles, MessageSquare, User, Brain, ArrowRight } from 'lucide-react';
import { generateInterviewQuestion, evaluateInterviewResponse } from '../services/geminiService';
import { InterviewFeedback, CandidateProfile } from '../types';

interface MockInterviewProps {
  candidate: CandidateProfile;
}

export const MockInterview: React.FC<MockInterviewProps> = ({ candidate }) => {
  const [mode, setMode] = useState<'setup' | 'interview' | 'feedback'>('setup');
  const [topic, setTopic] = useState<'behavioral' | 'technical'>('behavioral');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
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

        // Show interim results in real-time
        if (interim) {
          setInterimTranscript(interim);
        }

        // Add final results to answer
        if (final) {
          setAnswer(prev => (prev + ' ' + final).trim());
          setInterimTranscript(''); // Clear interim after adding final
        }
      };

      // Add error handling
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimTranscript('');

        // User-friendly error messages
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try speaking closer to the microphone.');
        } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          alert('Microphone access denied. Please enable microphone permissions in your browser settings.');
        } else if (event.error === 'aborted') {
          // Silent - user manually stopped
        } else {
          alert(`Speech recognition error: ${event.error}`);
        }
      };

      // Handle when recognition ends unexpectedly
      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart if it stops unexpectedly while still in listening mode
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            setIsListening(false);
            setInterimTranscript('');
          }
        }
      };
    }
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari and type your answer.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        alert('Failed to start microphone. Please check your permissions.');
      }
    }
  };

  const startInterview = async () => {
    setLoading(true);
    setFeedback(null);
    setAnswer('');
    const q = await generateInterviewQuestion(candidate.title, topic);
    setQuestion(q);
    setMode('interview');
    setLoading(false);

    // Auto-speak question
    speak(q);
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
    const result = await evaluateInterviewResponse(question, answer);
    setFeedback(result);
    setMode('feedback');
    setLoading(false);
  };

  const ScoreBar = ({ label, score, color }: { label: string, score: number, color: string }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm font-bold mb-1">
        <span className="text-slate-700">{label}</span>
        <span className={score >= 80 ? 'text-green-600' : score >= 60 ? 'text-orange' : 'text-red-500'}>{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${color}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl mb-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
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

      {mode === 'setup' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center py-16">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain size={40} className="text-orange" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to practice?</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Select a focus area for your mock interview session. I'll act as your interviewer.</p>

          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setTopic('behavioral')}
              className={`px-6 py-3 rounded-xl font-bold border-2 transition ${topic === 'behavioral' ? 'border-orange bg-orange-50 text-orange-900' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
            >
              Behavioral
            </button>
            <button
              onClick={() => setTopic('technical')}
              className={`px-6 py-3 rounded-xl font-bold border-2 transition ${topic === 'technical' ? 'border-orange bg-orange-50 text-orange-900' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
            >
              Technical
            </button>
          </div>

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
                <div className="w-6 h-6 bg-orange rounded-full animate-pulse"></div>
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

          {/* Answer Area (Visible in Interview Mode) */}
          {mode === 'interview' && (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-orange-100 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900 flex items-center gap-2"><User size={18} /> Your Answer</h4>
                <button
                  onClick={toggleListening}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition ${isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  {isListening ? 'Stop Recording' : 'Record Answer'}
                </button>
              </div>

              {/* Recording Status Indicator */}
              {isListening && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl animate-in slide-in-from-top">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-red-700 uppercase">Listening...</span>
                    </div>
                    {/* Audio level visualization */}
                    <div className="flex items-center gap-1 ml-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-red-400 rounded animate-pulse"
                          style={{
                            animationDelay: `${i * 100}ms`,
                            height: `${Math.random() * 12 + 6}px`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {interimTranscript && (
                    <p className="text-sm text-gray-700 italic">
                      <span className="text-gray-500 font-medium">Recognizing: </span>
                      <span className="text-gray-800">{interimTranscript}</span>
                    </p>
                  )}
                </div>
              )}

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here or use the microphone to transcribe..."
                className="w-full h-40 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-orange focus:border-transparent outline-none resize-none font-sans text-slate-700 leading-relaxed mb-4"
              />

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

          {/* Feedback Area (Visible in Feedback Mode) */}
          {mode === 'feedback' && feedback && (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
              <div className="bg-orange-50 p-6 border-b border-orange-100">
                <h3 className="font-bold text-xl text-orange-900 flex items-center gap-2">
                  <Sparkles className="text-orange" /> Analysis Results
                </h3>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Scores */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-wider">Performance Metrics</h4>
                  <ScoreBar label="Communication Clarity" score={feedback.clarity} color="bg-blue-500" />
                  <ScoreBar label="Confidence Tone" score={feedback.confidence} color="bg-purple-500" />
                  <ScoreBar label="Content Relevance" score={feedback.relevance} color="bg-teal-500" />

                  <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-slate-900 mb-2 text-sm">AI Feedback</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{feedback.feedback}</p>
                  </div>
                </div>

                {/* Improved Answer */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-wider">Suggested Improvement</h4>
                  <div className="bg-green-50 p-6 rounded-xl border border-green-100 relative">
                    <div className="absolute -left-1 top-6 bottom-6 w-1 bg-green-400 rounded-r-full"></div>
                    <p className="text-sm text-green-800 italic leading-relaxed">"{feedback.improvedAnswer}"</p>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => setMode('setup')}
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
