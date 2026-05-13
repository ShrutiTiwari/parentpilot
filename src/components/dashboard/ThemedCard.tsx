
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';

interface ThemedCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({ 
  children, 
  className, 
  title, 
  onClick,
  style 
}) => {
  const { currentTheme } = useAgeTheme();

  const cardStyle = {
    backgroundColor: currentTheme.colors.cardBackground,
    borderColor: currentTheme.colors.border,
    borderRadius: currentTheme.styles.borderRadius,
    boxShadow: currentTheme.styles.cardShadow,
    ...style,
  };

  return (
    <Card 
      className={cn(
        currentTheme.animations.transition,
        onClick && currentTheme.animations.hover,
        onClick && 'cursor-pointer',
        className
      )}
      style={cardStyle}
      onClick={onClick}
    >
      {title && (
        <CardHeader className="pb-3">
          <CardTitle 
            style={{ 
              color: currentTheme.colors.primary,
              fontWeight: currentTheme.styles.fontWeight 
            }}
          >
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? 'pt-0' : undefined}>
        {children}
      </CardContent>
    </Card>
  );
};
