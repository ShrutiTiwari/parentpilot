import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogIn, CalendarDays, Clock, Bell, Users } from "lucide-react";
import { GlobalReachMap } from "./landing/GlobalReachMap";
import { EventsTestimonialsBanner } from "./landing/EventsTestimonialsBanner";

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center bg-[#F0F8FF] rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] border border-blue-100">
      <div className="bg-blue-100/60 p-4 rounded-full mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
        {title}
      </h3>
      <p className="text-gray-600 text-center">{description}</p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section - Image First */}
      <header className="container mx-auto px-4 py-20 flex flex-col md:flex-row items-center justify-between">
        <div className="w-full md:w-1/2 mb-12 md:mb-0">
          <img
            src="/images/music_power_parent_scoial.png"
            alt="App Dashboard"
            className="w-full max-w-md mx-auto rounded-xl shadow-lg"
          />
        </div>
        <div className="w-full md:w-1/2 max-w-xl text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Be the Parent Who’s Always in the Know
          </h1>
          <p className="text-lg text-gray-600 mb-8">
          Keep school and outside schedules on track — without the mental load.
          </p>
          <div className="flex sm:flex-row justify-center md:justify-start">

            <Button
              asChild
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Link to="/events">
                📅 Track Kids Schedule
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Value Proposition - Above the fold */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🧠</span>
                <span className="text-gray-700 font-medium">Automatically syncs school calendars</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <span className="text-gray-700 font-medium">Prepares your to-do list for every event</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📅</span>
                <span className="text-gray-700 font-medium">Coordinates across multiple kids & schools</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🖼️</span>
                <span className="text-gray-700 font-medium">Extracts events from screenshots, images, and flyers — no typing needed</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🔔</span>
                <span className="text-gray-700 font-medium">Sends alerts before it's too late</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section - Moved up for higher prominence */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-4">🎥 Watch how Power Parent saves parents hours every week</h2>
          <div className="max-w-4xl mx-auto">
            <video 
              controls 
              className="w-full rounded-xl shadow-lg"
              poster="/images/power_parent_problem.png"
            >
              <source src="/video/PowerParent_Marketing.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* Why We Built Power Parent Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-center mb-12">Why We Built Power Parent</h2>
            
            <div className="prose prose-lg mx-auto text-gray-700 leading-relaxed">
              <p className="mb-6">
                We were two parents working in big tech — juggling code, teams, meetings… and a steady stream of scattered school communication across portals, emails, WhatsApp groups, and mystery paper slips in backpacks. But the hardest job? Keeping track of what costume, snack, form, or field trip was due this week.
              </p>
              
              <p className="mb-6">
                We missed things. A school play we didn't know about until the night before. A dress-up day our kid showed up to... not dressed up. Permission slips that lived and died in our inbox. Each tiny miss felt like a parenting fail — even when we were doing our absolute best.
              </p>
              
              <p className="mb-6">
                We tried everything: spreadsheets, shared calendars, WhatsApp groups, forwarding emails to the nanny, shouting reminders across the house. It still felt like running a second chaotic job. The mental load was real. The guilt was quieter but heavier.
              </p>
              
              <p className="mb-6">
                Eventually, one of us quit a 20-year tech career — not because we were done with tech, but because we knew it could do better. Power Parent was born from that moment.
              </p>
              
              <p className="mb-6">
                We built it to help parents stay organized without burning out. It brings school schedules, reminders, forms, and responsibilities into one calm, shareable place — so you can stop dropping balls and start breathing again.
              </p>
              
              <p className="text-lg font-medium text-center text-blue-600 italic">
                If you've ever muttered "Oh no, not again" while frantically scrolling through an email at midnight — this is for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-12">Why Power Parent?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mx-auto max-w-4xl">
  
            {/* Feature 1 */}
            <FeatureCard
              icon={<CalendarDays className="w-8 h-8 text-blue-600" />}
              title="Smart Centralized Dashboard"
              description="Keep track of all school activities, events, and deadlines in one place. Use intuitive filters to quickly find holidays, sports days, music events, and more."
            />

            {/* Feature 2 */}
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-blue-600" />}
              title="Actionable Event To-Dos"
              description="Get a clear checklist for every event — fill forms, arrange child care, prep costumes, plan pickups—so you're always ahead of the game."
            />

            {/* Feature 3 */}
            <FeatureCard
              icon={<Users className="w-8 h-8 text-blue-600" />}
              title="Multi-Child Coordination"
              description="Manage multiple children across different schools without double-booking or forgetting who needs what."
            />

            {/* Feature 4 */}
            <FeatureCard
              icon={<Bell className="w-8 h-8 text-blue-600" />}
              title="Timely Alerts & Notifications"
              description="Receive reminders and important updates before it's too late. No more missed deadlines or surprise events."
            />

          </div>
        </div>
      </section>

      {/* School Events Management Section */}
      <section className="bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
                📅 Never Miss Another School Event
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Keep track of all school activities, forms, and deadlines across multiple children and schools
              </p>
              <div className="flex justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Link to="/events">
                    🚀 Start Organizing School Life
                  </Link>
                </Button>
              </div>
            </div>

            {/* Events Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white/80 rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl mb-3">🖼️</div>
                <h3 className="font-semibold text-gray-800 mb-2">Smart Event Extraction</h3>
                <p className="text-sm text-gray-600">Upload photos of flyers and forms - we'll extract all the details automatically</p>
              </div>
              <div className="bg-white/80 rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl mb-3">✅</div>
                <h3 className="font-semibold text-gray-800 mb-2">Actionable To-Dos</h3>
                <p className="text-sm text-gray-600">Get clear checklists for every event - from permissions to costumes</p>
              </div>
              <div className="bg-white/80 rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl mb-3">🔔</div>
                <h3 className="font-semibold text-gray-800 mb-2">Perfect Timing</h3>
                <p className="text-sm text-gray-600">Smart reminders that arrive just when you need them - not too early, not too late</p>
              </div>
            </div>

            {/* Events Testimonials Banner */}
            <EventsTestimonialsBanner />
          </div>
        </div>
      </section>

      {/* Global Reach Section */}
      <GlobalReachMap />

    </div>
  );
}

function Testimonial({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4 space-x-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className="w-4 h-4 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="italic text-gray-700 mb-4">"{text}"</p>
      <p className="font-medium text-gray-800">- {name}, {role}</p>
    </div>
  );
}
