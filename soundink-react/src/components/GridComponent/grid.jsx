import React, { useRef, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { firstColumn, numDotsX, numDotsY, dotRadius } from './gridConfig'; // Import constants

const ERASER_COLOR = '#eae6e1'; // Choose a color that represents the eraser

export const canvasDimensions = { width: 0, height: 0 }; // Export an object to store dimensions

const drawStar = (ctx, x, y, radius, color, rotationAngle = 0) => {
    ctx.save(); // Save the context state

    ctx.fillStyle = color;
    ctx.beginPath();
    const spikes = 50;
    const outerRadius = radius;
    const innerRadius = radius / 2;
    let rotation = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.moveTo(x, y - outerRadius);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(x + Math.cos(rotation) * outerRadius, y - Math.sin(rotation) * outerRadius);
        rotation += step;

        ctx.lineTo(x + Math.cos(rotation) * innerRadius, y - Math.sin(rotation) * innerRadius);
        rotation += step;
    }
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fill();

    ctx.restore(); // Restore the original context state
};

const DARKEN_FACTOR = 0.6; // Adjust this to control how much darker the color becomes
const LIGHTEN_FACTOR = 3 ; // Adjust this to control how much brighter the color becomes

const getContrastingGlowColor = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate brightness
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

    // Adjust the color to be lighter or darker based on brightness
    const adjustmentFactor = brightness > 128 ? DARKEN_FACTOR : LIGHTEN_FACTOR;
    const adjust = (channel) =>
        Math.min(255, Math.max(0, Math.round(channel * adjustmentFactor)));

    const adjustedR = adjust(r);
    const adjustedG = adjust(g);
    const adjustedB = adjust(b);

    // Return the adjusted color in hex format
    return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG
        .toString(16)
        .padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
};

const GridCanvas = ({ showGrid, scannedColumn, intersectedDots, gridConfig, colorSlots }) => {
    const canvasRef = useRef(null);

    const { numDotsX, numDotsY, dotRadius } = gridConfig; // Destructure grid configuration

    const drawGlowingDot = (ctx, x, y, color) => {
        ctx.save(); // Save the context state

        // Get a contrasting glow color
        const glowColor = getContrastingGlowColor(color);

        const glowLayers = [
            { blur: 20, sizeMultiplier: 2.2, color: `${glowColor}22` }, // Outer glow
            { blur: 14, sizeMultiplier: 1.4, color: `${glowColor}44` }, // Mid glow
            { blur: 9,  sizeMultiplier: 0.9, color: `${glowColor}99` }, // Inner glow
            { blur: 4,  sizeMultiplier: 0.1, color: `${glowColor}CC` }  // Core glow
        ];
    
        glowLayers.forEach(({ blur, sizeMultiplier, color }) => {
            ctx.shadowColor = color;
            ctx.shadowBlur = blur;
            ctx.fillStyle = color;
            
            ctx.beginPath();
            const size = dotRadius * sizeMultiplier;
            // ctx.arc(x, y, dotRadius * sizeMultiplier, 0, Math.PI * 2);
            ctx.arc(x, y, size, 0, Math.PI * 2);
            // drawStar(ctx, x, y, size, color); // Draw star

            ctx.closePath();
            ctx.fill();
        });
    
        ctx.restore(); // Restore the original context state
    };

    const drawSmoothDot = (ctx, x, y, color, isScanned, isIntersected) => {
        if (isScanned || isIntersected) {
            drawGlowingDot(ctx, x, y, color);
        } else {
            const circlePoints = [
                [x - dotRadius, y],
                [x, y - dotRadius],
                [x + dotRadius, y],
                [x, y + dotRadius],
                [x - dotRadius, y],
            ];

            const path = getStroke(circlePoints, {
                size: dotRadius * 2,
                thinning: 0,
                smoothing: 1,
                streamline: 1,
                start: { taper: 0 },
                end: { taper: 0 },
            });

            ctx.fillStyle = color;
            ctx.beginPath();
            path.forEach(([px, py], i) => {
                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            });
            ctx.closePath();
            ctx.fill();
        }
    };

    const drawColumn = (ctx, column, containerWidth, containerHeight) => {
        const dotSpacingX = containerWidth / numDotsX; // Adjust spacing to fit 24 columns
        const dotSpacingY = containerHeight / numDotsY;
    
        for (let j = 0; j < numDotsY; j++) {
            const x = column * dotSpacingX + dotSpacingX / 2;
            const y = j * dotSpacingY + dotSpacingY / 2;
    
            const isScanned = column === scannedColumn; // Check if it's the scanned column
            const intersectData = intersectedDots?.[column]?.[j]; // Check if this dot is intersected
            const isIntersected = Boolean(intersectData);
    
            // Check if the intersected dot's color is the eraser (background color)
            // const isBackgroundColor = intersectData?.color === ERASER_COLOR;

            // Check if the intersected dot's color corresponds to the eraser slot
            const isBackgroundColor = intersectData?.color === colorSlots.eraser;
            
            // console.log(`Intersect Data Color: ${intersectData?.color}, Eraser Color: ${ERASER_COLOR}`);
            const lineColor = intersectData?.color;


            // Debugging: Log intersectedDots and the color
            // console.log(`Column: ${column}, Row: ${j}, IntersectData:`, intersectData);
    
            if (isScanned && isIntersected && !isBackgroundColor) {
                // const lineColor = intersectData.color;
                // console.log('Scanned and intersected dot color:', lineColor);
                drawGlowingDot(ctx, x, y, lineColor); // Draw intense glow
            } else if (isScanned) {
                drawSmoothDot(ctx, x, y, 'rgba(255, 88, 51, 0.11)', true); // Mild glow for scanned dots
            } else if (isBackgroundColor) {
                // For dots erased with the soft eraser, draw with the regular dot color
                drawSmoothDot(ctx, x, y, 'rgba(0, 150, 180, 0.18)', false);
            } else {
                drawSmoothDot(ctx, x, y, 'rgba(0, 150, 180, 0.18)', false); // Regular dot color
            }
        }
    };

    useEffect(() => { // Added function - Renee
    // eequivalent to manually resizing the window - fixes Safari
    requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
    });
    }, []);


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
    
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const container = document.querySelector('.canvas-container');
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            canvasDimensions.width = containerWidth;
            canvasDimensions.height = containerHeight;

            // console.log('containerWidth:', containerWidth);
            // console.log('containerHeight:', containerHeight);
            canvas.width = containerWidth; // Adjust canvas size to container width
            canvas.height = containerHeight; // Adjust canvas size to container height
        
            if (showGrid) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = firstColumn; i < numDotsX; i++) { // Ensure we draw 24 columns
                    drawColumn(ctx, i, containerWidth, containerHeight); // Use container dimensions for spacing
                }
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    
        return () => {
            window.removeEventListener('resize', resizeCanvas);
        }; 
    }, [gridConfig, showGrid]); // Add showGrid as a dependency

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (showGrid) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = firstColumn; i < numDotsX; i++) {
                drawColumn(ctx, i, canvas.width, canvas.height);
            }
        }
    }, [scannedColumn, intersectedDots, showGrid]); // Redraw only the scanned column

    useEffect(() => {
        // console.log('Received Intersected Dots in GridCanvas:', intersectedDots);
      }, [intersectedDots]);

    return showGrid ? <canvas ref={canvasRef} className="grid-canvas" /> : null;
};

export default GridCanvas;