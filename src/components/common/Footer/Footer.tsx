import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h3 className="gradient-text">Upshift</h3>
                        <p className="footer-tagline">
                            Transform your productivity, build better habits, and achieve your goals.
                        </p>
                    </div>

                    <div className="footer-links">
                        <div className="footer-section">
                            <h4 className="footer-section-title">Legal</h4>
                            <ul className="footer-link-list">
                                <li>
                                    <Link to="/privacy" className="footer-link">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/terms" className="footer-link">
                                        Terms & Conditions
                                    </Link>

                                   
                                </li>
                                  <li>
                                   <a
                                    href="https://support.apple.com/en-gb/118223"
                                    className="footer-link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    >
                                    Request a refund
                                    </a>

                                   
                                </li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h4 className="footer-section-title">Product</h4>
                            <ul className="footer-link-list">
                                <li>
                                    <Link to="/features" className="footer-link">
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/download" className="footer-link">
                                        Download
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h4 className="footer-section-title">Company</h4>
                            <ul className="footer-link-list">
                                <li>
                                    <Link to="/articles" className="footer-link">
                                        Articles
                                    </Link>
                                </li>
                                <li>
                                    <a href="mailto:support@joinupshift.com" className="footer-link">
                                        Contact
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="footer-copyright">
                        <p>&copy; 2025 Upshift. All rights reserved.</p>
                    </div>
                    <div className="footer-social">
                        <p className="footer-version">Version 1.1</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
