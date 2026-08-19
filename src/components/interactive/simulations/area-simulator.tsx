"use client";

import { useState } from "react";

export function AreaSimulator() {
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(3);

  const area = width * height;
  const perimeter = 2 * (width + height);
  const cellSize = Math.min(280 / width, 200 / height, 40);

  return (
    <div className="flex flex-col items-center gap-6 p-6 sm:p-8">
      <div
        className="grid gap-px overflow-hidden rounded-lg border bg-border"
        style={{ gridTemplateColumns: `repeat(${width}, ${cellSize}px)` }}
      >
        {Array.from({ length: width * height }, (_, i) => (
          <div key={i} className="bg-simulation/25" style={{ width: cellSize, height: cellSize }} />
        ))}
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Largura: {width}
          <input
            type="range"
            min={1}
            max={10}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="accent-simulation"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Altura: {height}
          <input
            type="range"
            min={1}
            max={10}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="accent-simulation"
          />
        </label>
      </div>

      <div className="flex gap-8 text-center">
        <div>
          <p className="text-2xl font-semibold text-simulation">{area}</p>
          <p className="text-xs text-muted-foreground">Área (largura × altura)</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-simulation">{perimeter}</p>
          <p className="text-xs text-muted-foreground">Perímetro (2 × (l + a))</p>
        </div>
      </div>
    </div>
  );
}
