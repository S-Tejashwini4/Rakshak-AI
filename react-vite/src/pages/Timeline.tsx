import { Clock, CheckCircle, AlertCircle, FileText, Camera, Video, Navigation, Shield, User, Database, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTimelineStore } from '../store/timelineStore';
import { useCaseStore } from '../store/caseStore';
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CASE_MASTERS } from '../utils/mockData';

const ICON_MAP: Record<string, any> = {
  'FileText': FileText,
  'Video': Video,
  'AlertCircle': AlertCircle,
  'Camera': Camera,
  'CheckCircle': CheckCircle,
  'Shield': Shield,
  'User': User,
  'Database': Database
};

const Timeline = () => {
  const allEvents = useTimelineStore(state => state.events);
  const { cases } = useCaseStore();
  const { user, role } = useAuthStore();
  const location = useLocation();
  
  // Get unique case IDs from both timeline events and active cases
  const uniqueCases = useMemo(() => {
    let relevantCases = cases;
    if (role !== 'Super Admin' && role !== 'Supervisor' && role !== 'Desk Officer') {
      relevantCases = cases.filter((c: any) => c.assignee && user?.name && c.assignee.toLowerCase().includes(user.name.toLowerCase().replace('officer ', '').trim()));
    }
    const caseIds = new Set(allEvents.filter(e => relevantCases.some(c => c.id === e.caseId)).map(e => e.caseId));
    relevantCases.forEach((c: any) => caseIds.add(c.id));
    return Array.from(caseIds).sort();
  }, [allEvents, cases, user, role]);
  
  const queryCaseId = new URLSearchParams(location.search).get('caseId');
  const [selectedCaseId, setSelectedCaseId] = useState(queryCaseId || uniqueCases[0] || '104430006202600001');
  
  useEffect(() => {
    if (queryCaseId && uniqueCases.includes(queryCaseId)) {
      setSelectedCaseId(queryCaseId);
    } else if (uniqueCases.length > 0 && !uniqueCases.includes(selectedCaseId) && selectedCaseId !== 'all') {
      setSelectedCaseId(uniqueCases[0]);
    }
  }, [queryCaseId, uniqueCases, selectedCaseId]);

  const filteredEvents = useMemo(() => {
    if (selectedCaseId === 'all') return allEvents;
    return allEvents.filter(e => e.caseId === selectedCaseId);
  }, [allEvents, selectedCaseId]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center">
            <Clock className="mr-2 text-primary" /> Case Timeline Engine
          </h2>
          <p className="text-sm text-gray-400 mt-1">Chronological event reconstruction for Active Investigations</p>
        </div>
        
        <div className="w-72">
          <label className="block text-xs font-semibold text-gray-400 mb-2">FILTER BY CASE ID</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option value="all">All Global Events</option>
              {uniqueCases.map(id => {
                const activeCase = cases.find((c: any) => c.id === id);
                let label = `ID: ${id}`;
                if (activeCase) {
                  label = `Case ${id} (${activeCase.type})`;
                } else {
                  const cMaster = CASE_MASTERS.find(c => c.CrimeNo === id);
                  if (cMaster) {
                    const type = cMaster.CrimeMajorHeadID === 10 ? 'Assault/Body' : (cMaster.CrimeMajorHeadID === 30 ? 'Financial Fraud' : 'Cyber/Property');
                    label = `Case ${id} (${type})`;
                  }
                }
                return <option key={id} value={id}>{label}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 glass p-8 rounded-xl overflow-y-auto custom-scrollbar relative border border-white/10">
        
        {filteredEvents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>No events found for this case.</p>
          </div>
        ) : (
          <>
            {/* Vertical Line */}
            <div className="absolute left-1/2 top-8 bottom-8 w-1 bg-white/10 transform -translate-x-1/2 rounded"></div>

            <div className="space-y-12">
              {filteredEvents.map((ev, i) => {
                const IconComponent = ICON_MAP[ev.iconName] || FileText;
                return (
                  <motion.div 
                    key={ev.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className={`flex items-center justify-between w-full ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Spacer for empty side */}
                    <div className="w-5/12"></div>
                    
                    {/* Center Node */}
                    <div className="w-2/12 flex justify-center z-10 relative">
                      <div className={`w-12 h-12 rounded-full border-4 border-[#0f172a] shadow-xl flex items-center justify-center ${ev.bg}`}>
                        <IconComponent className={`w-5 h-5 ${ev.color}`} />
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className={`w-5/12 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block glass p-5 rounded-xl border border-white/5 hover:border-white/20 transition-colors shadow-lg ${i % 2 === 0 ? 'mr-4' : 'ml-4'}`}>
                        <div className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'} mb-2`}>
                          <span className="text-xs font-bold text-primary mb-1">{ev.date} • {ev.time}</span>
                          <h3 className="text-lg font-bold text-white">{ev.title}</h3>
                        </div>
                        <p className="text-sm text-gray-300">{ev.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Timeline;
