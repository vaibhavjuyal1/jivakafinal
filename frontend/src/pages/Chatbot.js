import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm Jivaka, your AI healthcare assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ Auto-scroll chat
  // ✅ Initialize Web Speech API for voice input
useEffect(() => {
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true; // ✅ continuous listening
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("🎤 Voice recognition started");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      console.log("🎙️ Recognized:", transcript);
      setInputText(transcript);
      handleSendMessage(transcript);
    };

    recognition.onerror = (event) => {
      console.error("❌ Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        console.log("⚠️ No speech detected, restarting recognition...");
        recognition.stop();
        setTimeout(() => recognition.start(), 1000);
      } else {
        alert(`Voice input error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("🛑 Voice recognition ended");
      setIsListening(false);
    };
  } else {
    alert("🎤 Voice recognition is not supported in your browser. Please use Google Chrome.");
  }
}, []);
useEffect(() => {
  if ("speechSynthesis" in window) {
    synthesisRef.current = window.speechSynthesis;
    console.log("✅ Speech synthesis initialized");
  } else {
    alert("Your browser does not support speech synthesis.");
  }
}, []);


  // ✅ Send message to backend
  const handleSendMessage = async (text = null) => {
  // ✅ Prevent event objects from being sent
  if (text && typeof text === "object") return;

  const messageText = typeof text === "string" ? text : inputText.trim();
  if (!messageText) return;


    setIsProcessing(true);

    const userMessage = {
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    try {
      const response = await axios.post(`${API_BASE_URL}/chatbot`, {
        message: messageText,
        conversationHistory: messages,
      });

      const botMessage = {
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // ✅ Auto voice Speak
      if (synthesisRef.current) speakMessage(botMessage.text);
    } catch (error) {
      console.error('Chatbot error:', error);

      setMessages((prev) => [
        ...prev,
        {
          text: "I'm sorry, I encountered an error. Please try again.",
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Voice Input Button
  const handleVoiceInput = () => {
  if (!recognitionRef.current) {
    alert('Voice recognition is not supported in your browser. Please use text input.');
    return;
  }

  if (isListening) {
    recognitionRef.current.stop();
    setIsListening(false);
  } else {
    console.log("🎤 Starting recognition...");
    setTimeout(() => {
      recognitionRef.current.start();
    }, 1000); // ✅ wait 1s before starting
  }
};




  // ✅ Speak the bot's message
  const speakMessage = (text) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
  }

    if (!synthesisRef.current) {
      synthesisRef.current = window.speechSynthesis;
  }

  // 🧹 Stop any ongoing speech before starting new
    synthesisRef.current.cancel();

  // 🗣️ Create the speech message
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      console.log("🔊 Speaking started...");
      setIsSpeaking(true);
  };

    utterance.onend = () => {
      console.log("✅ Speaking finished.");
      setIsSpeaking(false);
  };

    utterance.onerror = (err) => {
      console.error("❌ Speech synthesis error:", err);
      setIsSpeaking(false);
  };

    synthesisRef.current.speak(utterance);
};

  // ✅ Image Upload Handler
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Upload an image only.');

    setIsProcessing(true);

    const userMessage = {
      text: `📷 [Image Uploaded: ${file.name}]`,
      sender: 'user',
      timestamp: new Date(),
      image: URL.createObjectURL(file),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${API_BASE_URL}/analyze-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const botMessage = {
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      speakMessage(botMessage.text);
    } catch (err) {
      console.error('Image Error:', err);
    }

    setIsProcessing(false);
  };

  return (
    <div className="chatbot-page">
      <div className="container">
        <div className="chatbot-header">
          <h1>Jivaka Bot</h1>
          <p>Your AI healthcare assistant</p>
        </div>

        <div className="chatbot-container card">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message ${
                  msg.sender === 'user' ? 'user-message' : 'bot-message'
                }`}
              >
                {msg.image && (
                  <img className="message-image" src={msg.image} alt="" />
                )}
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            {isProcessing && (
              <div className="bot-message">⏳ Processing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <div className="input-actions">
              {/* 🎤 Voice Input Button */}
              <button
              className={`action-btn ${isListening ? 'active' : ''}`}
              onClick={handleVoiceInput}
              title="Voice Input"
              >
                🎤 {isListening ? 'Listening...' : 'Voice'}
              </button>

                {/* 🔊 Mute / Stop Speaking Button */}
              <button
                className={`action-btn ${isSpeaking ? 'active' : ''}`}
                onClick={() => synthesisRef.current?.cancel()}
                title="Stop Speaking"
              >
                🔊 {isSpeaking ? 'Speaking...' : 'Mute'}
              </button>

              {/* 📷 Image Upload Button */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
              className="action-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image"
              >
                📷 Image
              </button>
            </div>



            <textarea
              className="chat-input"
              placeholder="Type your message or use voice..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />

            <button className="send-btn" onClick={handleSendMessage}>
              ➜ Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;


