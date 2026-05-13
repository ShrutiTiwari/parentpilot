import React from 'react';
import { MultiSelect, MultiSelectOption } from './MultiSelect';
import { getYearGroupSelectOptions } from '@/utils/yearGroupUtils';
import { cn } from '@/lib/utils';

interface YearGroupMultiSelectProps {
  eventType: 'personal' | 'school';
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxSelections?: number;
}

export function YearGroupMultiSelect({
  eventType,
  value = [],
  onChange,
  placeholder = "Select year groups...",
  className,
  disabled = false,
  maxSelections
}: YearGroupMultiSelectProps) {
  // Get the appropriate year group options based on event type
  const context = eventType === 'personal' ? 'personal' : 'extended';
  const options: MultiSelectOption[] = getYearGroupSelectOptions(context);

  return (
    <MultiSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn("min-w-[200px] w-full", className)}
      disabled={disabled}
      maxSelections={maxSelections}
    />
  );
} 