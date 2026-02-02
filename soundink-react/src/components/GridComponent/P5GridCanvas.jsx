import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

// Note: P5GridCanvas is not currently used anywhere - Renee

export const P5GridCanvas = ({ showGrid, scannedColumn, intersectedDots }) => {
  const canvasRef = useRef(null);
  const numDotsX = 50;
  const numDotsY = 15;
  const dotRadius = 3;

  // Function to apply glow effect
  const applyGlow = (p, color, blurAmount) => {
    p.drawingContext.shadowColor = color;
    p.drawingContext.shadowBlur = blurAmount;
  };

  const drawDotWithGlow = (p, x, y, baseColor, glowColor = null, blurAmount = 0) => {
    if (glowColor && blurAmount > 0) {
      applyGlow(p, glowColor, blurAmount);
    } else {
      applyGlow(p, p.color(0, 0, 0, 0), 0); // Reset glow if no glow color is specified
    }

    p.fill(baseColor);
    p.noStroke();
    p.ellipse(x, y, dotRadius * 2, dotRadius * 2);

    applyGlow(p, p.color(0, 0, 0, 0), 0); // Reset glow after drawing
  };

  const drawGrid = (p) => {
    p.clear();
    const dotSpacingX = p.width / numDotsX;
    const dotSpacingY = p.height / numDotsY;

    for (let i = 0; i < numDotsX; i++) {
      for (let j = 0; j < numDotsY; j++) {
        const x = i * dotSpacingX + dotSpacingX / 2;
        const y = j * dotSpacingY + dotSpacingY / 2;

        const isScanned = i === scannedColumn;
        const intersectData = intersectedDots?.[i]?.[j];
        const isIntersected = Boolean(intersectData);

        if (isIntersected) {
          const glowColor = p.color(intersectData.color);
          drawDotWithGlow(p, x, y, intersectData.color, glowColor, 80); // Intense glow for intersected dots
        } else if (isScanned) {
          drawDotWithGlow(p, x, y, p.color(255, 88, 51, 30), p.color(255, 88, 51, 100), 40); // Mild glow for scanned dots
        } else {
          drawDotWithGlow(p, x, y, p.color(207, 204, 204, 70)); // Regular dot without glow
        }
      }
    }
  };

  const setup = (p) => {
    const container = canvasRef.current.parentElement;
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.noLoop();
  };

  const draw = (p) => {
    if (showGrid) {
      drawGrid(p);
    }
  };

  useEffect(() => {
    const sketch = (p) => {
      p.setup = () => setup(p);
      p.draw = () => draw(p);

      p.windowResized = () => {
        const container = canvasRef.current.parentElement;
        p.resizeCanvas(container.clientWidth, container.clientHeight);

        if (showGrid) {
          p.clear();
          p.redraw();
        }
      };
    };

    const p5Instance = new p5(sketch, canvasRef.current);

    return () => {
      p5Instance.remove();
    };
  }, [showGrid, scannedColumn, intersectedDots]);

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none', // Disable pointer events on p5 canvas
        width: '100%',
        height: '100%',
        zIndex: 1, // Ensure it's above other elements if needed
      }}
    ></div>
  );
};

export default P5GridCanvas;