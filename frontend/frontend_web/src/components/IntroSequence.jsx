import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const IntroSequence = ({ onComplete }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Attempt to autoplay both audio and video together safely
    const playMedia = async () => {
      try {
        if (videoRef.current) await videoRef.current.play();
        if (audioRef.current) {
          audioRef.current.volume = 0.4; // Keeps the background music subtle
          await audioRef.current.play();
        }
      } catch (error) {
        console.log("Autoplay context handled smoothly. Awaiting interaction for audio if blocked.", error);
      }
    };

    playMedia();
  }, []);

  return (
    <div className="intro-container">
      {/* Skip Button */}
      <button className="skip-btn" onClick={onComplete}>
        Skip Intro ➔
      </button>

      {/* Background Video - Centered dynamically for all responsive devices */}
      <video
        ref={videoRef}
        className="intro-video"
        src="/public/videos/feature-5.mp4"
        muted // Muted by default to satisfy strict modern browser autoplay policies
        preload="auto"
        onEnded={onComplete}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: '100%',
          minHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 1
        }}
      />

      {/* Background Audio (Unmuted, synchronized) */}
      <audio ref={audioRef} src="/public/audio/Feel The Love_spotdown.mp3" preload="auto" />

      {/* Dark Overlay to make text and animations crisp */}
      <div className="intro-overlay" />

      {/* Animated Content Layer using Framer Motion */}
      <div className="intro-content">
        <motion.h1
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ fontSize: '3.5rem', fontWeight: '800', letterSpacing: '-0.05em', marginBottom: '1rem' }}
        >
          Welcome to <span style={{ color: '#6366f1' }}>SkillSwap</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          style={{ fontSize: '1.25rem', color: '#9ca3af', fontWeight: '300' }}
        >
          Learn. Teach. Connect. Evolve.
        </motion.p>
      </div>
    </div>
  );
};

export default IntroSequence;