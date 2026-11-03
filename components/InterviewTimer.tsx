"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";

interface InterviewTimerProps {
  initialMinutes?: number;
  label?: string;
}

export function InterviewTimer({ initialMinutes = 35, label = "Interview Timer" }: InterviewTimerProps) {
  const totalSeconds = initialMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setIsActive(false);
    setSecondsLeft(totalSeconds);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const percentRemaining = (secondsLeft / totalSeconds) * 100;
  const isUrgent = secondsLeft < 300; // Under 5 mins

  return (
    <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm text-xs font-mono">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Clock className={`w-3.5 h-3.5 ${isActive ? "text-blue-400 animate-pulse" : ""}`} />
        <span className="hidden sm:inline font-sans font-medium text-slate-300">{label}:</span>
      </div>

      <div
        className={`font-semibold tracking-wider text-sm ${
          isUrgent ? "text-amber-400 font-bold animate-pulse" : "text-slate-100"
        }`}
      >
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>

      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden md:block">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isUrgent ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${percentRemaining}%` }}
        />
      </div>

      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={toggle}
          title={isActive ? "Pause Timer" : "Start Timer"}
          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          {isActive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
        </button>
        <button
          onClick={reset}
          title="Reset Timer"
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
