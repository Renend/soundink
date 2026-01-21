// Importing icons
import {
    PlayIcon,
    StopIcon,
    UndoIcon,
    RedoIcon,
    BrushIcon,
    EraseIcon,
    LoopIcon,
    TempoIcon,
    GridIcon,
    GearIcon,
    TrashIcon,
    quitIcon,
    NoLoopIcon,
    downloadIcon,
    uploadIcon,
    CleanIcon,
    muteIcon,
    bassIcon,
    guitarIcon,
    marimbaIcon,
    pianoIcon,
    violinIcon,
    fluteIcon,
    glassIcon,
    synthIcon,
    majorIcon,
    harmonicMinorIcon,
    melodicMinorIcon,
    minorPentatonicIcon,
    majorPentatonicIcon,
    instrumentIcons,
    scaleIcons,
    customInstrumentNames,
    customScaleNames,
    PaletteIcon,
    EditIcon
  } from './icons';

// Importing constants and helper functions from drawing
import {
colors,
sizes,
MAX_DELAY,
ERASER_COLOR,
options,
isPointNearDot,
isPointNearLineSegment,
getStrokeWidthFromOptions,
calculateLocalWidth
} from './drawing';

// Importing context
import { useBpm } from './bpmContext'; // changed - Renee
import { usePlaybackSpeed } from './playbackSpeedContext';

// Importing other utilities
import { useMediaQuery } from 'react-responsive';
import { v4 as uuidv4 } from 'uuid';
import { stopSoundsForLine, preloadSounds } from './soundPlayer';
import { getSvgPathFromStroke } from './utils'; // Utility function to convert stroke to SVG path
import { getStroke } from 'perfect-freehand'; // Used to calculate stroke paths for drawing
import { getMapRowToNote, setScale } from './soundMappings'; // Function to map rows to musical notes
import { playSound, setMasterVolume } from './soundPlayer'; // Function to play the sound associated with each note/color
import GridCanvas from '../GridComponent/grid';
import { canvasDimensions } from '../GridComponent/grid';
import { firstColumn, fistColumnScan, numDotsX, numDotsY, dotRadius, gridConfigurations } from '../GridComponent/gridConfig';

export {
    PlayIcon,
    StopIcon,
    UndoIcon,
    RedoIcon,
    BrushIcon,
    EraseIcon,
    LoopIcon,
    TempoIcon,
    GridIcon,
    TrashIcon,
    quitIcon,
    NoLoopIcon,
    downloadIcon,
    uploadIcon,
    CleanIcon,
    muteIcon,
    bassIcon,
    guitarIcon,
    marimbaIcon,
    pianoIcon,
    violinIcon,
    fluteIcon,
    glassIcon,
    synthIcon,
    majorIcon,
    harmonicMinorIcon,
    melodicMinorIcon,
    minorPentatonicIcon,
    majorPentatonicIcon,
    instrumentIcons,
    scaleIcons,
    customInstrumentNames,
    customScaleNames,
    colors,
    sizes,
    MAX_DELAY,
    ERASER_COLOR,
    options,
    isPointNearDot,
    isPointNearLineSegment,
    useBpm,
    usePlaybackSpeed,
    useMediaQuery,
    uuidv4,
    stopSoundsForLine,
    preloadSounds,
    getSvgPathFromStroke,
    getStroke,
    getMapRowToNote,
    setScale,
    playSound,
    GridCanvas,
    GearIcon,
    firstColumn,
    fistColumnScan,
    numDotsX,
    numDotsY,
    dotRadius,
    canvasDimensions,
    gridConfigurations,
    setMasterVolume,
    getStrokeWidthFromOptions,
    calculateLocalWidth,
    PaletteIcon,
    EditIcon
}