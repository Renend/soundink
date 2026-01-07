import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import './interface.css'; // Importing the associated CSS file for styles
import { PlayIcon, StopIcon, UndoIcon, RedoIcon, BrushIcon, EraseIcon, LoopIcon, TempoIcon, GridIcon, GearIcon, TrashIcon, quitIcon, NoLoopIcon, downloadIcon, uploadIcon, CleanIcon, muteIcon, bassIcon, guitarIcon, marimbaIcon, pianoIcon, violinIcon, fluteIcon, glassIcon, synthIcon, majorIcon, harmonicMinorIcon, melodicMinorIcon, minorPentatonicIcon, majorPentatonicIcon, instrumentIcons, scaleIcons, customInstrumentNames, customScaleNames, colors, sizes, MAX_DELAY, ERASER_COLOR, options, isPointNearDot, isPointNearLineSegment, useBpm, usePlaybackSpeed, useMediaQuery, uuidv4, stopSoundsForLine, preloadSounds, getSvgPathFromStroke, getStroke, getMapRowToNote, setScale, playSound, GridCanvas, firstColumn, fistColumnScan, numDotsX, numDotsY, dotRadius, canvasDimensions, gridConfigurations, setMasterVolume, getStrokeWidthFromOptions, calculateLocalWidth, PaletteIcon, EditIcon } from './import'; // Importing the necessary functions and constants from the import file
import { mapNoteToSampleNumber, scales } from './soundMappings';
import { Canvg } from 'canvg';
import pointInPolygon from 'point-in-polygon'; // Import the library
import { getStrokePoints, getStrokeOutlinePoints } from 'perfect-freehand'; // Importing the necessary functions from perfect-freehand

const pointInterpolationDivisor = 10; // Adjust this value to control the density of interpolated points

const CanvasComponent = () => {
  const [activePointerId, setActivePointerId] = useState(null); // Track the active pointer ID
  const { playbackSpeed, setPlaybackSpeed } = usePlaybackSpeed(); // Access playbackSpeed
  const [sonificationPoints, setSonificationPoints] = useState([]); // Points that trigger sounds
  const [lines, setLines] = useState([]); // List of drawn lines
  const [currentLine, setCurrentLine] = useState([]); // Current line being drawn
  const [currentColor, setCurrentColor] = useState('color1'); // Currently selected brush color
  const [currentSize, setCurrentSize] = useState(30); // Currently selected brush size
  const [isEraser, setIsEraser] = useState(false); // Toggle for eraser mode
  const [isTrash, setIsTrash] = useState(false); // Toggle for trash mode
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [trashLinePoints, setTrashLinePoints] = useState([]);
  const [undoStack, setUndoStack] = useState([]); // Stack for undo functionality
  const [redoStack, setRedoStack] = useState([]); // Stack for redo functionality
  const [currentColumn, setCurrentColumn] = useState(-1); // Current column being played back (for visual feedback)
  const intersectedDots = useRef({}); // Ref to track intersected dots
  const [showGrid, setShowGrid] = useState(true); // Add state to control grid visibility
  const [isPlaying, setIsPlaying] = useState(false); // To control playback state
  const [loop, setLoop] = useState(true); // To control looping
  let playbackStopped = useRef(false); // To stop playback externally
  const [scannedColumn, setScannedColumn] = useState(-1);
  const [previousColor, setPreviousColor] = useState(colors[0]);
  const [currentScale, setCurrentScale] = useState('pentatonicMinor'); // Default scale is harmonic minor
  const [isScaleMenuOpen, setIsScaleMenuOpen] = useState(false); // Toggle for pop-up
  const { bpm, setBpm } = useBpm(); // Access bpm and setBpm from context
  const scaleMenuRef = useRef(null); // Ref for the scale menu
  const instrumentMenuRef = useRef(null); // Ref for the instrument menu
  const originalSvgSize = useRef({ width: window.innerWidth, height: window.innerHeight });
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const [isDownloading, setIsDownloading] = useState(false); // State for downloading files
  const [isClearScreenPopupVisible, setIsClearScreenPopupVisible] = useState(false);
  const [isSavePopupVisible, setIsSavePopupVisible] = useState(false);
  const svgRef = useRef();
  let loadInputRef = null; // Create a ref for the hidden input element
  const clearScreenPopupRef = useRef(null);
  const savePopupRef = useRef(null);
  const [gridIndex, setGridIndex] = useState(2); // Default grid configuration
  const [gridConfig, setGridConfig] = useState(gridConfigurations[gridIndex]);
  const gridConfigRef = useRef(gridConfig); // Create a ref for gridConfig
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef(null);
  const [volume, setVolume] = useState(0.8); // Default volume is 80%
  const [activeColorSlot, setActiveColorSlot] = useState(null); // Tracks the slot for which the palette is open
  const colorPaletteRef = useRef(null); // Ref for the color palette modal

  // Add this at the top of your component, along with other state variables
  const [selectedColor, setSelectedColor] = useState(null); // Track the color for which the modal is shown
  const [selectedSlot, setSelectedSlot] = useState(null); // Track the selected slot for the combined menu
  const [isEditMode, setIsEditMode] = useState(false); // Tracks if Edit Mode is active
  const [selectedLine, setSelectedLine] = useState(null); // Tracks the line being edited

  const [isDragging, setIsDragging] = useState(false); // Tracks if a line is being dragged
  const [draggedLine, setDraggedLine] = useState(null); // Tracks the line being dragged
  const [dragOffset, setDragOffset] = useState([0, 0]); // Tracks the offset between the pointer and the line
  const [originalLinePoints, setOriginalLinePoints] = useState(null); // Store the original points of the dragged line
  const [initialDragPoint, setInitialDragPoint] = useState(null); // Store the initial cursor position
  const [intersectedDotsState, setIntersectedDotsState] = useState({});
  const [wasDragged, setWasDragged] = useState(false); // Tracks if the pointer was dragged
  const clickPointRef = useRef(null); // Temporary global variable for clickPoint


  // State to hold instrument assignment for each color
  const [colorInstrumentMap, setColorInstrumentMap] = useState({
    color1: 'piano',
    color2: 'epiano',
    color3: 'marimba',
  });

  const [idInstrumentMap, setIdInstrumentMap] = useState({});
  const idInstrumentMapRef = useRef(idInstrumentMap);

  // Add a new state to manage the colors for each slot
  const [colorSlots, setColorSlots] = useState({
    color1: '#a9103a',
    color2: '#043293',
    color3: '#fead36',
    eraser: '#eae6e0'
  });

  const getSlotFromColor = (color) => {
    return Object.keys(colorSlots).find((slot) => colorSlots[slot] === color);
  };


  const colorPaletteGrid = [
    ['#fbd45b', '#fdc841', '#fdbe3d', '#fead36', '#ea8b28', '#8d5e19'],
    ['#ffa286', '#fe8965', '#ff6e3d', '#ff590f', '#f53e02', '#56281c'],
    ['#fb81a5', '#f95f87', '#f44068', '#ec274c', '#e10134', '#a9103a'],
    ['#c5819e', '#b76b8e', '#ac5a7c', '#963e64', '#710f44', '#411528'],
    ['#a682c9', '#976dc1', '#875cb3', '#7a4dab', '#604178', '#492e62'],
    ['#7693dd', '#5b78d1', '#4267c8', '#2c53bf', '#1241ab', '#043293'],
    ['#2ec5dd', '#00b8d7', '#03a3ce', '#0297c3', '#01697f', '#003b40'],
    ['#6ec77e', '#47bc65', '#1dac4c', '#1ea038', '#13792b', '#125f2a'],
    ['#cfcfcf', '#b9b9b9', '#9e9e9d', '#848484', '#565656', '#1c1c1c'],
  ];


  // Define the available instrument options
  // const instrumentOptions = ['piano', 'marimba', 'bass', 'guitar', 'epiano', 'floom', 'strings', 'synthflute', 'mute'];
  const instrumentOptions = ['piano', 'marimba', 'bass', 'guitar', 'epiano', 'synthflute', 'mute'];

  // Inside your component
  const colorInstrumentMapRef = useRef(colorInstrumentMap); // Create a ref for instrument mappings
  const loopRef = useRef(loop); // Create a ref for loop
  const playbackSpeedRef = useRef(playbackSpeed);
  const playStopButtonRef = useRef(null);

  // Define breakpoints
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });
  const isDesktop = useMediaQuery({ minWidth: 1025 });

  // Dynamically adjust styles based on the screen size
  const buttonSize = isMobile ? '40px' : isTablet ? '60px' : '80px';
  const gapSize = isMobile ? '10px' : isTablet ? '15px' : '20px';
  const sidebarWidth = isMobile ? '15vw' : '10vw';

  useEffect(() => {
    idInstrumentMapRef.current = idInstrumentMap; // Keep the ref in sync with the state
  }, [idInstrumentMap]);

  useEffect(() => {
    gridConfigRef.current = gridConfig; // Update the ref whenever gridConfig changes
  }, [gridConfig]);


  // Function to check if a dot intersects with the stroke outline
  const isDotIntersected = (dotX, dotY, strokeOutline) => {
    return pointInPolygon([dotX, dotY], strokeOutline);
  };

  const createSpatialHash = (gridConfig) => {
    const spatialHash = {};
    const cellSizeX = canvasDimensions.width / gridConfig.numDotsX;
    const cellSizeY = canvasDimensions.height / gridConfig.numDotsY;
  
    for (let i = 0; i < gridConfig.numDotsX; i++) {
      for (let j = 0; j < gridConfig.numDotsY; j++) {
        const dotX = cellSizeX * i + cellSizeX / 2;
        const dotY = cellSizeY * j + cellSizeY / 2;
        const cellKey = `${Math.floor(dotX / cellSizeX)},${Math.floor(dotY / cellSizeY)}`;
  
        if (!spatialHash[cellKey]) spatialHash[cellKey] = [];
        spatialHash[cellKey].push({ x: dotX, y: dotY, col: i, row: j });
      }
    }
  
    return spatialHash;
  };
  
  const calculateIntersections = (line, gridConfig, intersectedDots, spatialHash) => {
    const interpolatedPoints = [];
    for (let i = 0; i < line.points.length - 1; i++) {
      const start = line.points[i];
      const end = line.points[i + 1];
      const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
      const numInterpolatedPoints = Math.floor(distance / pointInterpolationDivisor);
      interpolatedPoints.push(...interpolatePoints(start, end, numInterpolatedPoints));
    }
  
    const allPoints = [...line.points, ...interpolatedPoints];
    const cellSizeX = canvasDimensions.width / gridConfig.numDotsX;
    const cellSizeY = canvasDimensions.height / gridConfig.numDotsY;
  
    allPoints.forEach((point) => {
      const cellX = Math.floor(point[0] / cellSizeX);
      const cellY = Math.floor(point[1] / cellSizeY);
      const cellKey = `${cellX},${cellY}`;
  
      if (spatialHash[cellKey]) {
        spatialHash[cellKey].forEach((dot) => {
          if (isPointNearDot(point[0], point[1], dot.x, dot.y, gridConfig.dotRadius, line.size)) {
            if (!intersectedDots[dot.col]) intersectedDots[dot.col] = {};
            intersectedDots[dot.col][dot.row] = {
              point: [dot.x, dot.y],
              color: line.color,
              highlightColor: line.highlightColor,
              size: line.size,
              lineId: line.lineId,
              instrument: line.instrument,
            };
          }
        });
      }
    });
  };

  const handleLongPress = (slot) => {
    setActiveColorSlot(slot); // Open the color palette for the selected slot
  };
  
  const closeColorPalette = () => {
    setActiveColorSlot(null); // Close the color palette
  };

  let pressTimer;

  const handleMouseDown = (slot) => {
    pressTimer = setTimeout(() => handleLongPress(slot), 500); // 500ms for long press
  };

  const handleMouseUp = () => {
    clearTimeout(pressTimer); // Clear the timer if the user releases early
  };

  const handleGridChange = (e) => {
    const newIndex = Number(e.target.value);
    setGridIndex(newIndex);
    setGridConfig(gridConfigurations[newIndex]);
  
    const { numDotsX, numDotsY, dotRadius } = gridConfigurations[newIndex];
  
    // Adjust the current column based on the new grid configuration
    setCurrentColumn((prevColumn) => {
      if (prevColumn >= numDotsX) {
        return 0; // Reset to the first column if out of range
      }
      return prevColumn;
    });
  
    const updatedIntersectedDots = {};
  
    // Create a spatial hash for the new grid
    const spatialHash = createSpatialHash(gridConfigurations[newIndex]);
  
    const updatedLines = lines.map((line) => {
      const newIntersections = {};
  
      // Interpolate points for the line
      const interpolatedPoints = [];
      for (let i = 0; i < line.points.length - 1; i++) {
        const start = line.points[i];
        const end = line.points[i + 1];
        const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
        const numInterpolatedPoints = Math.floor(distance / pointInterpolationDivisor); // Adjust interpolation density
        interpolatedPoints.push(...interpolatePoints(start, end, numInterpolatedPoints));
      }
  
      const allPoints = [...line.points, ...interpolatedPoints]; // Combine original and interpolated points
  
      // Recalculate intersections for the new grid using spatial hashing
      allPoints.forEach((point) => {
        const cellSizeX = canvasDimensions.width / numDotsX;
        const cellSizeY = canvasDimensions.height / numDotsY;
        const cellX = Math.floor(point[0] / cellSizeX);
        const cellY = Math.floor(point[1] / cellSizeY);
        const cellKey = `${cellX},${cellY}`;
  
        if (spatialHash[cellKey]) {
          spatialHash[cellKey].forEach((dot) => {
            if (isPointNearDot(point[0], point[1], dot.x, dot.y, dotRadius, line.size)) {
              if (!newIntersections[dot.col]) newIntersections[dot.col] = {};
              if (!updatedIntersectedDots[dot.col]) updatedIntersectedDots[dot.col] = {};
  
              newIntersections[dot.col][dot.row] = {
                point: [dot.x, dot.y],
                color: line.color,
                highlightColor: line.highlightColor,
                size: line.size,
                lineId: line.lineId,
              };
              updatedIntersectedDots[dot.col][dot.row] = {
                point: [dot.x, dot.y],
                color: line.color,
                highlightColor: line.highlightColor,
                size: line.size,
                lineId: line.lineId,
              };
            }
          });
        }
      });
  
      return { ...line, intersections: newIntersections };
    });
  
    setLines(updatedLines);
    intersectedDots.current = updatedIntersectedDots;
  };

  const handleSaveDrawing = () => {
    setIsSavePopupVisible(true);
  };

  const handleSave = async ({ saveJson, saveImage, saveAudio, audioLoops }) => {
    if (saveJson) {
      confirmSaveAsJson();
    }
    if (saveImage) {
      confirmSaveAsImage();
    }
    if (saveAudio) {
      await confirmSaveAsAudio(audioLoops);
    }

    setIsDownloading(false);
    setIsSavePopupVisible(false); // Hide the pop-up after saving
  };

  const confirmSaveDrawing = () => {
    // const dataToSave = { lines, sonificationPoints, colorInstrumentMap };
    const dataToSave = {
      // Drawing data
      lines,                    // All line objects with their intersections
      
      // Instrument mapping
      idInstrumentMap,          // CRITICAL - maps lineId to instrument
      
      // UI/Playback state
      colorInstrumentMap,       // Current color slot -> instrument mapping
      colorSlots,              // Custom colors for each slot
      currentScale,            // Musical scale (e.g., 'pentatonicMinor')
      gridIndex,               // Which grid config (0-5)
      bpm,                     // Tempo
      volume,                  // Master volume
    };

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);

    const fileData = {
      dataset: dataToSave,
      svg: svgString,
    };

    const jsonBlob = new Blob([JSON.stringify(fileData)], { type: "application/json" });
    const url = URL.createObjectURL(jsonBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "drawing.json";
    a.click();

    URL.revokeObjectURL(url);
    // setIsSavePopupVisible(false); // Hide the pop-up
  };

  // const cancelSaveDrawing = () => {
  //   setIsSavePopupVisible(false); // Hide the pop-up
  // };

  const confirmSaveAsJson = () => {
    // const dataToSave = { lines, sonificationPoints, colorInstrumentMap };
    const dataToSave = {
      // Drawing data
      lines,                    // All line objects with their intersections
      
      // Instrument mapping
      idInstrumentMap,          // CRITICAL - maps lineId to instrument
      
      // UI/Playback state
      colorInstrumentMap,       // Current color slot -> instrument mapping
      colorSlots,              // Custom colors for each slot
      currentScale,            // Musical scale (e.g., 'pentatonicMinor')
      gridIndex,               // Which grid config (0-5)
      bpm,                     // Tempo
      volume,                  // Master volume
    };

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);

    const fileData = {
      dataset: dataToSave,
      svg: svgString,
    };

    const jsonBlob = new Blob([JSON.stringify(fileData)], { type: "application/json" });
    const url = URL.createObjectURL(jsonBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "drawing.json";
    a.click();

    URL.revokeObjectURL(url);
    // setIsSavePopupVisible(false); // Hide the pop-up
  };

  const confirmSaveAsImage = async () => {
    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    // console.log("Serialized SVG String:", svgString);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const svgSize = svgElement.getBoundingClientRect();
    const scale = 3;
    canvas.width = svgSize.width * scale;
    canvas.height = svgSize.height * scale;

    // Scale the context to match
    ctx.scale(scale, scale);

    // Draw a white background
    ctx.fillStyle = '#eae6e1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Use Canvg to render the SVG onto the canvas
    const v = await Canvg.fromString(ctx, svgString, {
      ignoreDimensions: true,
      ignoreClear: true,
    });

    // Render the SVG onto the canvas
    await v.render();

    const imgURL = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = imgURL;
    a.download = "drawing.png";
    a.click();
  };

  const confirmSaveAsAudio = async (loops = 0) => {
    console.log(`Starting audio export with ${loops + 1} iteration(s)...`);

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const destination = audioContext.createMediaStreamDestination();
    const recorder = new MediaRecorder(destination.stream);
    const chunks = [];

    recorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'sonification.webm';
      a.click();

      URL.revokeObjectURL(url);
      console.log("Audio export completed.");
    };

    recorder.start();
    console.log("Recorder started.");

    // Play the sonification with the specified number of loops
    for (let iteration = 0; iteration <= loops; iteration++) {
      for (let column = firstColumn; column < gridConfigRef.current.numDotsX; column++) {
        if (intersectedDots.current[column]) {
          const playPromises = [];
          
          // Determine if this is an accent column
          const isAccentColumn = (column - firstColumn) % gridConfigRef.current.accent === 0;
          
          for (const row in intersectedDots.current[column]) {
            const { color, lineId } = intersectedDots.current[column][row];
            const instrument = idInstrumentMapRef.current[lineId];
            const mapRowToNote = getMapRowToNote();
            const note = mapRowToNote[row];

            playPromises.push(
              playSound(
                color,
                note,
                1,
                playbackSpeedRef.current,
                lineId,
                { [color]: instrument },
                isAccentColumn,
                audioContext,
                destination
              )
            );
          }
          await Promise.all(playPromises);
        }

        await new Promise(resolve =>
          setTimeout(resolve, playbackSpeedRef.current)
        );
      }
    }

    // Ensure all audio is played before stopping the recorder
    const totalDuration = playbackSpeedRef.current * (gridConfigRef.current.numDotsX - firstColumn) * (loops + 1);
    setTimeout(() => {
      recorder.stop();
      console.log("Recorder stopped.");
    }, totalDuration);
  };

  const cancelSaveDrawing = () => {
    setIsSavePopupVisible(false); // Hide the pop-up
  };

  const handleLoadDrawing = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonData = JSON.parse(event.target.result);

      if (jsonData.dataset) {
        const loadedData = jsonData.dataset;
        
        // Load drawing data
        const loadedLines = loadedData.lines || [];
        setLines(loadedLines);
        
        // Load instrument mappings
        const loadedIdInstrumentMap = loadedData.idInstrumentMap || {};
        setIdInstrumentMap(loadedIdInstrumentMap);
        
        const loadedColorInstrumentMap = loadedData.colorInstrumentMap || {
          color1: 'piano',
          color2: 'epiano',
          color3: 'marimba',
        };
        setColorInstrumentMap(loadedColorInstrumentMap);
        
        // Load UI/Playback state
        const loadedColorSlots = loadedData.colorSlots || {
          color1: '#a9103a',
          color2: '#043293',
          color3: '#fead36',
          eraser: '#eae6e0'
        };
        setColorSlots(loadedColorSlots);
        
        const loadedScale = loadedData.currentScale || 'pentatonicMinor';
        setCurrentScale(loadedScale);
        setScale(loadedScale); // Apply to global scale mapping
        
        const loadedGridIndex = loadedData.gridIndex !== undefined ? loadedData.gridIndex : 2;
        setGridIndex(loadedGridIndex);
        setGridConfig(gridConfigurations[loadedGridIndex]);
        
        const loadedBpm = loadedData.bpm || 250;
        setBpm(loadedBpm);
        
        const loadedVolume = loadedData.volume !== undefined ? loadedData.volume : 0.8;
        setVolume(loadedVolume);
        setMasterVolume(loadedVolume); // Apply to audio system

        // Rebuild intersectedDots to link sonification points for playback
        const updatedIntersectedDots = {};
        loadedLines.forEach((line) => {
          if (line.intersections) {
            Object.entries(line.intersections).forEach(([column, rows]) => {
              if (!updatedIntersectedDots[column]) updatedIntersectedDots[column] = {};
              Object.entries(rows).forEach(([row, intersectionData]) => {
                updatedIntersectedDots[column][row] = {
                  ...intersectionData,
                  color: line.color,              // Use the line's actual hex color
                  highlightColor: line.highlightColor || line.color  // Use the line's highlight color
                };
              });
            });
          }
        });

        // Update the intersectedDots reference
        intersectedDots.current = updatedIntersectedDots;
      }
    };

    reader.readAsText(file);
  };

  // Add a handler for the new button click
  const handleSettingsButtonClick = () => {
    setIsSettingsMenuOpen(true); // Open the custom pop-up
  };

  // Add a handler for closing the custom pop-up
  const handleCloseSettingsMenu = () => {
    setIsSettingsMenuOpen(false); // Close the custom pop-up
  };

  const handleClickOutside = (event) => {
    // Check if the click is outside the scale menu
    if (scaleMenuRef.current && !scaleMenuRef.current.contains(event.target)) {
      setIsScaleMenuOpen(false); // Close the scale menu
    }
  };

  const handleClickOutsideColorPalette = (event) => {
    if (colorPaletteRef.current && !colorPaletteRef.current.contains(event.target)) {
      closeColorPalette(); // Close the color palette if the click is outside
    }
  };

  const handleClickOutsideClearScreen = (event) => {
    if (clearScreenPopupRef.current && !clearScreenPopupRef.current.contains(event.target)) {
      setIsClearScreenPopupVisible(false);
    }
  };

  const handleClickOutsideSave = (event) => {
    if (savePopupRef.current && !savePopupRef.current.contains(event.target)) {
      setIsSavePopupVisible(false);
    }
  };

  const handleClearScreen = () => {
    setIsClearScreenPopupVisible(true);
  };

  const confirmClearScreen = () => {
    setLines([]); // Clear all lines
    setSonificationPoints([]); // Clear all sonification points
    intersectedDots.current = {}; // Clear intersection data
    setIsClearScreenPopupVisible(false); // Hide the pop-up
  };

  const cancelClearScreen = () => {
    setIsClearScreenPopupVisible(false); // Hide the pop-up
  };

  useEffect(() => {
    const loadSounds = async () => {
      await preloadSounds(); // Preload sounds
      setIsLoading(false);   // Hide pop-up after loading
    };
    loadSounds();
  }, []);

  useEffect(() => {
    if (isClearScreenPopupVisible) {
      document.addEventListener("mousedown", handleClickOutsideClearScreen);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideClearScreen);
    }

    return () => document.removeEventListener("mousedown", handleClickOutsideClearScreen);
  }, [isClearScreenPopupVisible]);

  useEffect(() => {
    if (isSavePopupVisible) {
      document.addEventListener("mousedown", handleClickOutsideSave);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideSave);
    }

    return () => document.removeEventListener("mousedown", handleClickOutsideSave);
  }, [isSavePopupVisible]);

  useEffect(() => {
    if (isScaleMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup the event listener on unmount
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isScaleMenuOpen]);

  useEffect(() => {
    if (activeColorSlot) {
      document.addEventListener("mousedown", handleClickOutsideColorPalette);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideColorPalette);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideColorPalette);
    };
  }, [activeColorSlot]);

  const handleClickOutsideInstrument = (event) => {
    if (
      instrumentMenuRef.current &&
      !instrumentMenuRef.current.contains(event.target)
    ) {
      closeInstrumentMenu(); // Close the instrument menu
    }
  };

  useEffect(() => {
    if (selectedSlot) { // changed selectedColor to selectedSlot - Renee
      document.addEventListener("mousedown", handleClickOutsideInstrument);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideInstrument);
    }

    return () =>
      document.removeEventListener("mousedown", handleClickOutsideInstrument);
  }, [selectedSlot]); // changed selectedColor to selectedSlot - Renee

  useEffect(() => {
    const root = document.documentElement;
  
    if (isEditMode) {
      root.style.setProperty('--canvasColor', '#b7aea2'); // Light gray for Edit Mode
    } else {
      root.style.setProperty('--canvasColor', '#eae6e1'); // Default canvas color
    }
  }, [isEditMode]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && playStopButtonRef.current) {
        event.preventDefault(); // Prevent default scrolling or other space-related actions
        playStopButtonRef.current.click(); // Simulate button click
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  useEffect(() => {
    colorInstrumentMapRef.current = colorInstrumentMap; // Update ref whenever state changes
  }, [colorInstrumentMap]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed; // Update ref whenever state changes
  }, [playbackSpeed]);

  // Update these refs whenever the state changes
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    const preventSelection = (e) => {
      e.preventDefault();
    };

    // Add event listeners to prevent selection
    window.addEventListener('selectstart', preventSelection);
    window.addEventListener('dragstart', preventSelection);

    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('selectstart', preventSelection);
      window.removeEventListener('dragstart', preventSelection);
    };
  }, []);

  const handleScaleChange = (selectedScale) => {
    setCurrentScale(selectedScale); // Update current scale for UI
    // setCurrentDirection(selectedScale)
    // console.log('Selected scale:', currentScale);
    setScale(selectedScale); // Update global scale
    setIsScaleMenuOpen(false); // Close the menu
  };

  const openInstrumentMenu = (slot) => {
    setSelectedSlot(slot); // Set the slot for which the menu should be shown
  };

  const updateInstrumentForColor = (instrument) => {
    setColorInstrumentMap((prevMap) => ({
      ...prevMap,
      [selectedSlot]: instrument, // Update the instrument for the selected slot
    }));
    // Don't close after selection - Renee
    // closeInstrumentMenu(); // Close the modal after selection
  };

  const updateColorForSlot = (slot, newColor) => {
    setColorSlots((prevSlots) => ({
      ...prevSlots,
      [slot]: newColor, // Update the color for the selected slot
    }));
  };


  const closeInstrumentMenu = () => {
    setSelectedSlot(null); // Clear the selected slot, hiding the modal
  };

  const toggleGrid = () => {
    setShowGrid((prevShowGrid) => !prevShowGrid);
    // console.log('Grid visibility toggled:', !showGrid);
  };

  useEffect(() => { }, [playbackSpeed]);

  // Helper function to check if two line segments intersect (used for eraser functionality)
  const doLineSegmentsIntersect = (p0, p1, p2, p3) => {
    // Validate that all points are defined
    if (!p0 || !p1 || !p2 || !p3) {
      return false;
    }

    const det = (p1[0] - p0[0]) * (p3[1] - p2[1]) - (p1[1] - p0[1]) * (p3[0] - p2[0]);
    if (det === 0) {
      return false; // Lines are parallel
    }
    const lambda = ((p3[1] - p2[1]) * (p3[0] - p0[0]) + (p2[0] - p3[0]) * (p3[1] - p0[1])) / det;
    const gamma = ((p0[1] - p1[1]) * (p3[0] - p0[0]) + (p1[0] - p0[0]) * (p3[1] - p0[1])) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  };

  // Interpolates points between start and end to generate smooth lines
  const interpolatePoints = (start, end, numPoints) => {
    // console.time('Interpolation');
    const points = [];
    for (let i = 1; i <= numPoints; i++) {
      const t = i / (numPoints + 1);
      const x = start[0] + (end[0] - start[0]) * t;
      const y = start[1] + (end[1] - start[1]) * t;
      // const pressure = start[2] + (end[2] - start[2]) * t;
      // points.push([x, y, pressure]);
      points.push([x, y]);
    }
    // console.timeEnd('Interpolation');
    return points;
  };

  const handleResize = () => {
    const container = document.querySelector('.canvas-container');
    if (!container) return;
    
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;

    // Skip if dimensions haven't actually changed
    if (newWidth === originalSvgSize.current.width && newHeight === originalSvgSize.current.height) {
      return;
    }

    // Calculate scale factors
    const scaleX = newWidth / originalSvgSize.current.width;
    const scaleY = newHeight / originalSvgSize.current.height;

    // Update each line's points and recalculate intersections
    const resizedLines = lines.map((line) => {
      const scaledPoints = line.points.map(([x, y]) => [x * scaleX, y * scaleY]);
      
      // Create a new line object with scaled points
      const scaledLine = {
        ...line,
        points: scaledPoints,
        intersections: {}, // Reset intersections, will be recalculated
      };
      
      return scaledLine;
    });

    // Recalculate all intersections with the grid
    const updatedIntersectedDots = {};
    const spatialHash = createSpatialHash(gridConfigRef.current);

    resizedLines.forEach((line) => {
      calculateIntersections(line, gridConfigRef.current, updatedIntersectedDots, spatialHash);
    });

    // Update lines and intersections
    setLines(resizedLines);
    intersectedDots.current = updatedIntersectedDots;
    setIntersectedDotsState({ ...updatedIntersectedDots });

    // Update the original size reference
    originalSvgSize.current = { width: newWidth, height: newHeight };
  };

  useEffect(() => {
    const resizeListener = () => handleResize();
    window.addEventListener('resize', resizeListener);

    return () => window.removeEventListener('resize', resizeListener);
  }, [lines, gridConfig]);

  // Handles the slider input for changing playback speed
  const handleSliderChange = (e) => {
    const value = Number(e.target.value);

    const playbackSpeedValue = 50 + value; // Adjusting the base to 200 ms
    setPlaybackSpeed(playbackSpeedValue); // Ensure playbackSpeed is updated correctly

    // console.log("Current playback speed:", playbackSpeedValue);
  };

  const getClosestPointOnSegment = (point, start, end) => {
    const [px, py] = point;
    const [x1, y1] = start;
    const [x2, y2] = end;
  
    const dx = x2 - x1;
    const dy = y2 - y1;
  
    if (dx === 0 && dy === 0) {
      // The segment is a single point
      return [x1, y1];
    }
  
    // Calculate the projection of the point onto the line segment
    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  
    if (t < 0) {
      // Closest point is the start of the segment
      return [x1, y1];
    } else if (t > 1) {
      // Closest point is the end of the segment
      return [x2, y2];
    } else {
      // Closest point is somewhere in the middle of the segment
      return [x1 + t * dx, y1 + t * dy];
    }
  };

  // Called when user starts drawing (pointer down)
  const handlePointerDown = (e) => {
    setWasDragged(false); // Reset the dragging flag
    e.target.setPointerCapture(e.pointerId);
    // const clickPoint = [e.pageX, e.pageY];
    const canvasRect = svgRef.current.getBoundingClientRect();
    // const clickPoint = [e.clientX - canvasRect.left, e.clientY - canvasRect.top];
    // const clickPoint = [e.pageX, e.pageY];

    const container = document.querySelector('.canvas-container');
    const containerRect = container.getBoundingClientRect();
    const clickPoint = [e.clientX - containerRect.left, e.clientY - containerRect.top];

    clickPointRef.current = clickPoint; // Store the clickPoint in the ref

    if (isEditMode) {
      // const clickedLine = lines.find((line) =>
      const clickedLine = [...lines].reverse().find((line) =>
        !line.isEraser && // Ignore eraser lines
        line.points.some((startPoint, index) => {
          if (index === line.points.length - 1) return false; // Skip the last point
          const endPoint = line.points[index + 1];
          return isPointNearLineSegment(
            clickPoint,
            startPoint,
            endPoint,
            line.size // Include the stroke width in the calculation
          );
        })
      );
  
      if (clickedLine) {
        // Find the closest point on the line to the click point
        let closestPoint = null;
        let minDistance = Infinity;
  
        clickedLine.points.forEach((startPoint, index) => {
          if (index === clickedLine.points.length - 1) return; // Skip the last point
          const endPoint = clickedLine.points[index + 1];
          const pointOnSegment = getClosestPointOnSegment(clickPoint, startPoint, endPoint);
          const distance = Math.hypot(pointOnSegment[0] - clickPoint[0], pointOnSegment[1] - clickPoint[1]);
  
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = pointOnSegment;
          }
        });
  
        setDraggedLine(clickedLine); // Set the clicked line as the dragged line
        setOriginalLinePoints(clickedLine.points); // Store the original points of the line
        setIsDragging(true); // Enable dragging
        setDragOffset([clickPoint[0] - closestPoint[0], clickPoint[1] - closestPoint[1]]); // Calculate the offset
        setInitialDragPoint(clickPoint); // Store the initial cursor position
      }
    }

    if (isEditMode) {
      return; // Block drawing when Edit Mode is active
    }

    if (isTrash) {
      setIsPointerDown(true);
      const { clientX, clientY } = e;
      // const canvasRect = svgRef.current.getBoundingClientRect();
      const x = clientX - canvasRect.left;
      const y = clientY - canvasRect.top;
      setTrashLinePoints([[x, y]]);

      // Eraser mode: Check if the click intersects with any line's rendered stroke area
      const updatedLines = lines.filter((line) => {
        const isIntersected = line.points.some((startPoint, index) => {
          if (index === line.points.length - 1) return false; // Skip the last point

          const endPoint = line.points[index + 1];
          return isPointNearLineSegment(
            clickPoint,
            startPoint,
            endPoint,
            line.size // Include the stroke width in the calculation
          );
        });

        if (isIntersected) {
          const lineId = line.lineId;

          // Add the erased line to the undo stack
          setUndoStack((prev) => [...prev, { lines, sonificationPoints }]);

          // Remove intersections from intersectedDots
          for (const column in intersectedDots.current) {
            for (const row in intersectedDots.current[column]) {
              if (intersectedDots.current[column][row].lineId === lineId) {
                delete intersectedDots.current[column][row];
              }
            }
          }

          // Stop associated sounds
          stopSoundsForLine(lineId);
        }

        return !isIntersected; // Keep non-erased lines
      });

      // Update lines and sonification points
      const remainingSonificationPoints = updatedLines.flatMap((line) => line.sonificationPoints);
      setLines(updatedLines);
      setSonificationPoints(remainingSonificationPoints);
      setRedoStack([]); // Clear redo stack after erasing
    } else {
      // Regular drawing mode
      setCurrentLine([clickPoint]);
      setSonificationPoints([clickPoint]); // Initialize sound-triggering points
    }
  };

  const handlePointerMove = (e) => {

    // Handle line dragging in Edit Mode
    if (isDragging && draggedLine && originalLinePoints && initialDragPoint) {
      setWasDragged(true); // Mark as dragged
      const canvasRect = svgRef.current.getBoundingClientRect();
      const currentPoint = [e.clientX - canvasRect.left, e.clientY - canvasRect.top];

      // Calculate the offset relative to the initial drag point
      const offsetX = currentPoint[0] - initialDragPoint[0];
      const offsetY = currentPoint[1] - initialDragPoint[1];

      // Update the position of the dragged line
      const updatedLines = lines.map((line) =>
        line.lineId === draggedLine.lineId
          ? {
              ...line,
              points: originalLinePoints.map(([x, y]) => [x + offsetX, y + offsetY]),
            }
          : line
      );

      setLines(updatedLines);

      // Recalculate intersections for the dragged line
      const updatedIntersectedDots = { ...intersectedDots.current };

      // Clear old intersections for the dragged line
      for (const column in updatedIntersectedDots) {
        for (const row in updatedIntersectedDots[column]) {
          if (updatedIntersectedDots[column][row].lineId === draggedLine.lineId) {
            delete updatedIntersectedDots[column][row];
          }
        }
      }

      // Recalculate intersections for the new position of the dragged line
      const spatialHash = createSpatialHash(gridConfig);
      const updatedDraggedLine = updatedLines.find((line) => line.lineId === draggedLine.lineId);
      calculateIntersections(updatedDraggedLine, gridConfig, updatedIntersectedDots, spatialHash);

      // Update the intersectedDots reference and trigger a re-render
      intersectedDots.current = updatedIntersectedDots;
      // setIntersectedDotsState({ ...updatedIntersectedDots });

      return; // Exit early to avoid processing other modes
    }

    if (isEditMode) {
      return; // Block all drawing-related logic when Edit Mode is active
    }

    if (e.buttons !== 1) return; // Only draw when mouse button is held down
    const container = document.querySelector('.canvas-container');
    const containerRect = container.getBoundingClientRect();
    const newPoint = [e.clientX - containerRect.left, e.clientY - containerRect.top, e.pressure];

    if (isTrash && isPointerDown) {
      const { clientX, clientY } = e;
      const canvasRect = svgRef.current.getBoundingClientRect();
      const x = clientX - canvasRect.left;
      const y = clientY - canvasRect.top;
      setTrashLinePoints((prevPoints) => [...prevPoints, [x, y]]);

      // Check for intersections with lines
      const updatedLines = lines.filter(line => {
        const isIntersected = line.points.some(([px, py]) => {
          return trashLinePoints.some(([tx, ty]) => {
            const distance = Math.sqrt((px - tx) ** 2 + (py - ty) ** 2);
            return distance < 2; // Adjust the threshold as needed
          });
        });

        if (isIntersected) {
          const lineId = line.lineId;

          // Add the erased line to the undo stack
          setUndoStack((prev) => [...prev, { lines, sonificationPoints }]);

          // Remove intersections from intersectedDots
          for (const column in intersectedDots.current) {
            for (const row in intersectedDots.current[column]) {
              if (intersectedDots.current[column][row].lineId === lineId) {
                delete intersectedDots.current[column][row];
              }
            }
          }

          // Stop associated sounds
          stopSoundsForLine(lineId);
        }

        return !isIntersected; // Keep non-erased lines
      });

      // Update lines and sonification points
      const remainingSonificationPoints = updatedLines.flatMap((line) => line.sonificationPoints);
      setLines(updatedLines);
      setSonificationPoints(remainingSonificationPoints);
      setRedoStack([]); // Clear redo stack after erasing
    } else if (isTrash) {
      // Eraser mode: remove sonification points that intersect with the eraser path
      setLines((prevLines) =>
        prevLines.map((line) => {
          const updatedSonificationPoints = line.sonificationPoints.filter((point) => {
            // Check if the current eraser point overlaps with this sonification point
            return !isPointNearDot(newPoint[0], newPoint[1], point[0], point[1], currentSize, line.size);
          });

          return {
            ...line,
            sonificationPoints: updatedSonificationPoints,
          };
        })
      );

      // Update the sonification points state for real-time feedback
      setSonificationPoints((prevPoints) =>
        prevPoints.filter((point) => {
          return !isPointNearDot(newPoint[0], newPoint[1], point[0], point[1], currentSize, currentSize);
        })
      );

      // Visually erase by drawing with the background color
      setCurrentLine((prevLine) => [...prevLine, newPoint]);
    } else {
      // Regular drawing mode
      setCurrentLine((prevLine) => [...prevLine, newPoint]);
      setSonificationPoints((prevPoints) => {
        // Interpolate points for smoother sonification
        const lastPoint = prevPoints.length > 0 ? prevPoints[prevPoints.length - 1] : newPoint;
        const distance = Math.hypot(newPoint[0] - lastPoint[0], newPoint[1] - lastPoint[1]);
        const numInterpolatedPoints = Math.floor(distance / pointInterpolationDivisor); // Adjust this value for more/less interpolation
        const interpolatedPoints = interpolatePoints(lastPoint, newPoint, numInterpolatedPoints);
        return [...prevPoints, ...interpolatedPoints, newPoint];
      });
    }
  };

  const handlePointerUp = () => {
    if (!wasDragged && isEditMode) {

      // Use the clickPoint stored in the ref
      const clickPoint = clickPointRef.current;

      if (!clickPoint) return; // Ensure clickPoint is defined

      // Check if the click intersects with any line
      // const clickedLine = lines.find((line) =>
      const clickedLine = [...lines].reverse().find((line) =>
        !line.isEraser && // Ignore eraser lines
        line.points.some((startPoint, index) => {
          if (index === line.points.length - 1) return false; // Skip the last point
          const endPoint = line.points[index + 1];
          return isPointNearLineSegment(
            clickPoint,
            startPoint,
            endPoint,
            line.size // Include the stroke width in the calculation
          );
        })
      );
  
      if (clickedLine) {
        setSelectedLine(clickedLine); // Set the clicked line as the selected line
      }
    }

    if (isDragging && draggedLine) {
      setIntersectedDotsState({ ...intersectedDots.current });
      // Reset dragging state
      setIsDragging(false);
      setDraggedLine(null);
      setOriginalLinePoints(null); // Clear the original points
    }

    if (isTrash) {
      //TEMPORARYTESTING TEMPORARYTESTING TEMPORARYTESTING TEMPORARYTESTING TEMPORARYTESTING
      setIsPointerDown(false);
      setTrashLinePoints([]); // Clear the trash line points
      //TEMPORARYTESTING TEMPORARYTESTING TEMPORARYTESTING TEMPORARYTESTING TEMPORARYTESTING

      // "Soft" eraser mode: Erase only sonification points locally without deleting entire lines
      setLines((prevLines) =>
        prevLines.map((line) => {
          const updatedSonificationPoints = line.sonificationPoints.filter((point) => {
            const isNearEraser = currentLine.some((eraserPoint) =>
              isPointNearDot(eraserPoint[0], eraserPoint[1], point[0], point[1], currentSize, line.size)
            );

            // If the point is near the eraser, clean up `intersectedDots`
            if (isNearEraser) {
              for (const col in intersectedDots.current) {
                for (const row in intersectedDots.current[col]) {
                  if (
                    intersectedDots.current[col][row].point === point &&
                    intersectedDots.current[col][row].lineId === line.lineId
                  ) {
                    delete intersectedDots.current[col][row];
                  }
                }
              }
            }

            return !isNearEraser; // Keep only points not erased
          });

          return {
            ...line,
            sonificationPoints: updatedSonificationPoints,
          };
        })
      );

      // Update global sonification points (for real-time playback accuracy)
      const remainingSonificationPoints = sonificationPoints.filter((point) => {
        return !currentLine.some((eraserPoint) =>
          isPointNearDot(eraserPoint[0], eraserPoint[1], point[0], point[1], currentSize, currentSize)
        );
      });

      setSonificationPoints(remainingSonificationPoints);
      setCurrentLine([]); // Clear the current drawing line
    } else {
      // Regular drawing mode
      const lineId = uuidv4(); // Generate a unique ID for this new line
      const highlightColor = colorSlots[currentColor];

      const newLine = {
        points: currentLine,
        color: colorSlots[currentColor],
        highlightColor: highlightColor,
        instrument: colorInstrumentMap[currentColor],
        size: currentSize,
        sonificationPoints: [],
        lineId, // Assign the unique ID to the line
        intersections: {}, // Initialize an object to store intersections
      };

      // Update idInstrumentMap with the new line's instrument
      setIdInstrumentMap((prevMap) => ({
        ...prevMap,
        [lineId]: colorInstrumentMap[currentColor],
      }));

      // Add intersections to both intersectedDots and newLine.intersections
      sonificationPoints.forEach((point) => {
        // sonificationPoints.forEach((point, pointIndex) => {
        for (let i = 0; i < numDotsX; i++) {
          for (let j = 0; j < numDotsY; j++) {

            const dotX = (canvasDimensions.width / gridConfig.numDotsX) * i + canvasDimensions.width / gridConfig.numDotsX / 2;
            const dotY = (canvasDimensions.height / gridConfig.numDotsY) * j + canvasDimensions.height / gridConfig.numDotsY / 2;

            // if (isPointNearDot(point[0], point[1], dotX, dotY, dotRadius, currentSize)) {
            if (isPointNearDot(point[0], point[1], dotX, dotY, gridConfig.dotRadius, currentSize)) {
              if (!intersectedDots.current[i]) intersectedDots.current[i] = {};
              if (!newLine.intersections[i]) newLine.intersections[i] = {};

              intersectedDots.current[i][j] = { point, color: currentColor, size: currentSize, lineId };
              newLine.intersections[i][j] = { point, color: currentColor, size: currentSize, lineId };
            }
          }
        }
      });

      const updatedIntersectedDots = { ...intersectedDots.current };

      const spatialHash = createSpatialHash(gridConfig);
      calculateIntersections(newLine, gridConfig, updatedIntersectedDots, spatialHash);

      // Update the intersectedDots reference and trigger a re-render
      // intersectedDots.current = updatedIntersectedDots;
      setIntersectedDotsState({ ...updatedIntersectedDots });

      // Save the new line and reset the current state
      setUndoStack([...undoStack, { lines, sonificationPoints }]);
      setLines((prevLines) => [...prevLines, newLine]);
      intersectedDots.current = updatedIntersectedDots; // IF NOT COMMENTED, THIS LINE WILL CAUSE THE LOTS OF INTERSECTIONS TO BE LOST // IF NOT COMMENTED, THIS LINE WILL CAUSE THE LOTS OF INTERSECTIONS TO BE LOST// IF NOT COMMENTED, THIS LINE WILL CAUSE THE LOTS OF INTERSECTIONS TO BE LOST// IF NOT COMMENTED, THIS LINE WILL CAUSE THE LOTS OF INTERSECTIONS TO BE LOST
      setRedoStack([]);
      setCurrentLine([]);
      setSonificationPoints([]);
    }
  };

  const handlePlay = async () => {
    // console.time('Sonification');
    if (isPlaying) return;

    setIsPlaying(true);
    playbackStopped.current = false;

    let column = currentColumn; // Start from the current column

    while (!playbackStopped.current) {
      if (column >= gridConfigRef.current.numDotsX) {
        // If the column exceeds the maximum, reset to the first column
        column = 0;

        // Stop playback if looping is disabled
        if (!loopRef.current) break;
      }

      setCurrentColumn(column); // Update the scanned column
      setScannedColumn(column);

      // Determine if the current column is a multiple of the accent
      const isAccentColumn = (column - firstColumn) % gridConfigRef.current.accent === 0;

      // Check the latest colorInstrumentMap and play sounds accordingly
      if (intersectedDots.current[column]) {
        const playPromises = [];
        for (const row in intersectedDots.current[column]) {
          const { color, lineId } = intersectedDots.current[column][row];
          // const { lineId } = intersectedDots.current[column][row];
          // const instrument = idInstrumentMap[lineId]; // Get the instrument from idInstrumentMap
          const instrument = idInstrumentMapRef.current[lineId]; // Use the ref to get the instrument
          // console.log("Instrument for lineId:", lineId, "is", instrument);
          const mapRowToNote = getMapRowToNote();
          const note = mapRowToNote[row];
      
          playPromises.push(
            playSound(
              color,
              note,
              1,
              playbackSpeedRef.current,
              lineId,
              { [color]: instrument }, // Pass the instrument for this line
              isAccentColumn
            )
          );
        }
        await Promise.all(playPromises);
      }

      // Dynamically adjust tempo using `playbackSpeedRef.current`
      await new Promise(resolve =>
        setTimeout(resolve, playbackSpeedRef.current)
      );

      column++; // Move to the next column
    }

    // Reset playback state after finishing
    setCurrentColumn(-1);
    setScannedColumn(-1);
    setIsPlaying(false);
    // console.timeEnd('Sonification');
  };

  const updateLineColor = (line, newColor) => {
    setLines((prevLines) =>
      prevLines.map((l) =>
        l.lineId === line.lineId ? { ...l, color: newColor, highlightColor: newColor } : l
      )
    );

    for (const column in intersectedDots.current) {
      for (const row in intersectedDotsState[column]) {
        if (intersectedDotsState[column][row].lineId === line.lineId) {
          intersectedDotsState[column][row].color = newColor; // Update the color
        }
      }
    }
  
    setSelectedLine(null); // Close the modal after updating
  };

  const updateLineInstrument = (line, newInstrument) => {
    setLines((prevLines) =>
      prevLines.map((l) =>
        l.lineId === line.lineId
          ? { ...l, instrument: newInstrument } // Update the instrument
          : l
      )
    );
  
    // Update the instrument map for the line
    setIdInstrumentMap((prevMap) => ({
      ...prevMap,
      [line.lineId]: newInstrument, // Update the instrument in the map
    }));
  
    setSelectedLine(null); // Close the modal after updating
  };

  // // Undo and redo logic for managing drawing history
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack.pop();

      // Add current state to redo stack before applying undo
      setRedoStack([{ lines, sonificationPoints }, ...redoStack]);

      // Set lines and sonification points to the previous state
      setLines(previousState.lines);
      setSonificationPoints(previousState.sonificationPoints);

      // Clear and rebuild intersection data based on the undone lines
      intersectedDots.current = {}; // Reset first to avoid data carryover

      previousState.lines.forEach(line => {
        if (!line.erased) {
          // If the line was not erased, restore its intersection points
          if (line.intersections) {
            Object.entries(line.intersections).forEach(([column, rows]) => {
              if (!intersectedDots.current[column]) intersectedDots.current[column] = {};
              Object.entries(rows).forEach(([row, intersectionData]) => {
                intersectedDots.current[column][row] = intersectionData;
              });
            });
          }
        }
      });
    }
  };

  // Updated redo functionality with intersection handling
  const handleRedo = () => {
    if (redoStack.length > 0) {
      // Retrieve the next state from redo stack
      const nextState = redoStack.shift();

      // Add the current state to the undo stack before applying redo
      setUndoStack([...undoStack, { lines, sonificationPoints }]);

      // Update lines and sonification points with the redone state
      setLines(nextState.lines);
      setSonificationPoints(nextState.sonificationPoints);

      // Clear and rebuild intersection data based on the redone lines
      intersectedDots.current = {}; // Reset to avoid overlapping data

      nextState.lines.forEach(line => {
        if (!line.erased) {
          // If the line is visible (not erased), re-add its intersection points
          if (line.intersections) {
            Object.entries(line.intersections).forEach(([column, rows]) => {
              if (!intersectedDots.current[column]) intersectedDots.current[column] = {};
              Object.entries(rows).forEach(([row, intersectionData]) => {
                intersectedDots.current[column][row] = intersectionData;
              });
            });
          }
        }
      });
    }
  };

  const ClearScreenPopup = ({ onConfirm, onCancel }) => (
    <div className="popup-overlay">
      <div className="popup-content" ref={clearScreenPopupRef}>
        <h2>Warning</h2>
        <p>Are you sure you want to clean the screen? The drawing cannot be recovered.</p>
        <div className="popup-buttons">
          <button onClick={onConfirm}>Yes</button>
          <button onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );

  const SavePopup = ({ onSave, onCancel }) => {
    const [saveJson, setSaveJson] = useState(true);
    const [saveImage, setSaveImage] = useState(true);
    const [saveAudio, setSaveAudio] = useState(true);
    const [audioLoops, setAudioLoops] = useState(0);

    const handleSave = () => {
      onSave({ saveJson, saveImage, saveAudio, audioLoops });
    };

    return (
      <div className="popup-overlay">
        <div className="popup-content" ref={savePopupRef}>
          <h2>Save Drawing</h2>
          <p>Select the formats you want to save:</p>
          <div className="popup-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={saveJson}
                onChange={(e) => setSaveJson(e.target.checked)}
              />
              Save as JSON
            </label>
            <label>
              <input
                type="checkbox"
                checked={saveImage}
                onChange={(e) => setSaveImage(e.target.checked)}
              />
              Save as Image
            </label>
            <label>
              <input
                type="checkbox"
                checked={saveAudio}
                onChange={(e) => setSaveAudio(e.target.checked)}
              />
              Save as Audio
            </label>
            {saveAudio && (
              <div style={{ marginLeft: '24px', marginTop: '8px' }}>
                <label style={{ fontSize: '0.9em', color: '#666' }}>
                  Loops: {audioLoops}
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={audioLoops}
                    onChange={(e) => setAudioLoops(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
              </div>
            )}
          </div>
          <div className="popup-buttons">
            <button onClick={handleSave}>Download</button>
            <button onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const allStrokes = lines.map((line, index) => {
    const strokeOptions = { ...options, size: line.size };
    return (
      <path
        key={index}
        d={getSvgPathFromStroke(getStroke(line.points, strokeOptions))}
        fill={line.color}
      />
    );
  });

  // Generates the stroke for the current line being drawn
  const currentStroke = getSvgPathFromStroke(getStroke(currentLine, { ...options, size: currentSize }));
  <path d={currentStroke} fill={colorSlots[currentColor]} /> // Update here

  return (
    <div className="main-container">
      <div className="controls-container">
        <div className="play-group">
          <button
            ref={playStopButtonRef} // Add a ref here
            className={`play-stop-button ${isPlaying ? 'stop-mode' : 'play-mode'}`}
            onClick={() => {
              if (isPlaying) {
                playbackStopped.current = true;
              } else {
                handlePlay();
              }
            }}
          >
            <img
              src={isPlaying ? StopIcon : PlayIcon}
              alt={isPlaying ? "Stop" : "Play"}
              className={`icon ${isPlaying ? "iconStop" : "iconPlay"}`}
            />
          </button>
        </div>

        <div className="color-group">
          {Object.keys(colorInstrumentMap).map((slot, index) => (
            <div key={index} className="color-instrument-pair">
              {/* Color button */}
              <button
                className={`color-button ${currentColor === slot ? 'active' : ''}`}
                // style={{ backgroundColor: colorSlots[slot], position: 'relative' }} // Add relative positioning
                // style={{ backgroundColor: colorSlots[slot], borderColor: colorSlots[slot] }}
                style={{ borderColor: colorSlots[slot], border: `12px solid ${colorSlots[slot]}` }}
                onMouseDown={() => handleMouseDown(slot)} // Detect long press
                onMouseUp={handleMouseUp} // Clear timer on release
                onMouseLeave={handleMouseUp} // Clear timer if the mouse leaves the button
                onClick={() => {
                  setCurrentColor(slot); // Set the selected slot
                  setIsEraser(false);    // Deactivate eraser
                  setIsTrash(false);     // Deactivate trash
                }}
              >
                {/* Instrument icon overlay */}
                <img
                  src={instrumentIcons[colorInstrumentMap[slot]]}
                  alt={colorInstrumentMap[slot]}
                  className="color-button-instrument-icon"
                />
              </button>
              {/* Instrument button */}
              <button
                className="instrument-select-button"
                onClick={() => openInstrumentMenu(slot)}
              >
                <img src={GearIcon} alt="Settings Button" className="iconGear" />
              </button>
            </div>
          ))}
        </div>
{/* 
        <div className="edit-container">
          <button
            className={`edit-button ${isEditMode ? 'active' : ''}`}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <img src={EditIcon} alt="Edit" className="iconEdit" />
          </button>
        </div> */}


        {/* Center the Eraser button in its own container */}
        <div className="eraser-container">
          {/* <button
            className={`eraser-button ${isEraser ? 'active' : ''}`}
            // onClick={() => setIsEraser(!isEraser)}
            onClick={() => {
              if (isEraser) {
                // If eraser is already on, turn it off and restore the previous color
                setCurrentColor(previousColor);
                setIsTrash(false);
              } else {
                // If eraser is off, save the current color and set to eraser color
                setPreviousColor(currentColor);
                // setCurrentColor(ERASER_COLOR);
                setCurrentColor('eraser');
                setIsTrash(false);
              }
              setIsEraser(!isEraser); // Toggle the eraser mode
            }}
          >
            <img src={EraseIcon} alt="Eraser" className="iconEraser" />
          </button> */}
          <button
            className={`edit-button ${isEditMode ? 'active' : ''}`}
            onClick={() => setIsEditMode(!isEditMode)} // Toggle Edit Mode
          >
            <img src={EditIcon} alt="Edit" className="iconEdit" />
          </button>

          <button
            className={`trash-button ${isTrash ? 'active' : ''}`}
            // onClick={() => setIsTrash(!isTrash)}
            onClick={() => {
              if (isTrash) {
                // If eraser is already on, turn it off and restore the previous color
                setCurrentColor(previousColor);
                setIsEraser(false);
              } else {
                // If eraser is off, save the current color and set to eraser color
                setPreviousColor(currentColor);
                // setCurrentColor(ERASER_COLOR);
                setCurrentColor('eraser');
                setIsEraser(false);
              }
              setIsTrash(!isTrash); // Toggle the eraser mode
            }}
          >
            <img src={TrashIcon} alt="Trash" className="iconTrash" />
          </button>
        </div>

        {/* Brush size slider */}
        {/* Playback Speed Slider */}
        <div className="vertical-sliders-1">
          {/* <div className="brush-size-group">
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={currentSize}
              onChange={(e) => setCurrentSize(Number(e.target.value))}
            />
          </div> */}
          <div className="volume-slider-group">
            {/* <label htmlFor="grid-slider">Grid Configuration</label> */}
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                setVolume(newVolume); // Update the state
                setMasterVolume(newVolume); // Update the global volume
              }}
            />
          </div>
          <div className="slider-group">
            <input
              id="bpm"
              type="range"
              min="60" // Slowest tempo
              max="400" // Fastest tempo
              step="5" // Increment for each slider step
              value={bpm}
              onChange={(e) => {
                const bpmValue = Number(e.target.value); // Get BPM from the slider
                setBpm(bpmValue); // Set BPM in state
                const playbackSpeedValue = Math.round(60000 / bpmValue); // Convert BPM to delay in ms
                setPlaybackSpeed(playbackSpeedValue); // Update playback speed
              }}
            />
          </div>
        </div>

        <div className="vertical-sliders-2">
          <div className="grid-slider-group">
            {/* <label htmlFor="grid-slider">Grid Configuration</label> */}
            <input
              id="grid-slider"
              type="range"
              min="0"
              max={gridConfigurations.length - 1}
              step="1"
              value={gridIndex}
              onChange={handleGridChange}
            />
          </div>
          <div className="brush-size-group">
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={currentSize}
              onChange={(e) => setCurrentSize(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Loop & Scale Control */}
        <div className="loop-scale-group">
          <button
            className={`loop-button ${loop ? 'active' : 'inactive'}`}
            onClick={() => setLoop(!loop)}
          >
            <img
              src={loop ? LoopIcon : NoLoopIcon}
              alt={loop ? "Loop" : "noLoop"}
              className={loop ? "iconLoop" : "noLoop"}
            />
          </button>
          <button
            className="scale-button"
            onClick={() => setIsScaleMenuOpen(true)} // Open the pop-up
          >
            <img
              src={scaleIcons[currentScale]}
              alt={`${currentScale} icon`}
              className="scale-icon"
            />
          </button>
        </div>

        {/* Undo and Redo Buttons */}
        <div className="steps-group">
          <button className="undo" onClick={handleUndo}>
            <img src={UndoIcon} alt="Undo" className="iconDo" />
          </button>
          <button className="redo" onClick={handleRedo}>
            <img src={RedoIcon} alt="Redo" className="iconDo" />
          </button>
        </div>

        {/* Toggle Grid Visibility Button */}
        <div className="grid-group">
          <button className="grid-button" onClick={toggleGrid}>
            <img src={GridIcon} alt="Grid Icon" className="iconGrid" />
          </button>

          <button className="clean-button" onClick={handleClearScreen}>
            <img src={CleanIcon} alt="Clean Icon" className="iconClean" />
          </button>

        </div>

        <div className="load-save-group">
          <button className="save-button" onClick={handleSaveDrawing}>
            <img src={downloadIcon} alt="Download Icon" className="iconDown" />
          </button>
          <button className="load-button" onClick={() => loadInputRef.click()}>
            <img src={uploadIcon} alt="Upload Icon" className="iconUp" />
          </button>
        </div>

        {/* Pop-up for clearing the screen */}
        {isClearScreenPopupVisible && (
          <ClearScreenPopup onConfirm={confirmClearScreen} onCancel={cancelClearScreen} />
        )}

        {/* Hidden file input for loading */}
        <input
          type="file"
          accept=".json"
          onChange={handleLoadDrawing}
          style={{ display: "none" }} // Hide the input, trigger with a button
          ref={(input) => (loadInputRef = input)} // Assign the input to the ref
        />

        {/* Save Pop-up */}
        {isSavePopupVisible && (
          <SavePopup onSave={handleSave} onCancel={cancelSaveDrawing} />
        )}

        {/* Your other UI elements */}
        <svg ref={svgRef} /* other attributes */>
          {/* SVG content */}
        </svg>
      </div>

      <div 
        // className="canvas-container">
        className={`canvas-container ${isEditMode ? 'edit-mode-active' : ''}`}
        // style={{
        //   backgroundColor: isEditMode ? '#f0f0f0' : '#ffffff', // Change background color dynamically
        // }}
        >
        {/* Grid Canvas Component */}
        <GridCanvas
         showGrid={showGrid}
         scannedColumn={scannedColumn}
         intersectedDots={intersectedDots.current}
        //  intersectedDots={intersectedDotsState} // Use the state instead of the ref
         gridConfig={gridConfig}
         colorSlots={colorSlots}
        />

        {/* SVG Drawing Area */}
        <svg
          ref={svgRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none', width: '100%', height: '100%' }}
        >

          {isTrash && trashLinePoints.length > 0 && (
            <path
              d={getSvgPathFromStroke(trashLinePoints)}
              stroke='#eae6e1'
              strokeWidth={5}
              fill="none"
            />
          )}

          {allStrokes}
          {currentLine.length > 0 && <path d={currentStroke} fill={colorSlots[currentColor]} />}
        </svg>
      </div>

      {isSettingsMenuOpen && (
      <div ref={settingsMenuRef} className="settings-selection-modal">
        <button
          onClick={handleCloseSettingsMenu} // Close the pop-up
          className="close-modal-button top-left"
        >
          <img src={quitIcon} alt="Close" className="iconQuit" />
        </button>
        <div className="settings-options-grid">
          <div className="settings-option">
            <button className="clean-button" onClick={handleClearScreen}>
              <img src={CleanIcon} alt="Clean Icon" className="iconClean" />
            </button>
            <span className="settings-label">Clean Canvas</span>
          </div>
        </div>
      </div>
      )}

      {/* Scale Selection Modal */}
      {isScaleMenuOpen && (
        <div ref={scaleMenuRef} className="scale-selection-modal">
          <button
            onClick={() => setIsScaleMenuOpen(false)}
            className="close-modal-button top-left"
          >
            <img src={quitIcon} alt="Close" className="iconQuit" />
          </button>
          <div className="scale-options-grid">
            {Object.keys(scaleIcons).map((scale, index) => (
              <div key={index} className="scale-option-cell">
                <button
                  className="scale-option-button"
                  onClick={() => handleScaleChange(scale)}
                >
                  <img
                    src={scaleIcons[scale]}
                    alt={`${scale} icon`}
                    className="scale-option-icon"
                  />
                </button>
                <span className="scale-label">{customScaleNames[scale]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSlot && (
        <div ref={instrumentMenuRef} className="combined-selection-modal">
          <button onClick={closeInstrumentMenu} className="close-modal-button top-left">
            <img src={quitIcon} alt="Close" className="iconQuit" />
          </button>

          <div className="color-options">
            {colorPaletteGrid.map((row, rowIndex) =>
              row.map((color, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  style={{ backgroundColor: color }}
                  // style={{ borderColor: color }}
                  className="color-option"
                  onClick={() => {
                    updateColorForSlot(selectedSlot, color); 
                  }}
                />
              ))
            )}
          </div>


          <div className="instrument-options">
            {instrumentOptions.map((instrument, index) => (
              <div key={index} className="instrument-option-cell">
                <button
                  onClick={() => updateInstrumentForColor(instrument)}
                  className="instrument-option-button"
                >
                  <img
                    src={instrumentIcons[instrument]}
                    alt={instrument}
                    className="instrument-icon"
                  />
                </button>
                <span className="instrument-label">
                  {customInstrumentNames[instrument]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedLine && (
        <div ref={instrumentMenuRef} className="combined-selection-modal">
          <button onClick={() => setSelectedLine(null)} className="close-modal-button top-left">
            <img src={quitIcon} alt="Close" className="iconQuit" />
          </button>
          {/* Color Grid on the Left */}
          <div className="color-options">
            {colorPaletteGrid.map((row, rowIndex) =>
              row.map((color, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  style={{ backgroundColor: color }}
                  // style={{ borderColor: color }}
                  className="color-option"
                  onClick={() => {
                    updateLineColor(selectedLine, color); // Update the line's color
                  }}
                />
              ))
            )}
          </div>

          {/* Instrument Grid on the Right */}
          <div className="instrument-options">
            {instrumentOptions.map((instrument, index) => (
              <div key={index} className="instrument-option-cell">
                <button
                  onClick={() => updateLineInstrument(selectedLine, instrument)} // Update the line's instrument
                  className="instrument-option-button"
                >
                  <img
                    src={instrumentIcons[instrument]}
                    alt={instrument}
                    className="instrument-icon"
                  />
                </button>
                <span className="instrument-label">
                  {customInstrumentNames[instrument]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}



      {isLoading && (
        <div className="loading-popup">
          <div className="loading-content">
            <h1>SoundInk</h1>
            <p>Please wait while the sounds are being loaded.</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      )}

      {isDownloading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <p>Downloading...</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      )}

      {/* Clear Screen Pop-up */}
      {isClearScreenPopupVisible && (
        <ClearScreenPopup onConfirm={confirmClearScreen} onCancel={cancelClearScreen} />
      )}

      {/* Save Pop-up */}
      {isSavePopupVisible && (
        <SavePopup onSave={handleSave} onCancel={cancelSaveDrawing} />
      )}

    </div>
  );
}

export default CanvasComponent;