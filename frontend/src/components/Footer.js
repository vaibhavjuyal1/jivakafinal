/**
 * Footer Component
 * Includes links to Privacy Policy, Terms of Use, and social media
 */

import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Jivaka</h3>
            <p>Empowering Health Through AI</p>
            <p className="footer-tagline">Your trusted AI healthcare assistant for wellness and prevention.</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/chatbot">Jivaka Bot</a></li>
              <li><a href="/health-tracker">Health Tracker</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Use</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-icons">
              <a href="/" aria-label="Facebook" className="social-icon">📘</a>
              <a href="/" aria-label="Twitter" className="social-icon">🐦</a>
              <a href="/" aria-label="LinkedIn" className="social-icon">💼</a>
              <a href="/" aria-label="Instagram" className="social-icon">📷</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 Jivaka - Empowering Health Through AI.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

