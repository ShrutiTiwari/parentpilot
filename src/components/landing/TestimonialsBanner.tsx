import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: string;
  text: string;
  author: string;
  role: string;
  category: 'music' | 'schedule' | 'general';
  emoji: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    text: "Absolutely loving this so far! My 9-year-old daughter has already completed a full week streak — and she's been playing ALL the scales for her grade. She's improved so much with consistent practice, and it's all self-driven 🌟.",
    author: "Emma L.",
    role: "Parent of Grade 4 Piano Student",
    category: 'music',
    emoji: "🎹"
  },
  {
    id: '2', 
    text: "Finally, a way to track my daily practice and build consistent habits. The streaks keep me motivated and I can see my progress visually!",
    author: "Piano Student",
    role: "Grade 6 ABRSM",
    category: 'music',
    emoji: "🔥"
  },
  {
    id: '3',
    text: "This app has saved me from forgetting so many school events. No more last-minute scrambling for costumes or permission slips!",
    author: "Sarah M.",
    role: "Mother of 2",
    category: 'schedule',
    emoji: "📅"
  },
  {
    id: '4',
    text: "Managing three kids in different schools used to be a nightmare. Now I have everything organized in one place!",
    author: "Mark T.", 
    role: "Father of 3",
    category: 'schedule',
    emoji: "👨‍👩‍👧‍👦"
  },
  {
    id: '5',
    text: "The practice tracking has transformed how my son approaches his scales. He actually looks forward to building his streak each day!",
    author: "Jennifer R.",
    role: "Parent of Grade 2 Student",
    category: 'music',
    emoji: "🎼"
  },
  {
    id: '6',
    text: "Love how it extracts events from school photos and flyers automatically. No more typing everything manually!",
    author: "David P.",
    role: "Busy Parent",
    category: 'general',
    emoji: "📸"
  }
];

export function TestimonialsBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance testimonials every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 py-8 border-y border-blue-100">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              💝 What Users Are Saying
            </h3>
            <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
              <span>Real feedback from our community</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-3 h-3 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonial Content */}
          <div className="relative">
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-blue-200 min-h-[180px] flex flex-col justify-center">
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{currentTestimonial.emoji}</div>
                <div className="flex-1">
                  <blockquote className="text-lg text-gray-700 leading-relaxed mb-4 italic">
                    "{currentTestimonial.text}"
                  </blockquote>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        — {currentTestimonial.author}
                      </p>
                      <p className="text-sm text-gray-600">
                        {currentTestimonial.role}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        currentTestimonial.category === 'music' 
                          ? 'bg-purple-100 text-purple-700' 
                          : currentTestimonial.category === 'schedule'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {currentTestimonial.category === 'music' ? '🎹 Music Practice' : 
                         currentTestimonial.category === 'schedule' ? '📅 School Planning' : 
                         '⚡ General'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 p-0 hover:bg-blue-100 rounded-full"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 p-0 hover:bg-blue-100 rounded-full"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsAutoPlaying(false);
                  setTimeout(() => setIsAutoPlaying(true), 10000);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-blue-600 w-6' 
                    : 'bg-blue-300 hover:bg-blue-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play indicator */}
          <div className="text-center mt-3">
            <span className="text-xs text-gray-500">
              {isAutoPlaying ? '▶️ Auto-playing' : '⏸️ Paused'} • {currentIndex + 1} of {testimonials.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}