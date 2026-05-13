
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { MegaEvent } from '../../utils/eventUtils';
import { format } from 'date-fns';

interface MegaEventCardProps {
  megaEvent: MegaEvent;
}

export function MegaEventCard({ megaEvent }: MegaEventCardProps) {
  const startDate = new Date(megaEvent.startDate);
  const endDate = new Date(megaEvent.endDate);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <Card className="col-span-full bg-gradient-to-r from-[#D946EF]/10 to-[#8B5CF6]/10 border-[#D946EF]/20 hover:shadow-md transition-shadow backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#D946EF]" />
              <span className="text-[#D946EF] font-bold">{megaEvent.title}</span>
            </div>
            <span className="text-sm font-normal text-[#D946EF]">
              {duration} {duration === 1 ? 'day' : 'days'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-[#221F26]">
            {format(startDate, 'EEE, MMM d')} - {format(endDate, 'EEE, MMM d')}
          </div>
          <div className="flex flex-wrap gap-1">
            <div className="inline-block px-2 py-0.5 rounded-full text-xs bg-[#D946EF]/20 text-[#D946EF]">
              {Array.isArray(megaEvent.yearGroup) ? megaEvent.yearGroup.join(', ') : megaEvent.yearGroup}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
