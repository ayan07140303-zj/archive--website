import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { HERO_SLIDES } from '../assets/images';

const AUTO_PLAY_INTERVAL = 5000;

const HeroCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1=forward, -1=backward

  const total = HERO_SLIDES.length;

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent(prev => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent(prev => (prev - 1 + total) % total);
  }, [total]);

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  // Auto play
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goNext, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  const slide = HERO_SLIDES[current];

  return (
    <section
      className="relative rounded-xl overflow-hidden h-[440px] group shadow-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background slides */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.8) 100%)' }}
      />

      {/* Text content — also animated with slide */}
      <div className="absolute bottom-0 left-0 p-12 text-on-primary max-w-2xl z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4 bg-primary/20 backdrop-blur-md w-fit px-3 py-1 rounded-full border border-primary/30">
              <span className="text-label-sm uppercase tracking-wider">{slide.label}</span>
            </div>
            <h1 className="text-display font-display mb-4 leading-tight text-3xl sm:text-4xl font-extrabold">
              {slide.title}
            </h1>
            <p className="text-body-lg text-white/80 mb-6 max-w-xl">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows — show on hover */}
      <div className="absolute inset-y-0 left-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={goPrev}
          className="ml-4 p-2 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={goNext}
          className="mr-4 p-2 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === current
                ? 'w-8 h-2.5 bg-white shadow-lg'
                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Pause / Play */}
      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white transition-all"
          title={isPaused ? '播放' : '暂停'}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>
    </section>
  );
};

export default HeroCarousel;
