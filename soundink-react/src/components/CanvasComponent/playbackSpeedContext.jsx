// PlaybackSpeedContext.jsx
import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';  // Import prop-types for validation


// Create a context for playback speed
const PlaybackSpeedContext = createContext();

// Custom hook to use the playback speed context
export const usePlaybackSpeed = () => useContext(PlaybackSpeedContext);

// Provider component to wrap around the app and provide playback speed state
export const PlaybackSpeedProvider = ({ children }) => {
  const [playbackSpeed, setPlaybackSpeed] = useState(Math.round(60000 / 250)); // ms per column; matches the default 250 BPM

  return (
    <PlaybackSpeedContext.Provider value={{ playbackSpeed, setPlaybackSpeed }}>
      {children}
    </PlaybackSpeedContext.Provider>
  );
};

// Add prop types validation for children
PlaybackSpeedProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };