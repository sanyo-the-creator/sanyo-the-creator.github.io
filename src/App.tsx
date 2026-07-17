import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home/Home';
import Welcome from './pages/Welcome/Welcome';
import About from './pages/About/About';
import Features from './pages/Features/Features';
import FeatureDetail from './pages/Features/FeatureDetail';

import Articles from './pages/Articles/Articles';
import ArticleDetail from './pages/Articles/ArticleDetail';
import Download from './pages/Download/Download';
import Privacy from './pages/Privacy/Privacy';
import Terms from './pages/Terms/Terms';
import CreatorLanding from './pages/Creator/CreatorLanding';
import CreatorProgram from './pages/Creator/CreatorProgram';
import RedditProgram from './pages/Creator/RedditProgram';
import Quests from './pages/Creator/Quests';
import ScreenTime from './pages/Creator/ScreenTime';
import Mix from './pages/Creator/Mix';
import ContentLibrary from './pages/Creator/ContentLibrary';
import './styles/globals.css';
import PortalRouter from './pages/Portal/PortalRouter';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUserDetail from './pages/Admin/AdminUserDetail';
import AdminVideoReview from './pages/Admin/AdminVideoReview';
import AdminRedditReview from './pages/Admin/AdminRedditReview';
import ProfileLanding from './pages/Profile/ProfileLanding';
import ImageLab from './pages/ImageLab/ImageLab';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/portal/*" element={<PortalRouter />} />
        
        {/* Admin dashboard */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/user/:userId" element={<AdminUserDetail />} />
        <Route path="/admin/videos" element={<AdminVideoReview />} />
        <Route path="/admin/reddit" element={<AdminRedditReview />} />
        


        {/* Image cleaner — adversarial transform harness (local, in-browser) */}
        <Route path="/cleaner" element={<ImageLab />} />

        {/* Public profile page: /jergus or /jergus/tiktok */}
        <Route path="/:referralCode" element={<ProfileLanding />} />
        <Route path="/:referralCode/:platform" element={<ProfileLanding />} />

        {/* Creator programs without Layout (no black header) */}
        <Route path="/creator-program" element={<CreatorProgram />} />
        <Route path="/creator-program/reddit" element={<RedditProgram />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Download />} />
          <Route path="/home" element={<Home />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/features/:slug" element={<FeatureDetail />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:slug" element={<ArticleDetail />} />
          <Route path="/download" element={<Download />} />
          <Route path="/download/:platform" element={<Download />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          
          <Route path="/creator" element={<CreatorLanding />} />
          <Route path="/creator/quests" element={<Quests />} />
          <Route path="/creator/screentime" element={<ScreenTime />} />
          <Route path="/creator/mix" element={<Mix />} />
          <Route path="/creator/content" element={<ContentLibrary />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
