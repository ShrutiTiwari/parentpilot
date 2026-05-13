import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Bell, Clock, Star, TrendingUp, School, Music, Trophy, ChevronRight, Sparkles, CheckCircle, Shield, Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IntegratedSchoolsRoller } from '../shared/IntegratedSchoolsRoller';
import { FestivalEventCard } from './FestivalEventCard';
import { Event } from '../../utils/dateGrouping';

interface UnauthenticatedDashboardProps {
  onSignUp: () => void;
  onSignIn: () => void;
  className?: string;
}

// Sample events to showcase
const sampleEvents: Event[] = [
  {
    id: 'sample-1',
    title: 'Christmas Concert',
    date: '2025-12-15',
    time_start: '18:00:00',
    time_end: '20:00:00',
    category: 'event',
    venue: 'School Hall',
    event_type: 'school',
    visibility: 'public',
    year_group: 'All',
    year_groups: ['All'],
    school_id: 'demo',
    created_by_user_id: null,
    todos: []
  },
  {
    id: 'sample-2',
    title: 'Summer Holiday Starts',
    date: '2025-07-22',
    time_start: '00:00:00',
    time_end: '23:59:59',
    category: 'holiday',
    venue: null,
    event_type: 'school',
    visibility: 'public',
    year_group: 'All',
    year_groups: ['All'],
    school_id: 'demo',
    created_by_user_id: null,
    todos: []
  },
  {
    id: 'sample-3',
    title: 'Parent-Teacher Conference',
    date: '2025-02-10',
    time_start: '15:30:00',
    time_end: '17:30:00',
    category: 'meeting',
    venue: 'Various Classrooms',
    event_type: 'school',
    visibility: 'private',
    year_group: 'Year 5',
    year_groups: ['Year 5'],
    school_id: 'demo',
    created_by_user_id: null,
    todos: []
  },
  {
    id: 'sample-4',
    title: 'Sports Day',
    date: '2025-06-15',
    time_start: '09:00:00',
    time_end: '15:00:00',
    category: 'sports',
    venue: 'School Field',
    event_type: 'school',
    visibility: 'public',
    year_group: 'All',
    year_groups: ['All'],
    school_id: 'demo',
    created_by_user_id: null,
    todos: []
  }
];

// Features showcase
const features = [
  {
    icon: Calendar,
    title: 'Unified Calendar',
    description: 'School events, personal appointments, and family activities all in one place',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    icon: School,
    title: 'School Integration',
    description: 'Automatic sync with your school\'s calendar - never miss an event',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    icon: Music,
    title: 'Music Practice',
    description: 'Track practice, prepare for exams, and monitor progress',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Get notified about upcoming events, deadlines, and important dates',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    icon: Users,
    title: 'Family Sharing',
    description: 'Share calendars with family members and stay synchronized',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    icon: Trophy,
    title: 'Achievement Tracking',
    description: 'Celebrate milestones and track your child\'s accomplishments',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  }
];

// Benefits for different users
const benefits = {
  parents: [
    { icon: CheckCircle, text: 'Never miss a school event or deadline' },
    { icon: Clock, text: 'Save 5+ hours per week on organization' },
    { icon: Heart, text: 'Reduce stress with automated reminders' },
    { icon: Users, text: 'Coordinate with family members effortlessly' }
  ],
  students: [
    { icon: Star, text: 'Track homework and assignments easily' },
    { icon: Music, text: 'Practice music with guided exercises' },
    { icon: Trophy, text: 'Earn badges and celebrate achievements' },
    { icon: TrendingUp, text: 'Monitor progress and improve consistently' }
  ],
  schools: [
    { icon: Shield, text: 'Secure and private communication' },
    { icon: Zap, text: 'Instant updates to all parents' },
    { icon: Users, text: 'Better parent engagement' },
    { icon: CheckCircle, text: 'Reduced admin workload' }
  ]
};

export function UnauthenticatedDashboard({ onSignUp, onSignIn, className }: UnauthenticatedDashboardProps) {
  const [selectedBenefit, setSelectedBenefit] = useState<'parents' | 'students' | 'schools'>('parents');

  return (
    <div className={cn("space-y-8", className)}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Welcome to PowerParent</h1>
          </div>
          <p className="text-lg mb-6 text-white/90 max-w-2xl">
            The ultimate family organization tool that brings together school events, personal calendars,
            music practice, and family activities - all in one powerful platform.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={onSignUp}
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
            >
              Start Free Trial
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={onSignIn}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 left-1/3 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Live Demo Section */}
      <div className="space-y-4">
        <div className="text-center">
          <Badge className="mb-2">Live Demo</Badge>
          <h2 className="text-2xl font-bold text-gray-900">See How Events Look</h2>
          <p className="text-gray-600 mt-2">Beautiful, themed event cards that make organization delightful</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sampleEvents.map((event) => (
            <FestivalEventCard key={event.id} event={event} />
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Everything You Need</h2>
          <p className="text-gray-600 mt-2">Powerful features designed for modern families</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", feature.bgColor)}>
                    <feature.icon className={cn("h-6 w-6", feature.color)} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Who Benefits?</h2>
          <p className="text-gray-600 mt-2">PowerParent works for everyone in the family ecosystem</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex gap-2">
              <Button
                variant={selectedBenefit === 'parents' ? 'default' : 'outline'}
                onClick={() => setSelectedBenefit('parents')}
                className="flex-1"
              >
                👨‍👩‍👧‍👦 Parents
              </Button>
              <Button
                variant={selectedBenefit === 'students' ? 'default' : 'outline'}
                onClick={() => setSelectedBenefit('students')}
                className="flex-1"
              >
                🎓 Students
              </Button>
              <Button
                variant={selectedBenefit === 'schools' ? 'default' : 'outline'}
                onClick={() => setSelectedBenefit('schools')}
                className="flex-1"
              >
                🏫 Schools
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits[selectedBenefit].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <benefit.icon className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">{benefit.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrated Schools */}
      <IntegratedSchoolsRoller variant="dashboard" />

      {/* Statistics */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">10K+</div>
            <div className="text-sm text-gray-600">Active Families</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">50K+</div>
            <div className="text-sm text-gray-600">Events Managed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">4.9★</div>
            <div className="text-sm text-gray-600">User Rating</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
        <CardContent className="text-center py-8">
          <h3 className="text-2xl font-bold mb-3">Ready to Get Organized?</h3>
          <p className="mb-6 text-white/90">
            Join thousands of families who've transformed their daily routine
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={onSignUp}
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              Start Your Free Trial
            </Button>
            <Button
              onClick={onSignIn}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </div>
          <p className="text-sm text-white/70 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </CardContent>
      </Card>
    </div>
  );
}