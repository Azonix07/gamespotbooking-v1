import React, { useEffect, useRef } from 'react';

/**
 * Minimal Voice Button Component
 * Compact inline voice control with live audio visualization
 */
const VoiceButton = ({ isListening, isSpeaking, onToggle, disabled }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    if (isListening) {
      startAudioAnalysis();
    } else {
      stopAudioAnalysis();
    }

    return () => stopAudioAnalysis();
  }, [isListening]);

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      visualize();
    } catch (error) {
      console.error('Microphone access error:', error);
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
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    drawWaveform(dataArrayRef.current);
    animationRef.current = requestAnimationFrame(visualize);
  };

  const drawWaveform = (dataArray) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const barCount = 15;
    const barWidth = width / barCount;
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    
    if (isListening) {
      gradient.addColorStop(0, 'rgba(240, 147, 251, 0.4)');
      gradient.addColorStop(1, 'rgba(245, 87, 108, 1)');
    } else if (isSpeaking) {
      gradient.addColorStop(0, 'rgba(79, 172, 254, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 242, 254, 1)');
    }

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const barHeight = (dataArray[dataIndex] / 255) * height * 0.8;
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        i * barWidth + 1,
        height - barHeight,
        barWidth - 2,
        barHeight
      );
    }
  };

  return (
    <div className={`voice-btn-container ${isListening ? 'active' : ''} ${isSpeaking ? 'speaking' : ''}`}>
      <button
        className="voice-btn"
        onClick={onToggle}
        disabled={disabled || isSpeaking}
        title={isListening ? 'Stop' : 'Voice input'}
      >
        {isListening ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        )}
      </button>
      
      {(isListening || isSpeaking) && (
        <canvas
          ref={canvasRef}
          className="voice-btn-canvas"
          width={150}
          height={32}
        />
      )}
      
      {isListening && <span className="voice-btn-label">Listening...</span>}
      {isSpeaking && <span className="voice-btn-label">Speaking...</span>}
    </div>
  );
};

export default VoiceButton;
