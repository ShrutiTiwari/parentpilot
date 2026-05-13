import { supabase } from '../lib/supabase';
import { PracticeData, PracticeStats } from '../types/practiceData';

export interface SharedLearnerData {
  learner: {
    id: string;
    name: string;
    grade: number | null;
    instrument: string;
    createdAt: string;
  };
  practiceData: PracticeData;
  stats: PracticeStats;
  shared: boolean;
  accessedAt: string;
  meta: {
    version: string;
    source: string;
  };
}

export class PublicSharingService {
  /**
   * Get shared learner data by share token
   */
  static async getSharedLearnerData(shareToken: string): Promise<SharedLearnerData | null> {
    try {
      // Get learner by share token
      const { data: learner, error: learnerError } = await supabase
        .from('music_learners')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_shareable', true)
        .single();

      if (learnerError || !learner) {
        console.error('Learner not found or sharing disabled:', learnerError);
        return null;
      }

      // Get both old practice entries and new scale practice data
      const practiceData: PracticeData = {};

      // 1. Get non-scale practice entries (pieces, sight reading, etc.)
      const { data: practiceEntries, error: practiceError } = await supabase
        .from('practice_entries')
        .select('practice_key, days, streak')
        .eq('learner_id', learner.id)
        .not('practice_key', 'like', 'grade%_Diminished%');

      if (practiceError) {
        console.error('Error fetching practice entries:', practiceError);
      }

      // Convert practice entries to PracticeData format (non-scale items)
      practiceEntries?.forEach(entry => {
        practiceData[entry.practice_key] = {
          days: entry.days || {},
          streak: entry.streak || 0
        };
      });

      // 2. Get scale practice data using joint query (all time for sharing)
      console.log('🔍 PublicSharingService: Fetching scale practice data for learner:', learner.id);
      
      const { data: scalePracticeData, error: scaleError } = await supabase
        .from('scale_practice_daily')
        .select(`
          scale_id,
          practice_date,
          practiced,
          abrsm_scales (
            id,
            scale_name,
            category,
            grade
          )
        `)
        .eq('learner_id', learner.id)
        .order('scale_id')
        .order('practice_date');

      if (scaleError) {
        console.error('Error fetching scale practice data:', scaleError);
      }
      
      console.log('🔍 PublicSharingService: Scale practice data result:', {
        scalePracticeData: scalePracticeData?.length || 0,
        sampleRecord: scalePracticeData?.[0],
        hasAbrsmScales: scalePracticeData?.[0]?.abrsm_scales
      });

      // Convert scale practice data to PracticeData format with scale details
      const scaleDataByScale: Record<number, Record<string, boolean>> = {};
      const scaleDetails: Record<number, any> = {};
      
      scalePracticeData?.forEach(record => {
        const scaleId = record.scale_id;
        const dateStr = new Date(record.practice_date).toDateString();
        
        if (!scaleDataByScale[scaleId]) {
          scaleDataByScale[scaleId] = {};
          // Store scale details for this scale ID
          if (record.abrsm_scales) {
            console.log(`🔍 PublicSharingService: Found abrsm_scales for scale ${scaleId}:`, {
              rawData: record.abrsm_scales,
              isArray: Array.isArray(record.abrsm_scales),
              arrayLength: Array.isArray(record.abrsm_scales) ? record.abrsm_scales.length : 'N/A'
            });
            
            const scale = Array.isArray(record.abrsm_scales) 
              ? record.abrsm_scales[0] 
              : record.abrsm_scales;
            scaleDetails[scaleId] = scale;
            
            console.log(`🔍 PublicSharingService: Extracted scale details for ${scaleId}:`, scale);
          } else {
            console.log(`🔍 PublicSharingService: No abrsm_scales found for scale ${scaleId}`);
          }
        }
        
        scaleDataByScale[scaleId][dateStr] = record.practiced;
      });

      // Add scale practice data to practiceData with scale_${id} keys
      Object.entries(scaleDataByScale).forEach(([scaleId, days]) => {
        const practiceKey = `scale_${scaleId}`;
        const scaleDetail = scaleDetails[parseInt(scaleId)];
        
        console.log(`🔍 PublicSharingService: Processing scale ${scaleId}:`, {
          practiceKey,
          scaleDetail,
          hasScaleDetails: !!scaleDetail,
          scaleName: scaleDetail?.scale_name,
          category: scaleDetail?.category,
          grade: scaleDetail?.grade
        });
        
        practiceData[practiceKey] = {
          days,
          streak: this.calculateStreakFromDays(days),
          // Add scale details as metadata
          scaleDetails: scaleDetail ? {
            name: scaleDetail.scale_name,
            category: scaleDetail.category,
            grade: scaleDetail.grade
          } : null
        };
      });

      // Debug: Log final practiceData structure
      console.log('🔍 PublicSharingService: Final practiceData structure:', {
        totalEntries: Object.keys(practiceData).length,
        scaleEntries: Object.keys(practiceData).filter(key => key.startsWith('scale_')).length,
        sampleScaleEntry: Object.entries(practiceData).find(([key]) => key.startsWith('scale_')),
        allScaleKeys: Object.keys(practiceData).filter(key => key.startsWith('scale_'))
      });
      
      // Calculate stats
      const stats = this.calculatePracticeStats(practiceData);

      return {
        learner: {
          id: learner.id,
          name: learner.name,
          grade: learner.current_grade,
          instrument: learner.instrument,
          createdAt: learner.created_at
        },
        practiceData,
        stats,
        shared: true,
        accessedAt: new Date().toISOString(),
        meta: {
          version: '1.0',
          source: 'PowerParent Music Practice Tracker'
        }
      };

    } catch (error) {
      console.error('Error fetching shared learner data:', error);
      return null;
    }
  }

  /**
   * Calculate practice statistics
   */
  private static calculatePracticeStats(practiceData: PracticeData): PracticeStats {
    const totalDays = new Set<string>();
    const totalPracticeSessions = Object.values(practiceData).reduce((total, entry) => {
      const practiceDays = Object.keys(entry.days).filter(date => entry.days[date]);
      practiceDays.forEach(day => totalDays.add(day));
      return total + practiceDays.length;
    }, 0);

    // Calculate current streak
    const now = new Date();
    let currentStreak = 0;
    const sortedDates = Array.from(totalDays).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate additional stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = Object.values(practiceData).reduce((count, entry) => {
      return count + (entry.days[todayStr] ? 1 : 0);
    }, 0);

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisWeekCount = Object.values(practiceData).reduce((count, entry) => {
      return count + Object.keys(entry.days).filter(dateStr => {
        const practiceDate = new Date(dateStr);
        return practiceDate >= thisWeekStart;
      }).length;
    }, 0);

    const longestStreak = Math.max(...Object.values(practiceData).map(entry => entry.streak), 0);

    return {
      todayCount,
      longestStreak,
      currentStreak,
      totalDays: totalDays.size,
      thisWeekCount
    };
  }

  /**
   * Calculate current streak from practice days
   */
  private static calculateStreakFromDays(days: Record<string, boolean>): number {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      if (days[date.toDateString()]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
} 