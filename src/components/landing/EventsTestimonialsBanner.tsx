import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface EventsTestimonial {
  id: string;
  text: string;
  author: string;
  role: string;
  emoji: string;
  achievement?: string;
}

const eventsTestimonials: EventsTestimonial[] = [
  {
    id: '1',
    text: "This app has saved me from forgetting so many school events. No more last-minute scrambling for costumes or permission slips!",
    author: "Sarah M.",
    role: "Mother of 2",
    emoji: "📅",
    achievement: "Zero missed events"
  },
  {
    id: '2', 
    text: "Managing three kids in different schools used to be a nightmare. Now I have everything organized in one place!",
    author: "Mark T.",
    role: "Father of 3",
    emoji: "👨‍👩‍👧‍👦",
    achievement: "3 schools coordinated"
  },
  {
    id: '3',
    text: "Love how it extracts events from school photos and flyers automatically. No more typing everything manually!",
    author: "David P.",
    role: "Busy Parent",
    emoji: "📸",
    achievement: "Time saver"
  },
  {
    id: '4',
    text: "The reminders are perfectly timed - not too early, not too late. I actually feel prepared for school events now!",
    author: "Lisa K.",
    role: "Working Mom",
    emoji: "🔔",
    achievement: "Always prepared"
  },
  {
    id: '5',
    text: "Finally, all my kids' school calendars in one place. The stress of juggling multiple school portals is gone!",
    author: "James R.",
    role: "Parent of twins",
    emoji: "🗓️",
    achievement: "Stress-free planning"
  }
];

interface EventsTestimonialsBannerProps {
  className?: string;
}

export function EventsTestimonialsBanner({ className = "" }: EventsTestimonialsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance testimonials every 6 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === eventsTestimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === 0 ? eventsTestimonials.length - 1 : currentIndex - 1);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(currentIndex === eventsTestimonials.length - 1 ? 0 : currentIndex + 1);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentTestimonial = eventsTestimonials[currentIndex];

  return (
    <div className={`bg-gradient-to-r from-blue-50 via-green-50 to-teal-50 rounded-xl p-4 md:p-6 border-2 border-blue-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">What Parents Are Saying</h3>
            <p className="text-sm text-gray-600">Real feedback from busy parents like you</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="w-4 h-4 text-yellow-500 fill-current"
            />
          ))}
        </div>
      </div>

      {/* Testimonial Content */}
      <div className="relative">
        <div className="bg-white/80 rounded-lg p-4 md:p-5 min-h-[140px] flex items-center">
          <div className="flex items-start gap-3 w-full">
            <div className="text-2xl flex-shrink-0 mt-1">{currentTestimonial.emoji}</div>
            <div className="flex-1 min-w-0">
              <blockquote className="text-gray-700 leading-relaxed mb-3 italic text-sm md:text-base">
                "{currentTestimonial.text}"
              </blockquote>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">
                    — {currentTestimonial.author}
                  </p>
                  <p className="text-xs text-gray-600">
                    {currentTestimonial.role}
                  </p>
                </div>
                {currentTestimonial.achievement && (
                  <div className="hidden sm:block">
                    <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
                      🏆 {currentTestimonial.achievement}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {eventsTestimonials.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 p-0 hover:bg-blue-100 rounded-full opacity-70 hover:opacity-100"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 p-0 hover:bg-blue-100 rounded-full opacity-70 hover:opacity-100"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>

      {/* Progress Indicators */}
      {eventsTestimonials.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {eventsTestimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsAutoPlaying(false);
                setTimeout(() => setIsAutoPlaying(true), 10000);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-blue-600 w-4' 
                  : 'bg-blue-300 hover:bg-blue-400'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Small indicator */}
      <div className="text-center mt-2">
        <span className="text-xs text-gray-500">
          {currentIndex + 1} of {eventsTestimonials.length}
        </span>
      </div>
    </div>
  );
}