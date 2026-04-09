"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Job } from "@/lib/types";

interface JobCardProps {
  job: Job;
  onSwipe: (direction: "left" | "right", job: Job) => void;
}

export default function JobCard({ job, onSwipe }: JobCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const handleStart = (x: number) => {
      startX = x;
      isDragging = true;
      card.style.transition = "none";
    };

    const handleMove = (x: number) => {
      if (!isDragging) return;
      currentX = x - startX;
      card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.1}deg)`;
      const opacity = Math.max(0.3, 1 - Math.abs(currentX) / 300);
      card.style.opacity = String(opacity);
    };

    const handleEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      card.style.transition = "all 0.3s ease-out";
      const threshold = 100;
      if (currentX > threshold) {
        card.style.transform = "translateX(120%) rotate(30deg)";
        card.style.opacity = "0";
        setTimeout(() => onSwipe("right", job), 300);
      } else if (currentX < -threshold) {
        card.style.transform = "translateX(-120%) rotate(-30deg)";
        card.style.opacity = "0";
        setTimeout(() => onSwipe("left", job), 300);
      } else {
        card.style.transform = "translateX(0) rotate(0)";
        card.style.opacity = "1";
      }
      currentX = 0;
    };

    const onMD = (e: MouseEvent) => handleStart(e.clientX);
    const onMM = (e: MouseEvent) => handleMove(e.clientX);
    const onTS = (e: TouchEvent) => handleStart(e.touches[0].clientX);
    const onTM = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };

    card.addEventListener("mousedown", onMD);
    document.addEventListener("mousemove", onMM);
    document.addEventListener("mouseup", handleEnd);
    card.addEventListener("touchstart", onTS);
    document.addEventListener("touchmove", onTM);
    document.addEventListener("touchend", handleEnd);

    return () => {
      card.removeEventListener("mousedown", onMD);
      document.removeEventListener("mousemove", onMM);
      document.removeEventListener("mouseup", handleEnd);
      card.removeEventListener("touchstart", onTS);
      document.removeEventListener("touchmove", onTM);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [onSwipe, job]);

  const handleLikeClick = () => {
    setIsAnimating(true);
    setTimeout(() => onSwipe("right", job), 300);
  };

  const handleRejectClick = () => {
    setIsAnimating(true);
    setTimeout(() => onSwipe("left", job), 300);
  };

  return (
    <div
      ref={cardRef}
      className={`relative w-full h-full max-h-[75vh] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-card card-swipe ${isAnimating ? "heart-animation" : ""}`}
    >
      <img src={job.image_url} alt={job.title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

      <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end">
        <div className="flex gap-2 mb-4">
          {job.tags.map((tag, index) => (
            <span
              key={index}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full backdrop-blur-md ${
                tag === "Žádané pozice"
                  ? "bg-secondary/20 text-secondary border border-secondary/50 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                  : "bg-white/10 text-white border border-white/20"
              }`}
            >
              {tag === "Žádané pozice" ? "🔥 " : ""}{tag}
            </span>
          ))}
        </div>

        <div className="flex justify-between items-end mb-5">
          <div className="flex-1">
            <h2 className="font-heading text-4xl font-black text-white mb-1 leading-none tracking-tight drop-shadow-md">
              {job.title}
            </h2>
            <p className="text-white/80 text-lg font-medium tracking-wide">@ {job.company}</p>
          </div>
          <div className="text-right shrink-0 pl-4">
            <span className="block font-heading text-5xl font-black text-foreground drop-shadow-[0_2px_10px_rgba(41,41,120,0.5)]">
              ${job.pay}
            </span>
            <span className="text-white/70 text-sm font-bold uppercase tracking-wider">
              {job.pay_unit} {job.tips && "+ spropitné"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-3 text-white bg-black/40 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-center size-8 rounded-full bg-secondary/20 text-secondary">
              {/* @ts-expect-error - iconify-icon is a web component */}
              <iconify-icon icon="solar:map-point-bold" class="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">{job.location}</span>
              {job.distance && <span className="text-white/60 text-xs font-medium">{job.distance} daleko</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 text-white bg-black/40 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-center size-8 rounded-full bg-primary/20 text-primary">
              {/* @ts-expect-error - iconify-icon is a web component */}
              <iconify-icon icon="solar:calendar-bold" class="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">{job.date}</span>
              <span className="text-white/60 text-xs font-medium">{job.time_start} - {job.time_end} ({job.duration})</span>
            </div>
          </div>
        </div>
        <div className="pb-8" />
      </div>

      <div className="absolute bottom-0 left-0 w-full flex items-center justify-center gap-6 px-8 pb-4 z-20">
        <button
          onClick={handleRejectClick}
          className="flex items-center justify-center size-16 rounded-full bg-card/80 border border-white/10 backdrop-blur-2xl text-destructive hover:bg-destructive/20 hover:border-destructive/50 transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          {/* @ts-expect-error - iconify-icon is a web component */}
          <iconify-icon icon="solar:close-circle-bold" class="size-12" />
        </button>
        <button
          onClick={handleLikeClick}
          className="flex items-center justify-center size-20 rounded-full bg-gradient-to-br from-primary to-primary text-white shadow-[0_0_40px_rgba(41,41,120,0.5)] hover:scale-110 active:scale-95 transition-all border-2 border-white/20"
        >
          {/* @ts-expect-error - iconify-icon is a web component */}
          <iconify-icon icon="solar:heart-angle-bold" class="size-14" />
        </button>
      </div>
    </div>
  );
}
