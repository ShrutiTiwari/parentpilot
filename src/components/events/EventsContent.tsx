import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCircle,
  Sparkles,
  CalendarCheck,
  Image as ImageIcon
} from "lucide-react";

interface EventsContentProps {
  theme?: 'dark' | 'light';
  showHero?: boolean;
}

export function EventsContent({ theme = 'dark', showHero = true }: EventsContentProps) {
  const isDark = theme === 'dark';

  return (
    <>
      {showHero && (
        /* Hero Section - Full Screen */
        <section className={`relative min-h-screen flex items-center justify-center pt-20 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {/* Animated Background Gradient */}
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-blue-900/20 via-black to-indigo-900/20' : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'}`}>
          {/* Animated floating elements */}
          <div className="absolute top-20 left-10 animate-float">
            <div className="text-6xl opacity-20">📅</div>
          </div>
          <div className="absolute top-40 right-20 animate-float-delayed">
            <div className="text-5xl opacity-20">🔔</div>
          </div>
          <div className="absolute bottom-40 left-1/4 animate-float">
            <div className="text-4xl opacity-20">✅</div>
          </div>
          <div className="absolute bottom-20 right-1/3 animate-float-delayed">
            <div className="text-5xl opacity-20">📱</div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          {/* Small badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-100 border-blue-200'} border mb-8 backdrop-blur-sm`}>
            <Sparkles className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Never Miss Another School Event</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
            Stop Being
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
              That Parent
            </span>
          </h1>

          {/* Subheadline */}
          <p className={`text-xl md:text-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-12 max-w-3xl mx-auto leading-relaxed`}>
            The one who forgot dress-up day. Who missed the permission slip deadline.
            <br className="hidden md:block" />
            Who showed up on the wrong day.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-8 text-xl font-semibold rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              <Link to="/events">
                📅 Get Organized Now
              </Link>
            </Button>
          </div>
        </div>
        </section>
      )}

      {/* Video Section */}
      <section className={`py-32 px-4 relative ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6">
            🎥 See How It Works
          </h2>
          <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center mb-12`}>
            Watch how PowerParent saves parents hours every week
          </p>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-3xl blur-2xl"></div>
            <div className={`relative ${isDark ? 'bg-gradient-to-br from-gray-900/80 to-black/80 border-blue-500/20' : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200'} border rounded-3xl p-4 backdrop-blur-sm`}>
              <video
                controls
                className="w-full rounded-2xl shadow-2xl"
                poster="/images/power_parent_problem.png"
              >
                <source src="/video/PowerParent_Marketing.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className={`py-32 px-4 relative ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Problem */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-orange-600/10 rounded-2xl blur-xl"></div>
              <div className="relative bg-red-950/30 border border-red-900/50 rounded-2xl p-8 hover:border-red-700/70 transition-all">
                <h3 className="text-2xl font-bold text-red-300 mb-4 flex items-center gap-2">
                  <span className="text-3xl">😰</span>
                  The Calendar Chaos
                </h3>
                <ul className={`space-y-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">×</span>
                    <span>WhatsApp groups flooding with event screenshots</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">×</span>
                    <span>Paper flyers lost in school bags</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">×</span>
                    <span>Multiple kids, multiple schools, multiple calendars</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">×</span>
                    <span>Last-minute panics at bedtime</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Solution */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-2xl blur-xl"></div>
              <div className="relative bg-green-950/30 border border-green-900/50 rounded-2xl p-8 hover:border-green-700/70 transition-all">
                <h3 className="text-2xl font-bold text-green-300 mb-4 flex items-center gap-2">
                  <span className="text-3xl">✨</span>
                  One Calendar. Zero Stress.
                </h3>
                <ul className={`space-y-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Snap a photo → Event added automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>All kids' schedules in one place</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Smart reminders at the right time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Auto-generated to-do lists for every event</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-32 px-4 relative ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Your Personal
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> Event Assistant</span>
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Everything you need to stay on top of school life</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-2xl p-8 hover:border-blue-400/40 transition-all">
                <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <ImageIcon className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI Image Extraction</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  Take a photo of any flyer, screenshot, or notice. Our AI extracts all events, dates, and details instantly. No typing required.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-2xl p-8 hover:border-indigo-400/40 transition-all">
                <div className="bg-indigo-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <CalendarCheck className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Smart Organization</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  Separate calendars for each child. Color-coded by type. Filter by school, activity, or importance. Find what matters in seconds.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-2xl p-8 hover:border-purple-400/40 transition-all">
                <div className="bg-purple-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <Bell className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Never Forget Again</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  Smart reminders that know when to alert you. Auto-generated to-dos for permission slips, costumes, and more. Stay ahead effortlessly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-32 px-4 relative overflow-hidden ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                0
              </div>
              <div className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Missed Events</div>
            </div>
            <div>
              <div className="text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                5min
              </div>
              <div className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>To Get Organized</div>
            </div>
            <div>
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                100%
              </div>
              <div className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Peace of Mind</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={`py-32 px-4 relative ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Ready to Be
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              The Organized Parent?
            </span>
          </h2>
          <p className={`text-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-12`}>
            Join thousands of parents who've ditched the calendar chaos
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-16 py-10 text-2xl font-semibold rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105"
          >
            <Link to="/events">
              Start Organizing Today
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${isDark ? 'border-white/10' : 'border-gray-200'} border-t py-12`}>
        <div className={`container mx-auto px-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>&copy; 2025 PowerParent. Making parenting just a little bit easier.</p>
        </div>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-25px); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 4s linear infinite;
        }
      `}</style>
    </>
  );
}