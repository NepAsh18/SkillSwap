import React from 'react';

const Footer = () => (
  <footer style={{ padding: '1rem', background: '#34495e', color: 'white', textAlign: 'center', marginTop: 'auto' }}>
    <p>&copy; {new Date().getFullYear()} SpringSwap. All rights reserved.</p>
  </footer>
);

export default Footer;