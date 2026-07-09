import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, User, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { CASE_MASTERS, STATUS_MASTER, ACCUSED_LIST, VICTIMS, COMPLAINANTS, ACT_SECTIONS, SECTIONS, EMPLOYEES } from '../utils/mockData';

import { useTimelineStore } from '../store/timelineStore';
import { useCaseStore, useAssignedCases } from '../store/caseStore';

const CrimeSearch = () => {
  const allEvents = useTimelineStore(state => state.events);
  const cases = useAssignedCases();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [catalystResults, setCatalystResults] = useState<any[] | null>(null);
  const [catalystService, setCatalystService] = useState<string>('');
  
  const handleCatalystSearch = async () => {
    if (!searchTerm) return;
    setIsSearching(true);
    try {
      const response = await axios.get(`/server/rakshak_function/api/search?q=${encodeURIComponent(searchTerm)}`);
      setCatalystService(response.data.service);
      setCatalystResults(response.data.results);
    } catch (error) {
      console.error(error);
      setCatalystService('Error');
      setCatalystResults([{ matched_text: 'Catalyst Search failed to connect.' }]);
    }
    setIsSearching(false);
  };
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');

  useEffect(() => {
    // Map from all active cases
    const mapped = cases.map((c: any) => {
      const cMaster = CASE_MASTERS.find(cm => cm.CrimeNo === c.id);
      
      let status = c.status;
      let accused = c.suspectName || 'Unknown';
      let location = c.district ? `District: ${c.district}` : 'PS Unit: 40006';
      let date = new Date().toLocaleDateString();
      let type = c.type;

      if (cMaster && !c.suspectName) {
        status = STATUS_MASTER.find(s => s.CaseStatusID === cMaster.CaseStatusID)?.CaseStatusName || status;
        accused = ACCUSED_LIST.find(a => a.CaseMasterID === cMaster.CaseMasterID)?.AccusedName || accused;
        location = `PS Unit: ${cMaster.PoliceStationID}`;
        type = cMaster.CrimeMajorHeadID === 10 ? 'Crimes Against Body' : (cMaster.CrimeMajorHeadID === 30 ? 'Financial Fraud' : 'Crimes Against Property');
        date = new Date(cMaster.CrimeRegisteredDate).toLocaleDateString();
      }

      return {
        id: c.id,
        type,
        location,
        status,
        date,
        accused
      };
    });
    setResults(mapped);
  }, [cases]);

  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (selectedCase) {
      setLoadingDetails(true);
      const cMaster = CASE_MASTERS.find(c => c.CrimeNo === selectedCase);
      const activeCase = cases.find((c: any) => c.id === selectedCase);
      
      setTimeout(() => { // Simulate network delay
        const dynamicEvidence = allEvents
          .filter(e => e.caseId === selectedCase && (e.title.includes('Intelligence') || e.type === 'evidence' || e.type === 'document' || e.type === 'video'))
          .map(e => e.title);

        const combinedEvidence = dynamicEvidence;

        if (activeCase) {
          // If we have an active case in the store, prioritize its real-time data
          setCaseDetails({
            victims: [activeCase.victimName || 'Unknown Victim'],
            complainants: [activeCase.complainantName || 'Unknown Complainant'],
            sections: ['Investigation Pending'],
            assignedOfficer: activeCase.assignee && activeCase.assignee !== 'Unassigned' ? activeCase.assignee : 'Unassigned',
            evidence: combinedEvidence
          });
        } else if (cMaster) {
          const cId = cMaster.CaseMasterID;
          const caseVics = VICTIMS.filter(v => v.CaseMasterID === cId).map(v => v.VictimName);
          const caseComps = COMPLAINANTS.filter(comp => comp.CaseMasterID === cId).map(comp => comp.ComplainantName);
          const caseSecs = ACT_SECTIONS.filter(as => as.CaseMasterID === cId).map(as => {
            const sectionDesc = SECTIONS.find(s => s.ActCode === as.ActID && s.SectionCode === as.SectionID)?.SectionDescription || as.SectionID;
            return `${as.ActID} - ${sectionDesc}`;
          });
          const assignedOfficer = EMPLOYEES.find(e => e.EmployeeID === cMaster.PolicePersonID)?.FirstName || 'Unknown';

          setCaseDetails({
            victims: caseVics.length ? caseVics : ['None'],
            complainants: caseComps.length ? caseComps : ['None'],
            sections: caseSecs.length ? caseSecs : ['Pending classification'],
            assignedOfficer,
            evidence: combinedEvidence
          });
        }
        setLoadingDetails(false);
      }, 300);
    } else {
      setCaseDetails(null);
    }
  }, [selectedCase, allEvents]);

  // Derived filtered results
  const filteredResults = results.filter(row => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = row.id.toLowerCase().includes(term) || 
                          row.accused.toLowerCase().includes(term) || 
                          row.type.toLowerCase().includes(term) ||
                          row.location.toLowerCase().includes(term);
    
    const matchesStatus = filterStatus === 'All' || row.status === filterStatus;
    const matchesType = filterType === 'All' || row.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const uniqueStatuses = ['All', ...Array.from(new Set(results.map(r => r.status)))];
  const uniqueTypes = ['All', ...Array.from(new Set(results.map(r => r.type)))];

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center">
          <Search className="mr-2 text-primary" /> Database Crime Search
        </h2>
      </div>

      <div className="glass p-6 rounded-xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by CrimeNo, Accused, Type, or Location..."
                className="w-full bg-black/30 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-primary text-white transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={handleCatalystSearch}
              disabled={isSearching}
              className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center transition-colors font-medium whitespace-nowrap"
            >
              {isSearching ? 'Searching...' : 'Deep Search (Catalyst)'}
            </button>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-3 rounded-lg flex items-center transition-colors ${showFilters ? 'bg-primary/20 border-primary/50 text-primary' : 'text-white'}`}
          >
            <Filter className="w-5 h-5 mr-2" /> Filters
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Case Status</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:border-primary text-white"
                  >
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Crime Type</label>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:border-primary text-white"
                  >
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass rounded-xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/20">
                <th className="p-4 text-sm font-semibold text-gray-300">Crime Number (CrimeNo)</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Major Crime Head</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Police Station ID</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Primary Accused</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Registered Date</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Case Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length > 0 ? (
                filteredResults.map((row, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={row.id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td 
                      onClick={() => setSelectedCase(row.id)}
                      className="p-4 flex items-center text-primary font-medium cursor-pointer hover:underline"
                    >
                      <FileText className="w-4 h-4 mr-2" /> {row.id}
                    </td>
                    <td className="p-4 text-gray-300">{row.type}</td>
                    <td className="p-4 text-gray-300 flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-500"/> {row.location}</td>
                    <td className="p-4 text-gray-300 flex items-center"><User className="w-4 h-4 mr-1 text-gray-500"/> {row.accused}</td>
                    <td className="p-4 text-gray-400">{row.date}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        row.status.includes('Investigation') ? 'bg-warning/20 text-warning' :
                        row.status === 'Charge Sheeted' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No cases found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-900 pt-2 pb-4 z-10 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <FileText className="mr-2 text-primary" /> Case Details: {selectedCase}
              </h3>
              <button 
                onClick={() => setSelectedCase(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-black/30 p-4 rounded-lg border border-gray-200 dark:border-white/5">
                  <p className="text-xs text-gray-500 uppercase">Primary Accused</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{results.find(r => r.id === selectedCase)?.accused}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black/30 p-4 rounded-lg border border-gray-200 dark:border-white/5">
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{results.find(r => r.id === selectedCase)?.status}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-black/30 p-4 rounded-lg border border-gray-200 dark:border-white/5">
                {loadingDetails ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="ml-3 text-sm text-gray-400">Fetching live details from database...</span>
                  </div>
                ) : caseDetails ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Victim(s)</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                          {caseDetails.victims.map((v: string, i: number) => <li key={i}>{v}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Complainant(s)</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                          {caseDetails.complainants.map((c: string, i: number) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                      <p className="text-xs text-gray-500 uppercase mb-2">Applied Sections (ActSectionAssociation)</p>
                      <div className="flex flex-wrap gap-2">
                        {caseDetails.sections.map((s: string, i: number) => (
                          <span key={i} className="bg-primary/20 text-primary text-xs px-2 py-1 rounded border border-primary/30">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Assigned Officer</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          {caseDetails.assignedOfficer}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Evidence Logged</p>
                        {caseDetails.evidence.length > 0 ? (
                          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                            {caseDetails.evidence.map((e: string, i: number) => <li key={i}>{e}</li>)}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No evidence logged yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Details not available.</p>
                )}
                <button 
                  onClick={() => setSelectedCase(null)}
                  className="mt-6 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm w-full font-medium"
                >
                  Close Details
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Catalyst Search Results Modal */}
      {catalystResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-900 pt-2 pb-4 z-10 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Search className="mr-2 text-primary" /> {catalystService} Results
              </h3>
              <button 
                onClick={() => setCatalystResults(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              {catalystResults.length > 0 ? (
                catalystResults.map((res: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 dark:bg-black/30 p-4 rounded-lg border border-gray-200 dark:border-white/5">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {res.case_no ? `Case: ${res.case_no}` : `Result ${idx + 1}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{res.matched_text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No matches found in Catalyst Deep Search.</p>
              )}
              
              <button 
                onClick={() => setCatalystResults(null)}
                className="mt-6 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm w-full font-medium"
              >
                Close Results
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CrimeSearch;
