import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import WorldBuilder from './pages/WorldBuilder';
import './styles/brandColors.css';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/world/:worldId" element={<WorldBuilder />} />
      </Routes>
    </Router>
  );
}

export default App;
