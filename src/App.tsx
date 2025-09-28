import React from 'react';
import { HashRouter  as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home/Home';
import Welcome from './pages/Welcome/Welcome';
import About from './pages/About/About';
import Features from './pages/Features/Features';
import FeatureDetail from './pages/Features/FeatureDetail';
import Quests from './pages/Features/Quests';
import Groups from './pages/Features/Groups';
import GoalsJournal from './pages/Features/GoalsJournal';
import TimeTracker from './pages/Features/TimeTracker';
import AppBlocker from './pages/Features/AppBlocker';
import Profile from './pages/Features/Profile';
import XpBadges from './pages/Features/XpBadges';
import Download from './pages/Download/Download';
import Privacy from './pages/Privacy/Privacy';
import Terms from './pages/Terms/Terms';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/download" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/features/quests-sidequests" element={<Quests />} />
          <Route path="/features/groups" element={<Groups />} />
          <Route path="/features/goals-journal" element={<GoalsJournal />} />
          <Route path="/features/time-tracker" element={<TimeTracker />} />
          <Route path="/features/app-blocker" element={<AppBlocker />} />
          <Route path="/features/profile" element={<Profile />} />
          <Route path="/features/xp-progress-badges" element={<XpBadges />} />
          <Route path="/features/:slug" element={<FeatureDetail />} />
          <Route path="/download" element={<Download />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
