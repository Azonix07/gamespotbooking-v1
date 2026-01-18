import React, { useState, useEffect, useRef } from 'react';
import './VoiceInterface.css';

const VoiceInterface = ({ onVoiceInput, isListening, isSpeaking, onToggleListening }) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformData, setWaveformData] = useState(Array(50).fill(0));
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);

  // Initialize audio analyzer for visualization
  useEffect(() => {
    if (isListening && !audioContextRef.current) {
      startAudioAnalysis();
    } else if (!isListening && audioContextRef.current) {
      stopAudioAnalysis();
    }

    return () => {
      stopAudioAnalysis();
    };
  }, [isListening]);

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      visualize();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setAudioLevel(average / 255);
      
      // Update waveform data (sample every few frequencies for smoother visualization)
      const sampleSize = Math.floor(bufferLength / 50);
      const newWaveform = [];
      for (let i = 0; i < 50; i++) {
        const index = i * sampleSize;
        newWaveform.push(dataArray[index] / 255);
      }
      setWaveformData(newWaveform);
      
      drawCanvas(newWaveform);
    };
    
    draw();
  };

  const drawCanvas = (waveform) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#f093fb');
    
    // Draw waveform bars
    const barWidth = width / waveform.length;
    waveform.forEach((value, index) => {
      const barHeight = value * height * 0.8;
      const x = index * barWidth;
      const y = height - barHeight;
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 2, barHeight);
      
      // Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = isListening ? '#667eea' : '#f093fb';
    });
  };

  return (
    <div className={`voice-interface ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
      <div className="voice-visualizer">
        {/* Circular pulse animation */}
        <div className="voice-pulse-container">
          <div 
            className="voice-pulse-ring" 
            style={{ 
              transform: `scale(${1 + audioLevel * 0.5})`,
              opacity: audioLevel 
            }}
          />
          <div 
            className="voice-pulse-ring delay-1" 
            style={{ 
              transform: `scale(${1 + audioLevel * 0.3})`,
              opacity: audioLevel * 0.7 
            }}
          />
          <div 
            className="voice-pulse-ring delay-2" 
            style={{ 
              transform: `scale(${1 + audioLevel * 0.2})`,
              opacity: audioLevel * 0.5 
            }}
          />
          
          {/* Microphone icon */}
          <button 
            className="voice-mic-button" 
            onClick={onToggleListening}
            style={{
              transform: `scale(${1 + audioLevel * 0.15})`
            }}
          >
            {isListening ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" opacity="0.3"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" opacity="0.3"/>
                <path d="M10.8 4.9c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2l-.01 6.2c0 .66-.53 1.2-1.19 1.2-.66 0-1.2-.54-1.2-1.2V4.9z" opacity="0.5"/>
              </svg>
            )}
          </button>
        </div>
        
        {/* Waveform canvas */}
        <canvas 
          ref={canvasRef} 
          className="voice-waveform-canvas"
          width={300}
          height={80}
        />
        
        {/* Status text */}
        <div className="voice-status-text">
          {isListening && (
            <span className="status-listening">
              <span className="status-indicator"></span>
              Listening...
            </span>
          )}
          {isSpeaking && (
            <span className="status-speaking">
              <span className="status-indicator"></span>
              Speaking...
            </span>
          )}
          {!isListening && !isSpeaking && (
            <span className="status-idle">
              Tap to speak
            </span>
          )}
        </div>
      </div>
      
      {/* Audio level indicator */}
      <div className="voice-level-bars">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="voice-level-bar"
            style={{
              height: `${waveformData[i * 2] * 100}%`,
              opacity: waveformData[i * 2] > 0.1 ? 1 : 0.3,
              animationDelay: `${i * 0.05}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VoiceInterface;
