import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Coffee, Zap, Star, ExternalLink, X, Gift } from 'lucide-react';

interface DonationCardProps {
  variant?: 'card' | 'banner' | 'modal';
  showCloseButton?: boolean;
  onClose?: () => void;
  className?: string;
}

export function DonationCard({ 
  variant = 'card', 
  showCloseButton = false, 
  onClose,
  className = '' 
}: DonationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const donationTiers = [
    {
      amount: 5,
      label: 'Coffee',
      icon: Coffee,
      description: 'Buy me a coffee',
      color: 'bg-amber-100 text-amber-800 hover:bg-amber-200'
    },
    {
      amount: 15,
      label: 'Supporter',
      icon: Heart,
      description: 'Show your support',
      color: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      popular: true
    },
    {
      amount: 30,
      label: 'Champion',
      icon: Star,
      description: 'Become a champion',
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
    },
    {
      amount: 50,
      label: 'Hero',
      icon: Zap,
      description: 'Be our hero',
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    }
  ];

  const handleDonation = async (amount: number) => {
    setIsProcessing(true);
    
    try {
      // Replace these with your actual Stripe Payment Link URLs
      const donationLinks: { [key: number]: string } = {
        5: 'YOUR_STRIPE_PAYMENT_LINK_FOR_5', // Replace with your $5 payment link
        15: 'YOUR_STRIPE_PAYMENT_LINK_FOR_15', // Replace with your $15 payment link  
        30: 'YOUR_STRIPE_PAYMENT_LINK_FOR_30', // Replace with your $30 payment link
        50: 'YOUR_STRIPE_PAYMENT_LINK_FOR_50' // Replace with your $50 payment link
      };
      
      // Open Stripe Payment Link in new tab
      const donationUrl = donationLinks[amount];
      if (donationUrl) {
        window.open(donationUrl, '_blank');
      } else {
        // Fallback: open general donation page
        alert(`Thank you for wanting to support with $${amount}! Please set up your Stripe Payment Links in DonationCard.tsx`);
      }
      
    } catch (error) {
      console.error('Donation error:', error);
      alert('Thank you for your interest in supporting the project! Donation system is being set up.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardContent = (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-gray-800">
          <Gift className="h-5 w-5 text-purple-600" />
          Support PowerParent
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          This project is independent and currently free to use. If you've found it helpful, 
          consider supporting its development.
        </p>
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
          <span>❤️ Made with love by an independent developer</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {donationTiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div key={tier.amount} className="relative">
              {tier.popular && (
                <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full z-10">
                  Popular
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={() => handleDonation(tier.amount)}
                disabled={isProcessing}
                className={`w-full h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 ${tier.color} border-2 hover:scale-105 hover:shadow-md`}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-bold text-lg">${tier.amount}</div>
                  <div className="text-xs opacity-80">{tier.description}</div>
                </div>
              </Button>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open('https://github.com/your-username/powerparent', '_blank')}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View project on GitHub
        </Button>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <div className="text-green-600 mt-0.5">🔒</div>
          <div>
            <strong>Secure & Transparent:</strong> Powered by Stripe. Your support helps maintain servers, 
            develop new features, and keep this tool free for families learning music.
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 ${className}`}>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="float-right text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {cardContent}
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={`bg-white p-6 rounded-xl shadow-2xl max-w-md w-full ${className}`}>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {cardContent}
      </div>
    );
  }

  return (
    <Card className={`bg-white/80 backdrop-blur-sm border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3">
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {cardContent}
      </CardContent>
    </Card>
  );
}

export default DonationCard;