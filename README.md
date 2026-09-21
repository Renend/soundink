# SoundInk

An interactive **music and visual-art therapy web application** that transforms drawing and spatial interaction into sound, allowing users to explore musical creativity through an intuitive visual interface.

SoundInk explores the intersection of **human-computer interaction, music technology, creative computing, and accessible interface design**. Rather than requiring users to play a traditional instrument or understand musical notation, the application provides a drawing-based environment in which visual interactions can be translated into musical output.

## Overview

Traditional digital music tools often assume familiarity with instruments, musical notation, or music-production software. SoundInk explores a different approach: using **drawing as an interface for musical expression**.

Users interact with a visual canvas, while the application processes those interactions and maps them to sound. Musical parameters such as tempo, scale, playback speed, and sound mappings can be adjusted to create different relationships between a visual composition and its resulting audio.

The project was developed with **music and art therapy applications** in mind, investigating how interactive technology can provide alternative and engaging ways to participate in musical creativity.

## Features

### Interactive Drawing Canvas

SoundInk provides a freeform canvas where users can create and manipulate visual drawings.

The drawing system supports functionality including:

- Freehand drawing
- Natural stroke rendering
- Erasing and clearing
- Undo and redo
- Grid-based visual organization
- Interactive canvas controls

Drawing information can then be interpreted by the application's musical systems.

### Drawing-to-Sound Mapping

SoundInk connects visual interaction with musical output through configurable sound mappings.

Properties of a user's interactions with the canvas can be interpreted musically, allowing visual gestures and spatial information to act as an alternative form of musical input.

This creates a multimodal experience in which users can experiment with the relationship between **visual composition and sound**.

### Musical Controls

The application provides controls for modifying how visual input is interpreted and played.

These include functionality for:

- Tempo / BPM
- Playback speed
- Musical scale selection
- Sound mappings
- Volume
- Playback
- Looping

Changing these parameters allows users to experiment with different musical interpretations of their visual work.

### Browser-Based Audio

SoundInk uses **Tone.js** to generate and control audio directly within the browser.

This allows the application to provide interactive musical feedback without requiring external digital audio workstation software or specialized music-production tools.

### Visual & Spatial Interaction

The application combines several graphics and interaction technologies to support its visual interface.

These include:

- **p5.js** for creative coding and canvas-based interaction
- **Three.js** for browser-based graphics
- **perfect-freehand** for natural freehand stroke behavior
- **tldraw** for interactive drawing functionality
- Custom interaction logic connecting visual input with musical behavior

### Audio Export

SoundInk includes functionality for generating and exporting audio, allowing musical output produced through the application to be preserved outside the interactive session.

## Technical Approach

SoundInk is implemented as a **React application** with separate systems for drawing, interaction, musical configuration, and audio playback.

At a high level, the application follows the interaction pipeline:

```text
User Drawing / Interaction
          ↓
   Canvas Processing
          ↓
 Spatial / Visual Data
          ↓
  Sound Mapping Logic
          ↓
 Musical Configuration
  (Scale, BPM, Speed)
          ↓
   Tone.js Playback
          ↓
      Audio Output
```

This separation allows visual interactions and musical behavior to be developed independently while still responding to shared application state.

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

The application is organized around several major systems for canvas interaction, drawing, audio playback, and musical configuration.

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
```

### Canvas System

The canvas components manage drawing behavior and user interaction.

This part of the application handles the visual environment in which users create and manipulate drawings, as well as the interaction data needed by other parts of SoundInk.

### Sound Mapping

The sound-mapping system connects visual information from the canvas with musical behavior.

This provides the bridge between SoundInk's visual interface and its audio system, allowing drawing-based interactions to influence generated sound.

### Audio System

Sound-generation and playback logic is handled separately from the drawing interface.

**Tone.js** provides browser-based audio functionality, while dedicated components manage playback and the interpretation of musical parameters.

### Musical Configuration

Users can configure aspects of the generated music such as scale, BPM, and playback speed.

Shared musical state is managed using **React Context**, allowing multiple components to respond consistently when a user modifies playback settings.

### Grid System

SoundInk also contains a dedicated grid system built using p5.js.

The grid provides additional spatial structure for the application's visual and musical interactions.

## Research Context

SoundInk was developed through the **Explore Computer Science Research (ECSR)** program at the **University of Michigan** under **Professor Anıl Çamcı**.

The project investigates topics at the intersection of:

- Human-computer interaction
- Music technology
- Creative computing
- Accessible interface design
- Music and art therapy

SoundInk was developed with therapeutic applications in mind, exploring how alternative interfaces can provide new ways for users to participate in musical creativity through visual and spatial interaction.

## My Contributions

As a developer on SoundInk, I contributed to the design and implementation of the application's interactive music-and-art interface.

My work included developing and integrating frontend functionality using **React and JavaScript**, working with interactive canvas behavior, and connecting visual user interactions with the application's musical systems.

## Running the Application

The primary application is located in:

```bash
soundink-react/
```

Navigate into the application directory:

```bash
cd soundink-react
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide a local development URL, typically:

```text
http://localhost:5173/
```

Open the URL in a browser to use the application.

## Building for Production

Create a production build with:

```bash
npm run build
```

Preview the production build locally with:

```bash
npm run preview
```

## Future Development

Potential directions for continued development include:

- Expanding visual-to-musical mappings
- Adding additional instruments and sound palettes
- Improving accessibility for different interaction needs
- Supporting additional forms of gesture-based musical input
- Conducting further usability testing in therapeutic settings
- Refining responsive behavior across devices
- Expanding save and export functionality

---

## Original Project Setup Documentation

The original development and setup documentation is preserved below.

# MusicArtTherapyApp
Music / Art Therapy Web Application



To test the application:

# Starting the project:

1. Using `Vite` as the build tool.
2. To make the NPM create a `package.json` that will contain the minimal information needed to run a `Node.js` project, run:
    
    ```bash
    npm init -y
    ```
    
3. run:
    
    ```bash
    npm install vite
    ```
    
4. You should notice three things:
    1. **`node_modules/`** → this folder contains the project dependencies and should never be modified
    2. **`package.json`** → contains an array of dependencies written in `dependencies`
    3. **`package-lock.json`** → contains information about the dependencies and exact versions that have been installed in your project without tolerance
5. If you want to share your website with another developer, you’ll want to remove the `node_modules` folder and share the rest of the project.
6. Make the following file `index.html`. Do not open the file directly!
7. In `package.json`, replace the `scripts` part with the following:
    
    ```json
    {
      // ...
      "scripts": {
        "dev": "vite",
        "build": "vite build"
      },
      // ...
    }
    ```
    
8. To run the “dev” script, in the terminal, run:
    
    ```bash
    npm run dev
    ```
    
9. Vite should display a URL looking like **`http://localhost:5173/`**. Copy and paste it into your browser to open it like any website.
