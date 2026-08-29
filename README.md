# SoundInk

An interactive **music and visual-art therapy web application** that transforms drawing and spatial interaction into sound, enabling users to create music through an accessible visual interface.

SoundInk was developed as part of the University of Michigan's **Explore Computer Science Research (ECSR)** program under Professor Anıl Çamcı. The project explores alternative forms of musical interaction, with a focus on making creative musical experiences more accessible and engaging for therapeutic settings.

## Overview

Traditional digital music tools often assume prior knowledge of instruments, notation, or music-production software. SoundInk takes a different approach: users interact with a visual canvas, and their drawings and gestures are translated into musical output.

The application combines **visual art, interaction design, and browser-based audio synthesis** to create an environment where users can experiment with sound through drawing rather than through a conventional musical interface.

SoundInk was designed with music-therapy applications in mind, particularly as an accessible creative tool for children and other users who may benefit from intuitive, multimodal forms of musical expression.

## Features

### Interactive Drawing Canvas

Users can draw directly onto the application canvas using a freeform interaction system. Drawing data is captured and processed so that visual gestures can be mapped to musical behavior.

The drawing interface supports:

- Freehand drawing
- Brush interactions
- Erasing and clearing
- Undo and redo
- Visual grid overlays
- Interactive canvas controls

### Drawing-to-Sound Mapping

Visual input is translated into musical output using configurable sound mappings.

Properties of a user's drawing and its position on the canvas can influence the resulting sound, allowing visual gestures to function as a form of musical input.

### Musical Controls

SoundInk includes controls for configuring musical playback, including:

- Tempo / BPM
- Playback speed
- Musical scale selection
- Instrument and sound mappings
- Volume
- Looping and playback controls

These controls allow users to experiment with how the same visual composition can produce different musical results.

### Browser-Based Audio

The application uses **Tone.js** for interactive audio synthesis and playback directly in the browser.

This allows musical feedback to respond dynamically to user interactions without requiring external music-production software.

### Visual & Spatial Interaction

SoundInk incorporates several browser graphics and interaction libraries to support its interface:

- **p5.js** for creative coding and canvas-based interaction
- **Three.js** for graphics and visual components
- **perfect-freehand** for natural freehand drawing behavior
- Custom interaction logic for mapping visual input to musical output

### Audio Export

The application includes functionality for generating and exporting audio, allowing users to preserve musical output created through their interactions.

## Tech Stack

### Frontend

- **React**
- **JavaScript**
- **HTML/CSS**
- **Vite**

### Audio & Music

- **Tone.js**
- **lamejs**

### Graphics & Interaction

- **p5.js**
- **Three.js**
- **perfect-freehand**
- **tldraw**
- **canvg**
- **point-in-polygon**

## Architecture

The application is organized around several major systems:

```text
soundink-react/
├── src/
│   ├── components/
│   │   ├── CanvasComponent/
│   │   │   ├── drawing.jsx
│   │   │   ├── interaction.jsx
│   │   │   ├── soundMappings.jsx
│   │   │   ├── soundPlayer.jsx
│   │   │   ├── scaleSelector.jsx
│   │   │   ├── bpmContext.jsx
│   │   │   ├── playbackSpeedContext.jsx
│   │   │   ├── sidebar.jsx
│   │   │   └── interface.jsx
│   │   │
│   │   └── GridComponent/
│   │       ├── grid.jsx
│   │       ├── gridConfig.js
│   │       └── P5GridCanvas.jsx
│   │
│   ├── App.jsx
│   └── main.jsx
│
└── package.json
