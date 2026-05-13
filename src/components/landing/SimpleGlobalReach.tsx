import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Users, MapPin } from 'lucide-react';

export const SimpleGlobalReach: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-purple-600" />
            <h2 className="text-4xl font-bold text-gray-900">Global Reach</h2>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Trusted by families worldwide in their music learning journey
          </p>
          
          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6 text-purple-600" />
                <span className="text-3xl font-bold text-gray-900">500+</span>
              </div>
              <p className="text-gray-600 font-medium">Active Users</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Globe className="w-6 h-6 text-purple-600" />
                <span className="text-3xl font-bold text-gray-900">31</span>
              </div>
              <p className="text-gray-600 font-medium">Countries</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="w-6 h-6 text-purple-600" />
                <span className="text-3xl font-bold text-gray-900">2700+</span>
              </div>
              <p className="text-gray-600 font-medium">Cities</p>
            </div>
          </div>
        </div>

        {/* Top Countries */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-gray-800">
              PowerParent Community Worldwide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇬🇧</span>
                    <span className="font-semibold text-gray-800">United Kingdom</span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">64%</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>324 users</span>
                  <span>1.7K cities</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇺🇸</span>
                    <span className="font-semibold text-gray-800">United States</span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">15%</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>78 users</span>
                  <span>304 cities</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇲🇾</span>
                    <span className="font-semibold text-gray-800">Malaysia</span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">3%</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>14 users</span>
                  <span>123 cities</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇸🇬</span>
                    <span className="font-semibold text-gray-800">Singapore</span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">3%</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>14 users</span>
                  <span>35 cities</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇦🇺</span>
                    <span className="font-semibold text-gray-800">Australia</span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">2%</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>10 users</span>
                  <span>34 cities</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇩🇪</span>
                    <span className="font-semibold text-gray-800">Germany</span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">1%</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>7 users</span>
                  <span>28 cities</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">
                <span className="font-semibold">Plus 25+ more countries</span> including 
                🇨🇦🇫🇷🇭🇰🇮🇪🇮🇳 and others
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-600 mb-4">
            Join thousands of families worldwide who trust PowerParent for their music education journey
          </p>
          <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
            <span>🔒 Secure & Private</span>
            <span>🌍 Global Community</span>
            <span>🎵 Expert Approved</span>
            <span>⭐ 4.9/5 Rating</span>
          </div>
        </div>
      </div>
    </section>
  );
};