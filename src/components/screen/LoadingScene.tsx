import React from 'react';
import { EarthCanvas } from '../3d/Earth';

export const LoadingScene: React.FC = () => {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to bottom right, #10b981, #059669)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      {/* 背景の3D地球 */}
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto'
      }}>
        <EarthCanvas />
      </div>

      {/* Loading テキスト */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <h1 style={{ 
          color: 'white', 
          fontSize: '3rem', 
          fontWeight: 300, 
          letterSpacing: '0.1em',
          margin: 0
        }}>
          Loading
          <span style={{ display: 'inline-block', marginLeft: '0.25rem', animation: 'pulse 1.5s infinite' }}>.</span>
          <span style={{ display: 'inline-block', marginLeft: '0.25rem', animation: 'pulse 1.5s infinite 0.2s' }}>.</span>
          <span style={{ display: 'inline-block', marginLeft: '0.25rem', animation: 'pulse 1.5s infinite 0.4s' }}>.</span>
        </h1>
      </div>
    </div>
  );
};
