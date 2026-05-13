import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { MUSIC_MODULES, POST_GRADE8_MODULES } from '@/constants/boards';
import { navigateToModule, navigateToGradeLearnerModule, getGradeAndLearnerFromUrl } from '@/utils/navigationUtils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { displayEvent } from '@/utils/visbilityControl';
import { useAuth } from '../contexts/AuthContext';
interface StickyFooterProps {
  currentValue?: string;
  isPostGrade8?: boolean;
  grade?: number;
  learnerId?: string;
}

export function StickyFooter({ currentValue, isPostGrade8, grade, learnerId }: StickyFooterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Extract grade and learner ID from URL if not provided as props
  const { urlGrade, urlLearnerId } = getGradeAndLearnerFromUrl(location.pathname);
  const currentGrade = grade ?? urlGrade;
  const currentLearnerId = learnerId ?? urlLearnerId;
  // Determine current value from URL if not provided
  const getCurrentValue = () => {
    if (currentValue) return currentValue;
    
    const path = location.pathname;
    // Post Grade 8 tabs
    if (path.includes('/repertoire')) return POST_GRADE8_MODULES.REPERTOIRE;
    if (path.includes('/goals')) return POST_GRADE8_MODULES.GOALS;
    if (path.includes('/notes')) return POST_GRADE8_MODULES.NOTES;
    if (path.includes('/stats')) return POST_GRADE8_MODULES.STATS;
    // Regular grade tabs
    if (path.includes('/scales')) return MUSIC_MODULES.SCALES;
    if (path.includes('/pieces')) return MUSIC_MODULES.PIECES;
    if (path.includes('/sightreading') || path.includes('/sight-reading')) return MUSIC_MODULES.SIGHT_READING;
    if (path.includes('/aural')) return MUSIC_MODULES.AURAL;
    if (path.includes('/theory')) return MUSIC_MODULES.THEORY;
    if (path.includes('/stats')) return MUSIC_MODULES.STATS;
    
    // Default to pieces for regular grades or repertoire for post grade 8
    return isPostGrade8 ? POST_GRADE8_MODULES.REPERTOIRE : MUSIC_MODULES.PIECES;
  };

  // Check if we're in post grade 8 mode from URL
  const getIsPostGrade8 = () => {
    if (isPostGrade8 !== undefined) return isPostGrade8;
    return location.pathname.includes('/post-grade-8');
  };

  // Function to scroll to section content area
  const scrollToSectionContent = (sectionValue: string, delay = 150) => {
    setTimeout(() => {
      // First try to find the specific section based on the tab value
      let targetElement = null;
      
      // Priority 1: Look for the specific section content with matching data attribute
      const specificSection = document.querySelector(`[data-section-content="${sectionValue}"]`);
      if (specificSection) {
        targetElement = specificSection;
      }
      
      // Priority 2: Look for visible tab panels or section content areas
      if (!targetElement) {
        const targets = [
          '[role="tabpanel"]:not([hidden])', // Visible ARIA tab panels
          '[data-section-content]', // Any section content markers
          '.space-y-6.mt-6', // Specific combination used in sections
          '.section-content', // Common class name for section content
          'main', // Main content area
          '.max-w-6xl' // Common max width container
        ];
        
        // Try to find the best scroll target
        for (const selector of targets) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            // Get the first visible element that's not the sticky footer
            for (const element of elements as unknown as HTMLElement[]) {
              const rect = element.getBoundingClientRect();
              const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
              const isNotFooter = !element.closest('[data-sticky-footer]') && 
                                 !element.classList.contains('fixed') &&
                                 !element.style.position?.includes('fixed');
              
              if (isVisible && isNotFooter) {
                targetElement = element;
                break;
              }
            }
            if (targetElement) break;
          }
        }
      }
      
      if (targetElement) {
        // Scroll to the section with some offset for header/navigation
        const rect = targetElement.getBoundingClientRect();
        const offset = 100; // Offset for any fixed headers or navigation
        const targetPosition = window.pageYOffset + rect.top - offset;
        
        window.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth'
        });
        
        console.log(`🎯 Scrolled to ${sectionValue} section:`, targetElement);
      } else {
        // Fallback: scroll to a reasonable position from top (not absolute top)
        window.scrollTo({ top: 120, behavior: 'smooth' });
        console.log(`⚠️ No specific section found for ${sectionValue}, using fallback scroll`);
      }
    }, delay);
  };

  // Music sub-navigation handler
  const handleMusicSubTabChange = (value: string) => {
    const currentIsPostGrade8 = getIsPostGrade8();
    const currentPath = location.pathname;
    
    // Determine if we're navigating to a different route or staying on the same page
    let targetPath = '';
    
    // Post Grade 8 navigation
    if (currentIsPostGrade8 || (value === POST_GRADE8_MODULES.REPERTOIRE || value === POST_GRADE8_MODULES.GOALS || value === POST_GRADE8_MODULES.NOTES)) {
      switch (value) {
        case POST_GRADE8_MODULES.REPERTOIRE:
          targetPath = '/music/abrsm/post-grade-8/repertoire';
          navigate(targetPath);
          break;
        case POST_GRADE8_MODULES.GOALS:
          targetPath = '/music/abrsm/post-grade-8/goals';
          navigate(targetPath);
          break;
        case POST_GRADE8_MODULES.NOTES:
          targetPath = '/music/abrsm/post-grade-8/notes';
          navigate(targetPath);
          break;
        case MUSIC_MODULES.STATS:
        case POST_GRADE8_MODULES.STATS:
          targetPath = '/music/abrsm/post-grade-8/stats';
          navigate(targetPath);
          break;
        default:
          break;
      }
    } else {
      // Regular grade navigation
      // Use navigateToGradeLearnerModule if we have both grade and learnerId
      if (currentGrade !== undefined && currentLearnerId) {
        switch (value) {
          case MUSIC_MODULES.SCALES:
            navigateToGradeLearnerModule(navigate, currentGrade, currentLearnerId, 'scales');
            break;
          case MUSIC_MODULES.PIECES:
            navigateToGradeLearnerModule(navigate, currentGrade, currentLearnerId, 'pieces');
            break;
          case MUSIC_MODULES.SIGHT_READING:
            navigateToGradeLearnerModule(navigate, currentGrade, currentLearnerId, 'sightreading');
            break;
          case MUSIC_MODULES.AURAL:
            navigateToGradeLearnerModule(navigate, currentGrade, currentLearnerId, 'aural');
            break;
          case MUSIC_MODULES.THEORY:
            navigateToGradeLearnerModule(navigate, currentGrade, currentLearnerId, 'theory');
            break;
          case MUSIC_MODULES.STATS:
            navigateToGradeLearnerModule(navigate, currentGrade, currentLearnerId, 'stats');
            break;
          default:
            break;
        }
      } else {
        // Fallback to original navigation if grade or learnerId is not available
        switch (value) {
          case MUSIC_MODULES.SCALES:
            navigateToModule(navigate, currentPath, MUSIC_MODULES.SCALES);
            break;
          case MUSIC_MODULES.PIECES:
            navigateToModule(navigate, currentPath, MUSIC_MODULES.PIECES);
            break;
          case MUSIC_MODULES.SIGHT_READING:
            navigateToModule(navigate, currentPath, MUSIC_MODULES.SIGHT_READING);
            break;
          case MUSIC_MODULES.AURAL:
            navigateToModule(navigate, currentPath, MUSIC_MODULES.AURAL);
            break;
          case MUSIC_MODULES.THEORY:
            navigateToModule(navigate, currentPath, MUSIC_MODULES.THEORY);
            break;
          case MUSIC_MODULES.STATS:
            navigateToModule(navigate, currentPath, MUSIC_MODULES.STATS);
            break;
          default:
            break;
        }
      }
    }
    
    // Check if we're staying on the same base route (e.g., Dashboard with different tabs)
    const isStayingOnSamePage = currentPath === targetPath || 
                                (currentPath.includes('/music') && !targetPath) ||
                                (currentPath.includes('/music') && currentPath.includes('/grade/') && targetPath.includes('/music'));
    
    if (isStayingOnSamePage) {
      // We're switching tabs within the same page - scroll to section content
      scrollToSectionContent(value, 100);
    } else {
      // We're navigating to a different page - scroll to section content after navigation
      scrollToSectionContent(value, 200);
    }
  };

  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-[9999]" data-sticky-footer>
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black shadow-2xl border-t border-gray-600">
        <Tabs value={getCurrentValue()} onValueChange={handleMusicSubTabChange} className="w-full">
          <TabsList className="w-full h-16 bg-transparent p-0 m-0 rounded-none border-0 shadow-none overflow-hidden">
            {getIsPostGrade8() ? (
              // Post Grade 8 tabs
              <>
                <TabsTrigger 
                  value="repertoire" 
                  className="flex-1 h-full text-xs sm:text-xs font-bold border-0 rounded-none bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-purple-700 data-[state=active]:font-bold transition-all duration-200 hover:bg-white/10 px-1"
                  style={{ color: '#ffffff' }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1" style={{ color: '#ffffff' }}>
                    <span className="text-sm sm:text-lg bg-white/20 rounded-full p-0.5 sm:p-1 leading-none" style={{ filter: 'brightness(1.3) contrast(1.1)' }}>🎹</span>
                    <span style={{ color: '#ffffff' }} className="hidden sm:inline">Repertoire</span>
                    <span style={{ color: '#ffffff' }} className="sm:hidden">Repo</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="goals" 
                  className="flex-1 h-full text-xs sm:text-xs font-bold border-0 rounded-none bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-purple-700 data-[state=active]:font-bold transition-all duration-200 hover:bg-white/10 px-1"
                  style={{ color: '#ffffff' }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1" style={{ color: '#ffffff' }}>
                    <span className="text-sm sm:text-lg bg-white/20 rounded-full p-0.5 sm:p-1 leading-none" style={{ filter: 'brightness(1.3) contrast(1.1)' }}>🎯</span>
                    <span style={{ color: '#ffffff' }}>Goals</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="flex-1 h-full text-xs sm:text-xs font-bold border-0 rounded-none bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-purple-700 data-[state=active]:font-bold transition-all duration-200 hover:bg-white/10 px-1"
                  style={{ color: '#ffffff' }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1" style={{ color: '#ffffff' }}>
                    <span className="text-sm sm:text-lg bg-white/20 rounded-full p-0.5 sm:p-1 leading-none" style={{ filter: 'brightness(1.3) contrast(1.1)' }}>📝</span>
                    <span style={{ color: '#ffffff' }}>Notes</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="flex-1 h-full text-xs sm:text-xs font-bold border-0 rounded-none bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-purple-700 data-[state=active]:font-bold transition-all duration-200 hover:bg-white/10 px-1"
                  style={{ color: '#ffffff' }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1" style={{ color: '#ffffff' }}>
                    <span className="text-sm sm:text-lg bg-white/20 rounded-full p-0.5 sm:p-1 leading-none" style={{ filter: 'brightness(1.3) contrast(1.1)' }}>📈</span>
                    <span style={{ color: '#ffffff' }}>Stats</span>
                  </div>
                </TabsTrigger>
              </>
            ) : (
              // Regular grade tabs
              <>
                <TabsTrigger 
                  value="scales" 
                  className="flex-1 h-full text-xs sm:text-xs font-bold border-0 rounded-none bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-purple-700 data-[state=active]:font-bold transition-all duration-200 hover:bg-white/10 px-1"
                  style={{ color: '#ffffff' }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1" style={{ color: '#ffffff' }}>
                    <span className="text-sm sm:text-lg bg-white/20 rounded-full p-0.5 sm:p-1 leading-none" style={{ filter: 'brightness(1.3) contrast(1.1)' }}>🎼</span>
                    <span style={{ color: '#ffffff' }}>Scales</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="pieces" 
                  className="flex-1 h-full text-xs sm:text-xs font-bold border-0 rounded-none bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-purple-700 data-[state=active]:font-bold transition-all duration-200 hover:bg-white/10 px-1"
                  style={{ color: '#ffffff' }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1" style={{ color: '#ffffff' }}>
                    <span className="text-sm sm:text-lg bg-white/20 rounded-full p-0.5 sm:p-1 leading-none" style={{ filter: 'brightness(1.3) contrast(1.1)' }}>🎵</span>
                    <span style={{ color: '#ffffff' }}>Pieces</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="sightreading" 
                  className="flex-1 h-full text-xs sm:text-xs font-bold border-0 rounded-none bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-purple-700 data-[state=active]:font-bold transition-all duration-200 hover:bg-white/10 px-1"
                  style={{ color: '#ffffff' }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1" style={{ color: '#ffffff' }}>
                    <span className="text-sm sm:text-lg bg-white/20 rounded-full p-0.5 sm:p-1 leading-none" style={{ filter: 'brightness(1.3) contrast(1.1)' }}>👀</span>
                    <span style={{ color: '#ffffff' }} className="hidden sm:inline">Sight-Reading</span>
                    <span style={{ color: '#ffffff' }} className="sm:hidden">Sight</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="aural" 
                  className="flex-1 h-full text-xs sm:text-xs font-bold border-0 rounded-none bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-purple-700 data-[state=active]:font-bold transition-all duration-200 hover:bg-white/10 px-1"
                  style={{ color: '#ffffff' }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1" style={{ color: '#ffffff' }}>
                    <span className="text-sm sm:text-lg bg-white/20 rounded-full p-0.5 sm:p-1 leading-none" style={{ filter: 'brightness(1.3) contrast(1.1)' }}>👂</span>
                    <span style={{ color: '#ffffff' }}>Aural</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="theory" 
                  className="flex-1 h-full text-xs sm:text-xs font-bold border-0 rounded-none bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-purple-700 data-[state=active]:font-bold transition-all duration-200 hover:bg-white/10 px-1"
                  style={{ color: '#ffffff' }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1" style={{ color: '#ffffff' }}>
                    <span className="text-sm sm:text-lg bg-white/20 rounded-full p-0.5 sm:p-1 leading-none" style={{ filter: 'brightness(1.3) contrast(1.1)' }}>📖</span>
                    <span style={{ color: '#ffffff' }}>Theory</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="flex-1 h-full text-xs font-bold border-0 rounded-none bg-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-purple-700 data-[state=active]:font-bold transition-all duration-200 hover:bg-white/10"
                  style={{ color: '#ffffff' }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1" style={{ color: '#ffffff' }}>
                    <span className="text-sm sm:text-lg bg-white/20 rounded-full p-0.5 sm:p-1 leading-none" style={{ filter: 'brightness(1.3) contrast(1.1)' }}>📈</span>
                    <span style={{ color: '#ffffff' }}>Stats</span>
                  </div>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </div>
    </div>,
    document.body
  );
}

export default StickyFooter;