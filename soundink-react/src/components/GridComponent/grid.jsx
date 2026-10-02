import React, { useRef, useEffect } from 'react';
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

const LIGHTNESS_SHIFT = 0.15; // How far the glow's lightness moves away from the stroke colour
const SATURATION_BOOST = 1.15; // Slight saturation boost so the glow stays vivid

const hexToHsl = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l]; // Greyscale

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h / 6, s, l];
};

const hslToHex = (h, s, l) => {
    const hueToRgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(hueToRgb(p, q, h + 1 / 3))}${toHex(hueToRgb(p, q, h))}${toHex(hueToRgb(p, q, h - 1 / 3))}`;
};

// Glow colour for the playhead: same hue as the stroke, only lightness/saturation shift.
// (Scaling RGB channels directly clipped them and shifted the hue, e.g. dark red glowed pink.)
const getContrastingGlowColor = (hexColor) => {
    if (!/^#[0-9a-f]{6}$/i.test(hexColor)) return hexColor;

    const [h, s, l] = hexToHsl(hexColor);
    const newL = l > 0.6 ? l - LIGHTNESS_SHIFT : Math.min(l + LIGHTNESS_SHIFT, 0.7);
    const newS = Math.min(1, s * SATURATION_BOOST);
    return hslToHex(h, newS, newL);
};

// Bright centre for a hit dot. The grid is drawn on top of the strokes, so a same-hue glow blends into
// the stroke underneath; a near-white (or, for light strokes, deep) tint of the same hue stands out.
const getGlowCoreColor = (hexColor) => {
    if (!/^#[0-9a-f]{6}$/i.test(hexColor)) return hexColor;

    const [h, s, l] = hexToHsl(hexColor);
    return l > 0.6 ? hslToHex(h, Math.min(1, s * SATURATION_BOOST), 0.3) : hslToHex(h, s, 0.92);
};

const GridCanvas = ({ showGrid, scannedColumn, intersectedDots, gridConfig, colorSlots }) => {
    const canvasRef = useRef(null);

    const { numDotsX, numDotsY, dotRadius } = gridConfig; // Destructure grid configuration

    const drawGlowingDot = (ctx, x, y, color) => {
        ctx.save(); // Save the context state

        // Same-hue glow around a high-contrast centre so hits stand out on top of the stroke
        const glowColor = getContrastingGlowColor(color);
        const coreColor = getGlowCoreColor(color);

        const glowLayers = [
            { blur: 24, sizeMultiplier: 2.6, color: `${glowColor}44` }, // Outer glow
            { blur: 16, sizeMultiplier: 1.7, color: `${glowColor}88` }, // Mid glow
            { blur: 10, sizeMultiplier: 1.1, color: `${glowColor}DD` }, // Inner glow
            { blur: 6,  sizeMultiplier: 0.6, color: `${coreColor}FF` }  // Core
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
            // Plain dot. (Previously drawn with perfect-freehand's getStroke on every redraw, which was slow and
            // put the dot dotRadius px left of its real position; the glow and hit detection use the true centre.)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
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