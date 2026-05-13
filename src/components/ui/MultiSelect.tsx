import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxSelections?: number;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
  maxSelections
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(option.value)
  );

  const handleToggleOption = (optionValue: string) => {
    if (maxSelections && value.length >= maxSelections && !value.includes(optionValue)) {
      return; // Don't add if max selections reached
    }

    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    onChange(newValue);
  };

  const handleRemoveOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(option => value.includes(option.value));

  // Get the trigger width for dropdown positioning
  const triggerWidth = triggerRef.current?.offsetWidth || '100%';

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        ref={triggerRef}
        className={cn(
          "min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 min-h-[20px]">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveOption(option.value);
                  }}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && (
        <div 
          className="absolute z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
          style={{ 
            minWidth: `${triggerWidth}px`,
            width: 'max-content',
            maxWidth: 'calc(100vw - 2rem)'
          }}
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {maxSelections && (
            <div className="px-3 py-1 text-xs text-muted-foreground border-b">
              {value.length}/{maxSelections} selected
            </div>
          )}

          <div className="max-h-40 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => handleToggleOption(option.value)}
                >
                  <div className="mr-2 h-4 w-4 rounded border border-input flex items-center justify-center">
                    {value.includes(option.value) && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {searchTerm ? 'No options found' : 'No options available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 