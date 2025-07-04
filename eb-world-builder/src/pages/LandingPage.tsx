import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Globe, Users, MessageCircle, Monitor, LogIn, UserPlus, Plus, Palette, Mic, VolumeX, LayoutDashboard } from 'lucide-react';
import { supabase } from '../config/supabase';
import AuthComponent from '../components/Auth';
import WorldsGallery from '../components/WorldsGallery';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const [worldName, setWorldName] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createWorld = () => {
    if (worldName.trim()) {
      const worldId = Date.now().toString();
      // Pass temp=true if user is not logged in
      const tempParam = !user ? '&temp=true' : '';
      navigate(`/world/${worldId}?name=${encodeURIComponent(worldName)}${tempParam}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="landing-container">
      <div className="gradient-bg gradient-animated" />
      
      {/* Header with Auth Buttons */}
      <motion.header 
        className="landing-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <h2 className="header-logo">EB World Builder</h2>
          <div className="header-actions">
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <motion.button
                  className="btn-secondary"
                  onClick={() => navigate('/dashboard')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </motion.button>
                <motion.button
                  className="btn-secondary"
                  onClick={handleSignOut}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogIn size={16} />
                  Sign Out
                </motion.button>
              </>
            ) : (
              <motion.button
                className="btn-secondary"
                onClick={() => setShowAuth(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus size={16} />
                Sign In / Register
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>
      
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
          className="create-world-card glassmorphism-flat"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="create-world-icon">
            <Plus size={24} strokeWidth={1.5} />
          </div>
          <h2>Start Building Your World</h2>
          <div className="input-group">
            <input
              type="text"
              className="input-modern"
              placeholder="Enter world name..."
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createWorld()}
            />
            <motion.button
              className="btn-primary-modern"
              onClick={createWorld}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} />
              Create World
            </motion.button>
          </div>
          <p className="auth-hint">
            {user ? (
              <span>Logged in as {user.email}</span>
            ) : (
              <>Try it free! <span onClick={() => setShowAuth(true)} className="auth-link">Sign in</span> to save your world</>
            )}
          </p>
        </motion.div>

        <motion.div 
          className="features-grid"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.div 
            className="feature-card glassmorphism-flat"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="feature-icon-wrapper">
              <Globe size={24} strokeWidth={1.5} />
            </div>
            <h3>3D Environments</h3>
            <p>Build with skyboxes, GLB models, and custom spawn points</p>
          </motion.div>

          <motion.div 
            className="feature-card glassmorphism-flat"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="feature-icon-wrapper">
              <Users size={24} strokeWidth={1.5} />
            </div>
            <h3>Ready Player Me</h3>
            <p>Customize your avatar with Ready Player Me integration</p>
          </motion.div>

          <motion.div 
            className="feature-card glassmorphism-flat"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="feature-icon-wrapper">
              <Mic size={24} strokeWidth={1.5} />
            </div>
            <h3>Voice Chat</h3>
            <p>Real-time voice communication with spatial audio</p>
          </motion.div>

          <motion.div 
            className="feature-card glassmorphism-flat"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="feature-icon-wrapper">
              <Monitor size={24} strokeWidth={1.5} />
            </div>
            <h3>Screen Sharing</h3>
            <p>Share your screen and collaborate in real-time</p>
          </motion.div>
        </motion.div>

        {/* Worlds Gallery */}
        <motion.div
          className="worlds-gallery-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <WorldsGallery />
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

      {/* Auth Modal */}
      {showAuth && (
        <div className="auth-modal-overlay" onClick={() => setShowAuth(false)}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="auth-modal-close"
              onClick={() => setShowAuth(false)}
            >
              ×
            </button>
            <AuthComponent onSuccess={() => setShowAuth(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;