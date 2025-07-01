import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const [worldName, setWorldName] = useState('');
  const navigate = useNavigate();

  const createWorld = () => {
    if (worldName.trim()) {
      const worldId = Date.now().toString();
      navigate(`/world/${worldId}?name=${encodeURIComponent(worldName)}`);
    }
  };

  return (
    <div className="landing-container">
      <div className="gradient-bg gradient-animated" />
      
      <div className="particles">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight 
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear"
            }}
          />
        ))}
      </div>

      <motion.div 
        className="content-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div 
          className="hero-section"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <h1 className="hero-title">
            <span className="gradient-text">EB World Builder</span>
          </h1>
          <p className="hero-subtitle">
            Create immersive 3D worlds with your friends in real-time
          </p>
        </motion.div>

        <motion.div 
          className="create-world-card glassmorphism"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h2>Start Building Your World</h2>
          <div className="input-group">
            <input
              type="text"
              className="input-glass"
              placeholder="Enter world name..."
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createWorld()}
            />
            <motion.button
              className="btn-primary"
              onClick={createWorld}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create World
            </motion.button>
          </div>
        </motion.div>

        <motion.div 
          className="features-grid"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.div 
            className="feature-card glassmorphism"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="feature-icon">🌍</div>
            <h3>3D Environments</h3>
            <p>Build with skyboxes, GLB models, and custom spawn points</p>
          </motion.div>

          <motion.div 
            className="feature-card glassmorphism"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="feature-icon">👥</div>
            <h3>Ready Player Me</h3>
            <p>Customize your avatar with Ready Player Me integration</p>
          </motion.div>

          <motion.div 
            className="feature-card glassmorphism"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="feature-icon">💬</div>
            <h3>Real-time Chat</h3>
            <p>Voice and text chat with friends in your world</p>
          </motion.div>

          <motion.div 
            className="feature-card glassmorphism"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="feature-icon">🖥️</div>
            <h3>Screen Sharing</h3>
            <p>Share your screen and collaborate in real-time</p>
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="floating-orbs">
        <motion.div 
          className="orb orb-1"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="orb orb-2"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
};

export default LandingPage;