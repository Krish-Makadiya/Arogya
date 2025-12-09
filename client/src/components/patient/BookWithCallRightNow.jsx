import React, { useState, useRef, useEffect } from "react";
import { PhoneOutgoing } from "lucide-react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";

const BookWithCallRightNow = () => {
  const [showModal, setShowModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState(null);
  const { user } = useUser();
  const recognitionRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setDoctorLoading(true);
        const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
        const res = await axios.get(`${API_BASE_URL}/api/doctor/verified-doctors`);
        if (!mounted) return;
        setDoctors(res.data?.data || []);
        // Log doctor and patient details
        console.log('Fetched doctors:', res.data?.data || []);
        console.log('Patient details:', user);
      } catch (err) {
        setDoctorError("Failed to load doctors");
      } finally {
        if (mounted) setDoctorLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleMicClick = () => {
    if (!isRecording) {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition not supported in this browser.');
        return;
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interim += transcriptPart;
          }
        }
        if (finalTranscript) setTranscript(prev => prev + finalTranscript);
        setInterimTranscript(interim);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => {
        setIsRecording(false);
        setInterimTranscript("");
      };
      recognitionRef.current = recognition;
      setIsRecording(true);
      recognition.start();
    } else {
      recognitionRef.current && recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
  };

  const copyToClipboard = () => {
    if (transcript) navigator.clipboard.writeText(transcript);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="flex gap-2 items-center font-semibold fixed bottom-24 right-6 shadow-lg border border-green-400"
        style={{
          background: "#fff",
          color: "#12A594",
          borderRadius: 999,
          padding: "14px 26px",
          fontSize: 17,
          boxShadow: "0 4px 16px rgba(18,165,148,0.13)",
          border: "2px solid #12A594",
          transition: "background 0.2s, color 0.2s",
          zIndex: 1001,
        }}
        onClick={() => setShowModal(true)}
        onMouseOver={e => {
          e.currentTarget.style.background = '#12A594';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.color = '#12A594';
        }}
      >
        <PhoneOutgoing size={22} />
        <span style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
          Book with Call Right Now
        </span>
      </button>
      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <div
            className="rounded-xl shadow-lg flex flex-col items-center justify-between animate-fade-in"
            style={{
              width: 400,
              height: 250,
              background: "#fff",
              padding: "1.5rem",
              border: "1.5px solid #12A594",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              style={{fontSize: 24, background: 'none', border: 'none', cursor: 'pointer'}}
            >
              ×
            </button>
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 px-2">
              <span className="text-base font-semibold mb-2">Book an Appointment</span>
              <div className="w-full flex flex-col items-center">
                <div className="w-full flex flex-col items-center mb-2">
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-base mb-2"
                    style={{ minHeight: 80, background: '#f8f9fa' }}
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder="Your reason for booking will appear here. Click the mic to start speaking!"
                  />
                  {interimTranscript && (
                    <div className="text-xs italic text-gray-400 mt-1">Speaking: "{interimTranscript}"</div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleMicClick}
                      className={`px-4 py-2 rounded-full font-semibold border transition flex items-center gap-2 ${isRecording ? 'bg-green-100 border-green-400 text-green-700' : 'bg-white border-gray-300 text-green-600'}`}
                      title={isRecording ? 'Listening...' : 'Click to speak'}
                    >
                      {isRecording ? '⏹ Stop' : '🎤 Speak'}
                    </button>
                    <button
                      onClick={clearTranscript}
                      className="px-3 py-2 rounded-full border border-gray-300 text-gray-500 bg-white"
                    >
                      🗑 Clear
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-2 rounded-full border border-gray-300 text-gray-500 bg-white"
                      disabled={!transcript}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500 mb-2">
                  Please enter your reason for visit, preferred date/time, and any special requests.<br />
                  (e.g. "Consult for headache, tomorrow after 4pm, prefer female doctor.")
                </p>
                {!isRecording && transcript.trim() && (
                  <button
                    className="mt-3 px-6 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold transition"
                    onClick={async () => {
                      const now = new Date();
                      const userInput = transcript.trim();
                      const prompt = `
You are an AI assistant for appointment booking. The user provided the following input for booking a doctor appointment:

---
Input: ${userInput}
Current DateTime: ${now.toISOString()}
---

Based on this, extract and suggest:
- The most appropriate appointment date and time (ISO format)
- The medium of consultation ("online" or "offline")
- An array of symptoms extracted from the input

Respond ONLY in the following JSON format:
{
  "appointmentDateTime": "YYYY-MM-DDTHH:MM:SSZ",
  "consultationMedium": "online | offline",
  "symptoms": ["symptom1", "symptom2", ...]
}`;
                      try {
                        const res = await fetch('http://localhost:5000/api/ai/gemini-booking', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ prompt })
                        });
                        const data = await res.json();
                        console.log('Gemini AI response:', data);
                      } catch (e) {
                        console.error('Gemini AI error:', e);
                      }
                    }}
                  >
                    Book
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookWithCallRightNow;
