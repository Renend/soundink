import { mapNoteToSampleNumber, mapColorToInstrumentFolder, getMapRowToNote } from './soundMappings'; // Import both mappings
import { useBpm } from './bpmContext'; // Import the BPM context - changed Renee
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

// AudioContext is created lazily on first user gesture so iOS Safari doesn't suspend it.
let audioCtx = null;
let masterGainNode = null;
let limiterNode = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    masterGainNode = audioCtx.createGain();
    masterGainNode.gain.value = 0.8;

    limiterNode = audioCtx.createDynamicsCompressor();
    limiterNode.threshold.setValueAtTime(-6, audioCtx.currentTime);
    limiterNode.knee.setValueAtTime(0, audioCtx.currentTime);
    limiterNode.ratio.setValueAtTime(20, audioCtx.currentTime);
    limiterNode.attack.setValueAtTime(0.003, audioCtx.currentTime);
    limiterNode.release.setValueAtTime(0.25, audioCtx.currentTime);

    masterGainNode.connect(limiterNode);
    limiterNode.connect(audioCtx.destination);
  }
  return audioCtx;
};

// Must be called inside a user gesture handler (click/tap) before any audio plays.
// On iOS Safari, the AudioContext must be created AND resumed within a user gesture.
export const resumeAudioContext = async () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
};

const MAX_CACHE_SIZE = 50; // Set a limit for the cache size
const MAX_ACTIVE_SOURCES = 20;

// Cache for audio buffers to avoid reloading sounds repeatedly
const bufferCache = {};

// Store references to active audio sources
let activeSources = [];

// Preload only fetches and stores raw ArrayBuffers in IndexedDB.
// Decoding into AudioBuffers is deferred until first playback (after user gesture).
export const preloadSounds = async () => {
  const soundFiles = generateSoundFiles();
  const db = await openDB(DB_NAME, STORE_NAME);

  try {
    for (const filePath of soundFiles) {
      let arrayBuffer = await getFromDB(db, STORE_NAME, filePath);
      if (!arrayBuffer) {
        const response = await fetch(filePath);
        arrayBuffer = await response.arrayBuffer();
        await saveToDB(db, STORE_NAME, filePath, arrayBuffer);
        console.log(`Preloaded and cached: ${filePath}`);
      } else {
        console.log(`Loaded from cache: ${filePath}`);
      }
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
  const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer.slice(0));
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
  audioContext = null, // If null, uses the global lazy-initialized context
  destination = null // Default to null if not provided
) => {
  if (!color || !note || !colorInstrumentMap[color]) {
    console.error("Invalid sound parameters:", { color, note, colorInstrumentMap });
    return;
  }

  // Use the provided audioContext (e.g. for export), or fall back to the global lazy context
  if (!audioContext) audioContext = getAudioContext();

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
    gainNode.connect(masterGainNode); // masterGainNode is initialized by getAudioContext()
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
  if (masterGainNode) {
    masterGainNode.gain.value = Math.max(0, Math.min(volume, 1)); // Volume range: 0 (mute) to 1 (full)
  }
};

