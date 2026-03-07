"use client";

import { useState } from "react";

export const PauseButton = (): JSX.Element => {
  const [paused, setPaused] = useState(false);

  return (
    <button
      className={`rounded px-4 py-2 font-semibold ${
        paused ? "bg-emerald-700 hover:bg-emerald-600" : "bg-red-700 hover:bg-red-600"
      }`}
      onClick={() => setPaused((value) => !value)}
      type="button"
    >
      {paused ? "Resume Agent Activity" : "Pause All Agent Actions"}
    </button>
  );
};
