import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Reusable SignInPrompt component for encouraging users to sign in
 * 
 * Usage examples:
 * 
 * // Basic usage
 * <SignInPrompt 
 *   title="Sign In Required" 
 *   message="Create an account to access this feature." 
 * />
 * 
 * // For sharing features
 * <SignInPrompt
 *   title="Sign In Required"
 *   message="You need to sign in to share learner progress with teachers and family."
 *   icon="🤝"
 *   variant="purple"
 * />
 * 
 * // For data persistence
 * <SignInPrompt
 *   title="Save Your Progress"
 *   message="Sign in to keep your data safe and access it anywhere."
 *   icon="💾"
 *   variant="blue"
 *   buttonText="Secure My Data"
 * />
 * 
 * // For practice data with custom handler
 * <SignInPrompt
 *   title="Great Progress!"
 *   message="You have 5 practice sessions. Sign in to save permanently."
 *   icon="🎹"
 *   variant="amber"
 *   onSignIn={() => openAuthModal()}
 * />
 */

interface SignInPromptProps {
  title: string;
  message: string;
  icon?: string;
  buttonText?: string;
  onSignIn?: () => void;
  variant?: 'default' | 'purple' | 'blue' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SignInPrompt({
  title,
  message,
  icon = '🔐',
  buttonText = 'Sign In / Sign Up',
  onSignIn,
  variant = 'default',
  size = 'md',
  className = ''
}: SignInPromptProps) {
  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      // Default auth flow - trigger auth modal or navigate to sign in
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/auth?returnTo=${encodeURIComponent(currentPath)}`;
    }
  };

  const variants = {
    default: 'bg-gray-50 border-gray-200',
    purple: 'bg-purple-50 border-purple-200',
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200'
  };

  const textColors = {
    default: 'text-gray-900',
    purple: 'text-purple-900',
    blue: 'text-blue-900',
    amber: 'text-amber-900'
  };

  const messageColors = {
    default: 'text-gray-800',
    purple: 'text-purple-800',
    blue: 'text-blue-800',
    amber: 'text-amber-800'
  };

  const buttonStyles = {
    default: 'bg-gray-600 hover:bg-gray-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    amber: 'bg-amber-600 hover:bg-amber-700'
  };

  const sizes = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className={`${variants[variant]} border rounded-lg ${sizes[size]} text-center ${className}`}>
      <h4 className={`${titleSizes[size]} font-semibold ${textColors[variant]} mb-2`}>
        {icon} {title}
      </h4>
      <p className={`text-sm ${messageColors[variant]} mb-3`}>
        {message}
      </p>
      <Button 
        variant="default" 
        size="sm"
        className={`${buttonStyles[variant]} text-white`}
        onClick={handleSignIn}
      >
        {buttonText}
      </Button>
    </div>
  );
}