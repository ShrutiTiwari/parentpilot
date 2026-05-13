import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/utils/auth";
import { useToast } from "@/components/ui/use-toast";
import { GlobalReachMap } from "./landing/GlobalReachMap";
import { displayEvent } from "@/utils/visbilityControl";
import { EventsContent } from "./events/EventsContent";
import { 
  LogIn, 
  CalendarDays, 
  Clock, 
  Bell, 
  Users, 
  Music, 
  Trophy, 
  BookOpen, 
  Target, 
  PlayCircle,
  CheckCircle,
  Star,
  ArrowRight,
  Sparkles,
  Eye,
  UserCheck,
  Zap,
  GraduationCap,
  Award,
  TrendingUp,
  Share2,
  MessageSquare,
  Gamepad2,
  Piano,
  Guitar,
  Mic
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient?: boolean;
}

function FeatureCard({ icon, title, description, gradient = false }: FeatureCardProps) {
  return (
    <div className={`flex flex-col items-center rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] border ${
      gradient
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30'
        : 'bg-gray-800/50 border-gray-600'
    }`}>
      <div className={`p-4 rounded-full mb-4 ${
        gradient
          ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'
          : 'bg-purple-500/10'
      }`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2 text-center">
        {title}
      </h3>
      <p className="text-gray-300 text-center">{description}</p>
    </div>
  );
}

interface MusicFeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

function MusicFeature({ icon, title, description, highlight = false }: MusicFeatureProps) {
  return (
    <div className={`flex items-start space-x-4 p-4 rounded-lg transition-all hover:scale-[1.02] ${
      highlight 
        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200' 
        : 'bg-white border border-gray-200'
    }`}>
      <div className={`p-2 rounded-lg ${
        highlight 
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' 
          : 'bg-purple-100 text-purple-600'
      }`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
}

function Testimonial({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4 space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
        ))}
      </div>
      <p className="italic text-gray-300 mb-4">"{text}"</p>
      <p className="font-medium text-white">- {name}, {role}</p>
    </div>
  );
}

export function PowerParentIntegratedLanding() {
  const [activeTab, setActiveTab] = useState("music");
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user just logged in and should be redirected elsewhere
  useEffect(() => {
    // Only redirect if user is logged in
    if (user) {
      const storedReturnTo = localStorage.getItem('authReturnTo');

      if (storedReturnTo && storedReturnTo !== 'null') {
        // Clean any grade information from redirect URLs to let user's actual grade take precedence
        let cleanUrl = storedReturnTo;
        if (storedReturnTo.includes('/grade/')) {
          cleanUrl = storedReturnTo.replace(/\/grade\/\d+/, '');
        }

        // Clear the stored value
        localStorage.removeItem('authReturnTo');

        // Small delay to ensure state is settled
        setTimeout(() => {
          navigate(cleanUrl);
        }, 100);
      } else {
        // Clean up any 'null' string values that might exist
        if (storedReturnTo === 'null') {
          localStorage.removeItem('authReturnTo');
        }
      }
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      });
    } else {
      toast({
        title: "Signed out successfully"
      });
      // Navigate to landing page after logout
      navigate('/');
    }
  };

  // Get display name - prioritize full_name, fallback to email
  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    return user?.email || 'User';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Welcome Greeting for Signed-in Users */}
      {user && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Welcome back, {getDisplayName()}! 👋
                  </h2>
                </div>
              </div>
              <div className="flex items-center">
                <Button
                  onClick={handleSignOut}
                  size="sm"
                  variant="outline"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  <LogIn className="w-4 h-4 mr-2 rotate-180" />
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Button for Non-Authenticated Users */}
      {!user && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-end">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 border-purple-500/30"
            >
              <Link to="/auth">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Power Parent Title */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <h1 className="text-5xl md:text-5xl font-bold text-center text-white mb-2">
          Power Parent
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full mb-4"></div>
        
        {/* Key Benefits Statement */}
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl md:text-2xl text-gray-300 font-semibold mb-2">
          Parenting is heavy. We take the mental load of schedules and practice off your plate.
          </p>
          <p className="text-lg text-gray-400">
              Built-in ABRSM practice plans and AI-powered school-event extraction.
          </p>
        </div>
      </div>

      {/* Hero Section - Original Side by Side Layout */}
      <header className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between">
        <div className="w-full md:w-1/2 mb-3 md:mb-0">
          <img
            src="/images/music_power_parent_scoial.png"
            alt="PowerParent Dashboard"
            className="w-full max-w-md mx-auto rounded-xl shadow-lg"
          />
        </div>
        <div className="w-full md:w-1/2 max-w-xl text-center md:text-left">
          <h2 className="hidden md:block text-3xl md:text-4xl font-bold mb-6 leading-tight text-white">
            Where Kids Thrive and Parents Breathe Easy
          </h2>
          <p className="hidden md:block text-lg text-gray-400 mb-8">
            Keep music practice {displayEvent(user) && 'and school schedules'} on track — without the mental load.
          </p>
          
          {/* Main CTA Buttons */}

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-6">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Link to="/music">
                <Music className="w-5 h-5 mr-2" />
                Music Practice
              </Link>
            </Button>
            
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Link to="/events">
                <CalendarDays className="w-5 h-5 mr-2" />
                📅 School Events
              </Link>
            </Button>
            
          </div>

          {/* Community Button */}
          <div className="mb-6">
            <Button
              size="lg"
              onClick={() => setShowCommunityModal(true)}
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white px-6 py-3 shadow-md hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Join our Community
            </Button>
          </div>
          

          {/* Quick Feature Highlights */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start text-sm">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              ABRSM Tracking
            </span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center">
              <Trophy className="w-3 h-3 mr-1" />
              Practice Streaks
            </span>
          </div>
        </div>
      </header>

      {/* Global Reach Section */}
      <GlobalReachMap />

      {/* Unified Features Tabs */}
      <section className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">          
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
          
            <TabsList className="grid w-full grid-cols-2 mb-12 h-16 bg-gray-100 p-2 rounded-xl shadow-sm">
              <TabsTrigger 
                value="music" 
                className="flex items-center justify-center gap-2 text-base font-semibold py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 transition-all"
              >
                <Music className="w-5 h-5" />
                <span className="hidden sm:inline">Music Practice</span>
                <span className="sm:hidden">Music</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="family" 
                className="flex items-center justify-center gap-2 text-base font-semibold py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 transition-all"
              >
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Family & Scheduling</span>
                <span className="sm:hidden">Events</span>
              </TabsTrigger>            
              
            </TabsList>
            
            <TabsContent value="family" className="space-y-8">
              <EventsContent theme="light" showHero={false} />
            </TabsContent>

            <TabsContent value="music" className="space-y-8">
              {/* Hero Section for Music */}
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 rounded-xl p-8 text-white">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold mb-4">All ABRSM Modules, One Dashboard</h3>
                  <p className="text-xl opacity-90">Simple tools to support your child's practice routine</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                    <div className="text-4xl mb-3">⚡</div>
                    <h4 className="font-bold text-lg mb-2">Kids Stay Motivated</h4>
                    <p className="text-sm opacity-90">Gamified progress tracking and milestone achievements</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                    <div className="text-4xl mb-3">🎓</div>
                    <h4 className="font-bold text-lg mb-2">Teachers Collaborate</h4>
                    <p className="text-sm opacity-90">Easy sharing of practice goals and progress updates</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                    <div className="text-4xl mb-3">👥</div>
                    <h4 className="font-bold text-lg mb-2">Parents Stay Informed</h4>
                    <p className="text-sm opacity-90">Complete transparency into what your child needs to practice</p>
                  </div>
                </div>
              </div>

              {/* Three Key Value Props - Compact */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-center text-gray-800">Why This Approach Works</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Kids */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
                    <div className="bg-purple-500 p-3 rounded-full w-fit mx-auto mb-4">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-purple-800 mb-3">Kids</h4>
                    <ul className="text-sm text-gray-700 space-y-2 text-center">
                      <li>• See daily practice streaks</li>
                      <li>• Track milestone progress</li>
                      <li>• Own their practice journey</li>
                      <li>• Build consistent habits</li>
                    </ul>
                  </div>

                  {/* Teachers */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <div className="bg-green-500 p-3 rounded-full w-fit mx-auto mb-4">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-green-800 mb-3">Teachers</h4>
                    <ul className="text-sm text-gray-700 space-y-2 text-center">
                      <li>• View home practice reports</li>
                      <li>• Share lesson priorities</li>
                      <li>• Monitor student progress</li>
                      <li>• Focus lesson time better</li>
                    </ul>
                  </div>

                  {/* Parents */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <div className="bg-blue-500 p-3 rounded-full w-fit mx-auto mb-4">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-blue-800 mb-3">Parents</h4>
                    <ul className="text-sm text-gray-700 space-y-2 text-center">
                      <li>• Know what to practice today</li>
                      <li>• Track completion status</li>
                      <li>• Support without micromanaging</li>
                      <li>• Stay informed on progress</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Current Coverage & Expansion Plans */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
                <h4 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  🎼 ABRSM Piano Support
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Current Coverage */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Currently Available
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Piano className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">ABRSM Piano</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">LIVE</span>
                      </div>
                      <div className="text-sm text-gray-600 ml-8">
                        • Syllabus coverage: Initial Grade through Grade 8<br/>
                        • Scales, pieces, sight-reading, aural, theory<br/>
                        • Post-Grade 8 custom repertoire tracking
                      </div>
                    </div>
                  </div>

                  {/* Expansion Plans */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      Coming Soon
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Music className="w-5 h-5 text-purple-500" />
                        <span className="font-medium">More Exam Boards</span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">PLANNED</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Guitar className="w-5 h-5 text-orange-500" />
                        <span className="font-medium">Additional Instruments</span>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">PLANNED</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Diploma & Professional</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ROADMAP</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mic className="w-5 h-5 text-pink-500" />
                        <span className="font-medium">Voice & Performance</span>
                        <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">ROADMAP</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Journey Stages */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                    Supporting Your Complete Musical Journey
                  </h5>
                  <div className="flex items-center justify-between text-center">
                    <div className="flex-1">
                      <div className="text-2xl mb-2">🌱</div>
                      <div className="font-medium text-gray-800">Beginner</div>
                      <div className="text-xs text-gray-600">Initial - Grade 3</div>
                    </div>
                    <div className="w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-300 mx-2"></div>
                    <div className="flex-1">
                      <div className="text-2xl mb-2">🚀</div>
                      <div className="font-medium text-gray-800">Intermediate</div>
                      <div className="text-xs text-gray-600">Grades 4-6</div>
                    </div>
                    <div className="w-8 h-1 bg-gradient-to-r from-purple-300 to-pink-300 mx-2"></div>
                    <div className="flex-1">
                      <div className="text-2xl mb-2">⭐</div>
                      <div className="font-medium text-gray-800">Advanced</div>
                      <div className="text-xs text-gray-600">Grades 7-8</div>
                    </div>
                    <div className="w-8 h-1 bg-gradient-to-r from-pink-300 to-yellow-300 mx-2"></div>
                    <div className="flex-1">
                      <div className="text-2xl mb-2">🎓</div>
                      <div className="font-medium text-gray-800">Professional</div>
                      <div className="text-xs text-gray-600">Diploma & Beyond</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-center text-white">
                <h4 className="text-2xl font-bold mb-4">Try PowerParent Music</h4>
                <p className="text-lg opacity-90 mb-6">
                  Early access to simple music practice tracking for ABRSM Piano students.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg shadow-lg"
                  >
                    <Link to="/music">
                      <Music className="w-5 h-5 mr-2" />
                      Start Tracking
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Founder Story & Psychological Insight */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 rounded-xl">
                <div className="px-6">
                  <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-8">From Practice Battles to Practice Joy</h2>
                    
                    <div className="bg-white rounded-xl p-8 shadow-lg border border-purple-100 mb-8">
                      <div className="flex items-center justify-center mb-6">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full">
                          <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      <blockquote className="text-xl text-gray-700 italic mb-6 leading-relaxed">
                        "Kids develop lasting discipline when they have autonomy — when they truly own the journey."
                      </blockquote>
                      <p className="text-gray-600 font-medium">— Self-Determination Theory</p>
                    </div>

                    {/* Famous Quotes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                        <blockquote className="text-gray-700 italic mb-4 text-sm leading-relaxed">
                          "Tell me and I forget, teach me and I may remember, involve me and I learn."
                        </blockquote>
                        <p className="text-gray-600 font-medium text-sm">— Benjamin Franklin</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                        <blockquote className="text-gray-700 italic mb-4 text-sm leading-relaxed">
                          "Children are not things to be molded, but people to be unfolded."
                        </blockquote>
                        <p className="text-gray-600 font-medium text-sm">— Jess Lair</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                        <blockquote className="text-gray-700 italic mb-4 text-sm leading-relaxed">
                          "The greatest gifts you can give your children are the roots of responsibility and the wings of independence."
                        </blockquote>
                        <p className="text-gray-600 font-medium text-sm">— Denis Waitley</p>
                      </div>
                    </div>

                    <div className="prose prose-lg mx-auto text-gray-700 text-left">
                      <p className="mb-6">
                        My daughter recently passed Grade 3, but pushing her to practice had always felt heavy on me. 
                        I realized it wasn't sustainable and started looking for piano practice tracking tools — but couldn't find any that truly worked.
                      </p>
                      
                      <p className="mb-6">
                        So I built PowerParent Music based on this psychological principle. 
                        Now she tracks her own practice, sees her streaks, and shares milestones with pride. 
                        <em>Pride has replaced procrastination.</em>
                      </p>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 my-8">
                        <p className="text-center text-purple-800 font-medium mb-4">
                          🎹 <strong>Free for Early Sign-ups</strong> 🎹
                        </p>
                        <p className="text-center text-gray-700">
                          I'm partnering with teachers and parents to make this useful across all grades.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                          asChild
                          size="lg"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                          <Link to="/music">
                            <Music className="w-5 h-5 mr-2" />
                            Start Tracking
                          </Link>
                        </Button>

                        <Button
                          size="lg"
                          onClick={() => setShowCommunityModal(true)}
                          className="bg-[#1877F2] hover:bg-[#166FE5] text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Join our Community
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </section>

      {/* Community Modal */}
      {showCommunityModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCommunityModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between bg-[#1877F2] text-white">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Join Our Music Parents Community</h2>
              </div>
              <button
                onClick={() => setShowCommunityModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="text-center mb-6">
                <p className="text-gray-700 text-lg mb-4">
                  Connect with other music parents, share tips, ask questions, and support each other on the ABRSM journey!
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 font-medium mb-2">🎹 What you'll find in our community:</p>
                  <ul className="text-left text-sm text-gray-700 space-y-2">
                    <li>✓ Practice tips and motivation strategies</li>
                    <li>✓ Grade exam experiences and advice</li>
                    <li>✓ Teacher recommendations</li>
                    <li>✓ Support from parents at all stages</li>
                    <li>✓ Early access to new PowerParent features</li>
                  </ul>
                </div>
              </div>

              {/* Call to Action */}
              <div className="flex flex-col gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    Join our music parents community!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Connect with other parents navigating the ABRSM journey. Share experiences, celebrate milestones, and support each other through the ups and downs of music practice.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Free to join</span>
                    <span className="mx-2">•</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Public group</span>
                    <span className="mx-2">•</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Active community</span>
                  </div>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="bg-[#1877F2] hover:bg-[#166FE5] text-white w-full py-6 text-lg"
                >
                  <a
                    href="https://www.facebook.com/groups/872178252133598"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Join the Group on Facebook
                  </a>
                </Button>

                <p className="text-sm text-gray-500 text-center">
                  Opens in a new tab • No approval needed
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}