import { mapNoteToSampleNumber, mapColorToInstrumentFolder, getMapRowToNote } from './soundMappings'; // Import both mappings
import { useBpm } from './bpmContext'; // Import the BPM context
import { gridConfigurations } from '../GridComponent/gridConfig';
import { openDB, getFromDB, saveToDB } from './utils';

const DB_NAME = 'SoundCache';
const STORE_NAME = 'AudioBuffers';

// List of instruments and the number of sound files for each
const instruments = {
  bass: 25,
  // pianohigh: 25,
  // pianolow: 25,
  piano: 25,
  marimba: 25,
  epiano: 25,
  guitar: 25,
  synthflute: 25,
  // floom: 25,
  // strings: 25,
  mute: 0, // Special case for muted sounds
};

// Function to dynamically generate file paths
const generateSoundFiles = () => {
  const soundFiles = [];
  for (const [instrument, count] of Object.entries(instruments)) {
    for (let i = 1; i <= count; i++) {
      const paddedNumber = String(i).padStart(3, '0'); // Ensures numbers are zero-padded (e.g., 001, 002)
      soundFiles.push(`${import.meta.env.BASE_URL}audio/compact/${instrument}/${instrument}-${paddedNumber}.mp3`);
    }
  }
  return soundFiles;
};

// Initialize the Web Audio context globally
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const MAX_CACHE_SIZE = 50; // Set a limit for the cache size
const MAX_ACTIVE_SOURCES = 20;

// Cache for audio buffers to avoid reloading sounds repeatedly
const bufferCache = {};

// Store references to active audio sources
let activeSources = [];

// Master gain node to control overall volume
const masterGainNode = audioCtx.createGain();
masterGainNode.gain.value = 0.8; // Set the initial master volume (adjustable)

// Create a limiter (dynamics compressor) to prevent clipping
const limiterNode = audioCtx.createDynamicsCompressor();
limiterNode.threshold.setValueAtTime(-6, audioCtx.currentTime); // Start limiting at -6 dB
limiterNode.knee.setValueAtTime(0, audioCtx.currentTime); // Hard knee for abrupt limiting
limiterNode.ratio.setValueAtTime(20, audioCtx.currentTime); // High ratio, acts like a limiter
limiterNode.attack.setValueAtTime(0.003, audioCtx.currentTime); // Fast attack to catch peaks
limiterNode.release.setValueAtTime(0.25, audioCtx.currentTime); // Short release

// Connect the master gain to the limiter, and then connect to audio context destination
masterGainNode.connect(limiterNode);
limiterNode.connect(audioCtx.destination);

export const preloadSounds = async () => {
  const soundFiles = generateSoundFiles(); // Generate all sound file paths dynamically
  const db = await openDB(DB_NAME, STORE_NAME);

  try {
    for (const filePath of soundFiles) {
      let arrayBuffer = await getFromDB(db, STORE_NAME, filePath);
      let audioBuffer;

      if (!arrayBuffer) {
        const response = await fetch(filePath);
        arrayBuffer = await response.arrayBuffer();
        await saveToDB(db, STORE_NAME, filePath, arrayBuffer);
        console.log(`Preloaded and cached: ${filePath}`);
      } else {
        console.log(`Loaded from cache: ${filePath}`);
      }

      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      bufferCache[filePath] = audioBuffer; // Store in memory cache
    }
  } catch (error) {
    console.error('Error preloading sounds:', error);
  }
};

// Function to load an audio buffer for a specific sample
const loadAudioBuffer = async (filePath) => {
  if (bufferCache[filePath]) {
    return bufferCache[filePath]; // Return cached buffer if it exists
  }

  if (Object.keys(bufferCache).length >= MAX_CACHE_SIZE) {
    // Remove the oldest entry in the cache if it exceeds the limit
    delete bufferCache[Object.keys(bufferCache)[0]];
  }

  const db = await openDB(DB_NAME, STORE_NAME);
  let arrayBuffer = await getFromDB(db, STORE_NAME, filePath);
  if (!arrayBuffer) {
    const response = await fetch(filePath);
    arrayBuffer = await response.arrayBuffer();
    await saveToDB(db, STORE_NAME, filePath, arrayBuffer);
  }
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  bufferCache[filePath] = audioBuffer; // Cache the loaded buffer
  return audioBuffer;
};

// Define ADSR, detuning, base volume, and sustain settings for each instrument
const instrumentSettings = {
  bass: { attack: 0, decay: 0.3, sustain: 0.8, release: 0.5, detuneMin: -0.0005, detuneMax: 0.0005, baseVolume: 0.4, sustainMultiplier: 150 },
  epiano: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.4, detuneMin: -0.001, detuneMax: 0.001, baseVolume: 0.3, sustainMultiplier: 200 },
  // floom: { attack: 0, decay: 0.2, sustain: 0.9, release: 0.3, detuneMin: -0.002, detuneMax: 0.002, baseVolume: 0.4, sustainMultiplier: 180 },
  guitar: { attack: 0, decay: 0.3, sustain: 0.7, release: 0.5, detuneMin: -0.001, detuneMax: 0.001, baseVolume: 0.4, sustainMultiplier: 300 },
  marimba: { attack: 0, decay: 0.1, sustain: 0.7, release: 0.3, detuneMin: -0.002, detuneMax: 0.002, baseVolume: 0.4, sustainMultiplier: 300 },
  // pianohigh: { attack: 0, decay: 0.3, sustain: 0.6, release: 0.4, detuneMin: -0.0001, detuneMax: 0.0001, baseVolume: 0.4, sustainMultiplier: 250 },
  // pianolow: { attack: 0, decay: 0.4, sustain: 0.6, release: 0.5, detuneMin: -0.0001, detuneMax: 0.0001, baseVolume: 0.4, sustainMultiplier: 200 },
  piano: { attack: 0, decay: 0.3, sustain: 0.6, release: 0.4, detuneMin: -0.0001, detuneMax: 0.0001, baseVolume: 0.4, sustainMultiplier: 250 },
  // strings: { attack: 0, decay: 0.5, sustain: 0.4, release: 0.7, detuneMin: -0.002, detuneMax: 0.002, baseVolume: 0.2, sustainMultiplier: 20 },
  synthflute: { attack: 0, decay: 0.25, sustain: 0.7, release: 0.4, detuneMin: -0.003, detuneMax: 0.003, baseVolume: 0.3, sustainMultiplier: 160 }
};

// Function to generate slight random variations
// const getRandomVariation = (min, max) => Math.random() * (max - min) + min;
const getRandomVariation = (min, max) => {
  const randomValue = Math.random() ** 2; // Squaring biases towards 0
  return randomValue * (max - min) + min;
};


export const playSound = async (
  color,
  note,
  polyphonyCount = 1,
  bpm, // Pass bpm directly
  lineId,
  colorInstrumentMap,
  accent = false,
  audioContext = audioCtx, // Default to global audioCtx if not provided
  destination = null // Default to null if not provided
) => {
  if (!color || !note || !colorInstrumentMap[color]) {
    console.error("Invalid sound parameters:", { color, note, colorInstrumentMap });
    return;
  }

  // Calculate playback speed from bpm
  const playbackSpeed = Math.round(60000 / bpm);

  let instrumentFolder = colorInstrumentMap[color] || 'defaultInstrument';

  if (instrumentFolder === 'mute') {
    // If instrument is mute, skip playback
    return;
  }

    // If the instrument is 'piano', randomly pick 'pianolow' or 'pianohigh'
  // if (instrumentFolder === 'piano') {
    // instrumentFolder = Math.random() < 0.5 ? 'pianolow' : 'pianohigh';
    // instrumentFolder = 'pianohigh'; // Force high piano for now
    // instrumentFolder = 'pianolow'; // Force low piano for now
  // }

  // Set accent volume multiplier (for example, 1.5x the normal volume)
  const accentMultiplier = accent ? 1.7 : 0.5;

  const sampleNumber = mapNoteToSampleNumber[note];
  if (!sampleNumber) {
    console.error(`No sample number found for note: ${note}`);
    return;
  }

  const sampleFile = `${instrumentFolder}-${sampleNumber}.mp3`;
  const filePath = `${import.meta.env.BASE_URL}audio/compact/${instrumentFolder}/${sampleFile}`;
  const audioBuffer = await loadAudioBuffer(filePath);

  const settings = instrumentSettings[instrumentFolder] || {
    attack: 0.1,
    decay: 0.2,
    sustain: 0.7,
    release: 0.3,
    detuneMin: -0.005,
    detuneMax: 0.005,
    baseVolume: 0.5,
    sustainMultiplier: 100
  };

  const randomAmplitudeVariation = getRandomVariation(0.2, 0.4);

  const adjustedVolume = Math.min(
    (1 / Math.sqrt(polyphonyCount)) * settings.baseVolume * randomAmplitudeVariation * accentMultiplier,
    1
  );

  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();

  const detuneAmount = getRandomVariation(settings.detuneMin, settings.detuneMax);
  source.playbackRate.value = 1 + detuneAmount;

  const baseCutoffFrequency = 11000;
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(
    baseCutoffFrequency + getRandomVariation(-1000, 1000),
    audioContext.currentTime
  );

  source.buffer = audioBuffer;
  source.connect(filterNode);
  filterNode.connect(gainNode);

  // Connect the gainNode to the destination if provided
  if (destination) {
    gainNode.connect(destination);
  } else {
    gainNode.connect(masterGainNode); // Connect each gainNode to the master gain node
  }

  const attack = settings.attack;
  const decay = settings.decay;
  const sustainLevel = settings.sustain;
  const release = settings.release;
  const sustainDuration = settings.sustainMultiplier / playbackSpeed;

  const currentTime = audioContext.currentTime;

  gainNode.gain.setValueAtTime(0, currentTime);
  gainNode.gain.linearRampToValueAtTime(adjustedVolume, currentTime + attack);
  gainNode.gain.linearRampToValueAtTime(
    sustainLevel * adjustedVolume,
    currentTime + attack + decay
  );
  gainNode.gain.setValueAtTime(
    sustainLevel * adjustedVolume,
    currentTime + attack + decay + sustainDuration
  );
  gainNode.gain.linearRampToValueAtTime(
    0,
    currentTime + attack + decay + sustainDuration + release
  );

  source.start(currentTime);
  source.stop(currentTime + attack + decay + sustainDuration + release);

  // Store the active source, associated with its line
  activeSources.push({ source, lineId });
};


// Function to stop any active sounds associated with a particular line
export const stopSoundsForLine = (lineId) => {
  activeSources = activeSources.filter(({ source, lineId: id }) => {
    if (id === lineId) {
      try {
        source.stop();
      } catch (err) {
        console.error('Error stopping sound source:', err);
      }
      return false; // Remove the source from activeSources
    }
    return true; // Keep the other sources
  });
};

// Function to adjust the master volume
export const setMasterVolume = (volume) => {
  masterGainNode.gain.value = Math.max(0, Math.min(volume, 1)); // Volume range: 0 (mute) to 1 (full)
};

