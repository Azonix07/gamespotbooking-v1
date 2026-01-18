import React from 'react';
import '../styles/Footer.css';

const Footer = ({ transparent = false }) => {
  return (
    <footer className={`site-footer ${transparent ? 'footer-transparent' : ''}`}>
      <div className="footer-content">
        <p className="copyright-text">
          © Copyright 2026 CarbonCrew Technologies. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
