import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SignInPrompt } from '@/components/ui/SignInPrompt';
import { PendingApprovals } from '@/components/sharing/PendingApprovals';
import { MyConnections } from '@/components/sharing/MyConnections';
import { useSharing } from '@/hooks/useSharing';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import SharingService from '@/services/sharingService';
import { parseUrlParams, navigateToSharingSubtab } from '@/utils/navigationUtils';

interface SharingTabProps {
  initialActiveSubTab?: string;
}

export function SharingTab({ initialActiveSubTab }: SharingTabProps) {
  const [userRole, setUserRole] = useState<string>('loading...');
  const [actualRole, setActualRole] = useState<string | null>(null);
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('myconnections');
  
  
  
  const sharing = useSharing();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUserRole();
  }, []);

  // Handle URL parameter changes
  useEffect(() => {
    const urlParams = parseUrlParams(location.pathname);
    if (urlParams.sharingTab) {
      setCurrentTab(urlParams.sharingTab);
    } else if (initialActiveSubTab) {
      setCurrentTab(initialActiveSubTab);
    }
  }, [location.pathname, initialActiveSubTab]);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole('Not logged in');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role_type, full_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserRole(`${profile.role_type || 'No role'} (${profile.full_name || user.email})`);
        setActualRole(profile.role_type);
      } else {
        setUserRole(`No profile (${user.email})`);
        setActualRole(null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('Error loading role');
    }
  };









  const handleTabChange = (newTab: string) => {
    setCurrentTab(newTab);
    navigateToSharingSubtab(navigate, newTab);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sign In Required Message for Non-authenticated Users */}
      {!user && (
        <SignInPrompt
          title="Sign In Required"
          message="You need to sign in to use sharing features. Create an account or sign in to connect with other parents, teachers, and family members."
          icon="🤝"
          variant="purple"
          size="md"
        />
      )}

      {/* Sharing Workflow Help Guide - Only show if user is signed in */}
      {user && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsHelpExpanded(!isHelpExpanded)}
          >
            <h4 className="text-sm font-semibold text-blue-900">📖 How Sharing Works - 3 Easy Steps</h4>
            <div className="text-blue-600 text-lg">
              {isHelpExpanded ? '−' : '+'}
            </div>
          </div>
          
          {isHelpExpanded && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-3">
              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</div>
                <span className="text-sm text-blue-800 font-medium">Connect Users</span>
                <p className="text-xs text-blue-700">Go to <strong>👥 Connect</strong> and click "Add New Connection" to search and connect with teachers, parents, or students</p>
              </div>
              <div className="hidden sm:flex items-center text-blue-400 text-xl">→</div>
              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</div>
                <span className="text-sm text-blue-800 font-medium">Approve Request</span>
                <p className="text-xs text-blue-700">Review and approve connection requests in <strong>📋 Pending Approvals</strong> tab. Once approved, you're connected!</p>
              </div>
              <div className="hidden sm:flex items-center text-blue-400 text-xl">→</div>
              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</div>
                <span className="text-sm text-blue-800 font-medium">Share Learner Progress</span>
                <p className="text-xs text-blue-700">In <strong>👥 Share Learners</strong>, use "Share with Connections" to share specific learner progress with your connected users</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Only show if user is signed in */}
      {user && (
        <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-1 sm:p-1">
            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
              <TabsList className="w-full h-auto sm:h-12 bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-200/50 flex flex-wrap sm:flex-nowrap">
                <TabsTrigger 
                  value="myconnections"
                  className="text-xs sm:text-sm font-semibold flex-1 min-w-0 py-2 px-1 sm:px-3 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-700 transition-all"
                >
                  <span className="flex flex-col sm:flex-row items-center gap-1">
                    <span className="flex items-center gap-1">
                      <span>👥</span>
                      <span>Connect</span>
                    </span>
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pendingapproval"
                  className="text-xs sm:text-sm font-semibold flex-1 min-w-0 py-2 px-1 sm:px-3 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-700 transition-all"
                >
                  <span className="flex flex-col sm:flex-row items-center gap-1">
                    <span className="flex items-center gap-1">
                      <span>📋</span>
                      <span className="hidden sm:inline">Pending Approvals</span>
                      <span className="sm:hidden">Pending</span>
                    </span>
                    {sharing.pendingRequests.length > 0 && (
                      <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {sharing.pendingRequests.length}
                      </span>
                    )}
                  </span>
                </TabsTrigger>
              </TabsList>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">                                 
                <div className="text-right">
                  <div className="text-xs text-gray-500">Logged in as: {userRole}</div>                  
                </div>
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => sharing.refreshData()}
                    className="text-xs px-2 py-1 h-7 hover:bg-gray-100"
                    disabled={sharing.loading}
                  >
                    <RefreshCw className={`h-3 w-3 ${sharing.loading ? 'animate-spin' : ''}`} />
                  </Button> 
              </div>
              </div>  
              <TabsContent value="myconnections" className="mt-4">
                <MyConnections />
              </TabsContent>

              <TabsContent value="pendingapproval" className="mt-4">
                <PendingApprovals />
              </TabsContent>

            </Tabs>
            
          </CardContent>
        </Card>
      )}

    </div>
  );
}

export default SharingTab;