
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';

interface ThemedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const ThemedButton = React.forwardRef<HTMLButtonElement, ThemedButtonProps>(({ 
  children, 
  variant = 'primary',
  size = 'default',
  onClick,
  disabled,
  className,
  type = 'button'
}, ref) => {
  const { currentTheme } = useAgeTheme();

  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: currentTheme.colors.primary,
          borderColor: currentTheme.colors.primary,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          backgroundColor: currentTheme.colors.secondary,
          borderColor: currentTheme.colors.secondary,
          color: '#FFFFFF',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: currentTheme.colors.primary,
          color: currentTheme.colors.primary,
        };
      default:
        return {};
    }
  };

  const buttonClasses = cn(
    currentTheme.styles.buttonStyle,
    currentTheme.animations.transition,
    currentTheme.animations.hover,
    className
  );

  return (
    <Button
      ref={ref}
      className={buttonClasses}
      style={{
        ...getButtonStyles(),
        fontWeight: currentTheme.styles.fontWeight,
      }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      size={size}
    >
      {children}
    </Button>
  );
});

ThemedButton.displayName = 'ThemedButton';
