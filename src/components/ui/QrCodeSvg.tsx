import React from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function isFinderCell(row: number, col: number, gridSize: number): boolean | null {
  const corners = [
    [0, 0],
    [0, gridSize - 7],
    [gridSize - 7, 0],
  ];
  for (const [r0, c0] of corners) {
    const dr = row - r0;
    const dc = col - c0;
    if (dr >= 0 && dr < 7 && dc >= 0 && dc < 7) {
      if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
      if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
      return false;
    }
    if (dr >= -1 && dr <= 7 && dc >= -1 && dc <= 7) {
      return false;
    }
  }
  return null;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({ value, size = 144 }) => {
  const gridSize = 21;
  let state = hashSeed(value) || 123456789;
  const cells: Array<{ x: number; y: number }> = [];

  for (let r = 0; r < gridSize; r += 1) {
    for (let c = 0; c < gridSize; c += 1) {
      const finder = isFinderCell(r, c, gridSize);
      let dark = false;
      if (finder !== null) {
        dark = finder;
      } else if (r === 6 || c === 6) {
        dark = (r + c) % 2 === 0;
      } else {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        dark = (state & 1) === 1;
      }
      if (dark) {
        cells.push({ x: c, y: r });
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-2 -2 ${gridSize + 4} ${gridSize + 4}`}
      className="rounded-lg border border-[#E2E8F0] bg-white"
      role="img"
      aria-label={`Kode QR ${value}`}
    >
      <rect x="-2" y="-2" width={gridSize + 4} height={gridSize + 4} fill="#FFFFFF" />
      {cells.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width={1}
          height={1}
          fill="#0F2A66"
        />
      ))}
    </svg>
  );
};
