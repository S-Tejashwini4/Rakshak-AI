import { useState, useMemo } from 'react';
import { Activity, AlertTriangle, ChevronRight, FileText, TrendingUp, ShieldAlert, Users, PlayCircle, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTimelineStore } from '../store/timelineStore';
import { useToastStore } from '../store/toastStore';
import { useCaseStore } from '../store/caseStore';
import { useUserStore } from '../store/userStore';

const DailyBriefing = () => {
  const navigate = useNavigate();
  const events = useTimelineStore(state => state.events);
  const { cases } = useCaseStore();
  const { users } = useUserStore();
  const { addToast } = useToastStore();
  const { addEvent } = useTimelineStore();
  const [assignedActions, setAssignedActions] = useState<number[]>([]);
  const [isRunningCron, setIsRunningCron] = useState(false);

  const handleRunCron = async () => {
    setIsRunningCron(true);
    try {
      const response = await axios.post('/server/rakshak_function/api/cron/daily-briefing');
      addToast(response.data.message, 'success');
      addEvent('cron_run', 'Daily Briefing Cron Job Executed', 'Nightly intelligence aggregated via Catalyst Job Scheduler.', 'action');
    } catch (error) {
      console.error(error);
      addToast('Cron job execution failed.', 'error');
    }
    setIsRunningCron(false);
  };

  // ---- Real-time case stats ----
  const activeCases = useMemo(() => cases.filter(c => c.status !== 'Closed' && c.status !== 'Completed'), [cases]);
  const highPriorityCases = useMemo(() => activeCases.filter(c => c.priority === 'High'), [activeCases]);
  const cyberFraudCases = useMemo(() =>
    activeCases.filter(c => c.type?.toLowerCase().includes('cyber') || c.type?.toLowerCase().includes('fraud')),
    [activeCases]
  );

  // ---- Derive real officer workload from case assignees ----
  const officerWorkload = useMemo(() => {
    const map: Record<string, { assignee: string; active: number; total: number }> = {};
    cases.forEach(c => {
      const key = c.assignee || 'Unassigned';
      if (!map[key]) map[key] = { assignee: key, active: 0, total: 0 };
      map[key].total++;
      if (c.status !== 'Closed' && c.status !== 'Completed') map[key].active++;
    });
    return Object.values(map).filter(o => o.assignee !== 'Unassigned');
  }, [cases]);

  const busiestOfficer = useMemo(() =>
    [...officerWorkload].sort((a, b) => b.active - a.active)[0] || null,
    [officerWorkload]
  );

  const topOfficer = useMemo(() => {
    // Top officer: highest clearance rate (closed/total)
    const withClearance = officerWorkload.map(o => ({
      ...o,
      clearance: o.total > 0 ? Math.round(((o.total - o.active) / o.total) * 100) : 0
    }));
    return [...withClearance].sort((a, b) => b.clearance - a.clearance)[0] || null;
  }, [officerWorkload]);

  // ---- Generate real AutoML Prescriptive Actions ----
  const dynamicActions = useMemo(() => {
    const actions: { title: string; desc: string; type: string; caseId?: string }[] = [];

    // Action 1: High priority cases due today
    if (highPriorityCases.length > 0) {
      const caseIds = highPriorityCases.slice(0, 3).map(c => c.id).join(', ');
      actions.push({
        title: 'Prioritize High-Risk Cases Immediately',
        desc: `${highPriorityCases.length} high-priority case(s) require immediate attention: ${caseIds}. Assign dedicated resources and expedite investigation.`,
        type: 'danger',
        caseId: highPriorityCases[0]?.id
      });
    }

    // Action 2: Cyber/Fraud spike
    if (cyberFraudCases.length > 0) {
      actions.push({
        title: 'Deploy Cyber Forensic Task Force',
        desc: `${cyberFraudCases.length} active cyber/fraud case(s) detected. Deploy digital forensic teams to trace digital footprints and IP logs.`,
        type: 'primary',
        caseId: cyberFraudCases[0]?.id
      });
    }

    // Action 3: Busiest officer overload
    if (busiestOfficer && busiestOfficer.active >= 2) {
      actions.push({
        title: `Redistribute Caseload from ${busiestOfficer.assignee}`,
        desc: `Officer ${busiestOfficer.assignee} is handling ${busiestOfficer.active} active cases simultaneously. Consider redistributing to balance workload.`,
        type: 'warning',
        caseId: activeCases.find(c => c.assignee === busiestOfficer.assignee)?.id
      });
    }

    // Action 4: Unassigned cases
    const unassigned = cases.filter(c => c.assignee === 'Unassigned' || !c.assignee);
    if (unassigned.length > 0) {
      actions.push({
        title: `Assign ${unassigned.length} Unassigned Case(s)`,
        desc: `${unassigned.length} recently filed FIR(s) remain unassigned. Immediate assignment required: ${unassigned.slice(0, 2).map(c => c.id).join(', ')}.`,
        type: 'warning',
        caseId: unassigned[0]?.id
      });
    }

    // If no real actions, show a neutral message
    if (actions.length === 0) {
      actions.push({
        title: 'No Critical Actions Required',
        desc: 'All cases are progressing normally. No immediate prescriptive actions recommended at this time.',
        type: 'info'
      });
    }

    return actions.slice(0, 3);
  }, [highPriorityCases, cyberFraudCases, busiestOfficer, activeCases, cases]);

  // ---- Key Investigation Summaries from real timeline events ----
  const latestEvents = useMemo(() => [...events].reverse().slice(0, 5), [events]);

  const handleReviewEvent = (caseId: string) => {
    navigate(`/timeline?caseId=${caseId}`);
  };

  const handleAssignAction = (idx: number, action: { title: string; desc: string; caseId?: string }) => {
    if (assignedActions.includes(idx)) return;
    setAssignedActions(prev => [...prev, idx]);

    // Log to the timeline of the relevant case if available
    const targetCaseId = action.caseId || activeCases[0]?.id;
    if (targetCaseId) {
      addEvent({
        caseId: targetCaseId,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        title: `AI Action Deployed: ${action.title}`,
        type: 'action',
        desc: action.desc,
        iconName: 'Shield',
        color: 'text-primary',
        bg: 'bg-primary/20'
      });
    }
    addToast(`Successfully assigned: "${action.title}". Logged to Case Timeline.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center">
            <Activity className="mr-2 text-primary" /> Daily AI Intelligence Briefing
          </h2>
          <p className="text-sm text-gray-400 mt-1">Generated automatically from real-time FIR data &amp; case intelligence</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-sm text-gray-400">Date</p>
          <p className="text-lg font-bold text-white mb-2">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <button 
            onClick={handleRunCron}
            disabled={isRunningCron}
            className="flex items-center px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-lg text-xs transition-colors"
          >
            <Clock className="w-3 h-3 mr-1" /> {isRunningCron ? 'Running...' : 'Trigger Nightly Cron (Catalyst)'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Cyber/Fraud Cases */}
        <div className={`glass p-6 rounded-xl border-l-4 ${cyberFraudCases.length > 3 ? 'border-l-danger' : 'border-l-warning'}`}>
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center">
            {cyberFraudCases.length > 3 ? <TrendingUp className="w-4 h-4 mr-2 text-danger" /> : <Activity className="w-4 h-4 mr-2" />}
            Active Cyber/Fraud Cases
          </h3>
          <p className="text-3xl font-bold text-white mb-2">{cyberFraudCases.length}</p>
          <p className="text-sm text-gray-300">
            {cyberFraudCases.length === 0
              ? 'No active cyber/fraud incidents at this time.'
              : `${cyberFraudCases.length} active cyber/fraud case(s): ${cyberFraudCases.slice(0, 2).map(c => c.id).join(', ')}${cyberFraudCases.length > 2 ? '...' : ''}`
            }
          </p>
        </div>

        {/* Card 2: Highest Workload Officer */}
        <div className="glass p-6 rounded-xl border-l-4 border-l-warning">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center">
            <Users className="w-4 h-4 mr-2" /> Highest Workload Officer
          </h3>
          {busiestOfficer ? (
            <>
              <p className="text-xl font-bold text-white mb-2 truncate">{busiestOfficer.assignee}</p>
              <p className="text-sm text-gray-300">Currently handling {busiestOfficer.active} active case(s) out of {busiestOfficer.total} total. Consider load balancing.</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">No assigned cases found.</p>
          )}
        </div>

        {/* Card 3: Top Performing Officer */}
        <div className="glass p-6 rounded-xl border-l-4 border-l-success">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2" /> Top Performing Officer
          </h3>
          {topOfficer ? (
            <>
              <p className="text-xl font-bold text-white mb-2 truncate">{topOfficer.assignee}</p>
              <p className="text-sm text-gray-300">Achieved a {topOfficer.clearance}% clearance rate — {topOfficer.total - topOfficer.active} of {topOfficer.total} case(s) resolved.</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">No case clearance data yet.</p>
          )}
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Key Investigation Summaries */}
        <div className="glass p-6 rounded-xl">
          <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center border-b border-white/10 pb-3">
            <FileText className="w-5 h-5 mr-2 text-primary" /> Key Investigation Summaries
          </h3>
          <div className="space-y-4">
            {latestEvents.map((evt, idx) => (
              <div key={idx} onClick={() => handleReviewEvent(evt.caseId)} className="bg-black/20 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-bold truncate max-w-[60%]">{evt.caseId}</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{evt.time}</span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{evt.title}</h4>
                <p className="text-xs text-gray-300 mb-2 line-clamp-2">{evt.desc}</p>
                <div className="text-primary text-xs flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  Review Event Details <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            ))}
            {latestEvents.length === 0 && (
              <p className="text-gray-500 text-sm italic text-center py-6">No recent investigation events recorded. Events appear here when actions are taken on cases.</p>
            )}
          </div>
        </div>

        {/* AutoML Prescriptive Actions */}
        <div className="glass p-6 rounded-xl flex flex-col">
          <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center border-b border-white/10 pb-3">
            <AlertTriangle className="w-5 h-5 mr-2 text-warning" /> AutoML Prescriptive Actions
          </h3>
          <ul className="space-y-4 flex-1">
            {dynamicActions.map((action, idx) => {
              const isAssigned = assignedActions.includes(idx);
              return (
                <li key={idx} className={`flex flex-col p-4 rounded-lg border transition-all ${isAssigned ? 'bg-success/10 border-success/30' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}>
                  <div className="flex items-start">
                    <div className={`text-xs font-bold px-2 py-1 rounded mr-3 mt-0.5 shrink-0 ${
                      action.type === 'danger' ? 'bg-danger/20 text-danger' :
                      action.type === 'warning' ? 'bg-warning/20 text-warning' :
                      action.type === 'primary' ? 'bg-primary/20 text-primary' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{idx + 1}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-200 text-sm">{action.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
                      {action.caseId && (
                        <p className="text-xs text-gray-600 mt-1">Case: {action.caseId}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleAssignAction(idx, action)}
                      disabled={isAssigned}
                      className={`flex items-center px-4 py-1.5 text-xs font-semibold rounded transition-colors ${
                        isAssigned
                          ? 'bg-success/20 text-success cursor-default border border-success/50'
                          : 'bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30'
                      }`}
                    >
                      {isAssigned ? (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Assigned</>
                      ) : (
                        <><PlayCircle className="w-4 h-4 mr-2" /> Assign Action</>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DailyBriefing;
