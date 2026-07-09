import { useState } from 'react';
import { ShieldAlert, AlertTriangle, Bell, Clock, Activity, CheckCircle, Info, Filter, CheckCheck } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { useTimelineStore } from '../store/timelineStore';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Alerts = () => {
  const { events } = useTimelineStore();
  const { addToast } = useToastStore();
  
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [filter, setFilter] = useState('all'); // all, danger, warning, info/success
  const [isSending, setIsSending] = useState(false);

  const handleDispatchEmail = async () => {
    const targetEmail = window.prompt("Enter the email address to dispatch the alert to:", "officers@rakshak-ai.com");
    if (!targetEmail) return; // User cancelled or entered empty string

    setIsSending(true);
    try {
      const response = await axios.post('/server/rakshak_function/api/mail/send', {
        to: targetEmail,
        subject: 'EMERGENCY: Officer Required',
        content: 'Please respond to the location immediately.'
      });
      addToast(response.data.message, 'success');
    } catch (error) {
      console.error(error);
      addToast('Failed to dispatch alert.', 'error');
    }
    setIsSending(false);
  };

  // Dynamically map timeline events to alerts (newest first)
  const alerts = events
    .filter(e => !dismissedIds.includes(e.id as number))
    .map(e => ({
      id: e.id as number,
      type: e.type === 'alert' ? 'danger' : e.type === 'action' ? 'warning' : 'info',
      title: e.title,
      message: e.desc,
      time: e.time,
      icon: e.type === 'alert' ? ShieldAlert : e.type === 'action' ? AlertTriangle : Info,
    }))
    .reverse();

  const handleDismiss = (id: number) => {
    setDismissedIds(prev => [...prev, id]);
    addToast('Alert dismissed', 'info');
  };

  const handleClearAll = () => {
    setDismissedIds(events.map(e => e.id as number));
    addToast('All alerts cleared', 'success');
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'danger') return a.type === 'danger';
    if (filter === 'warning') return a.type === 'warning';
    return a.type === 'info' || a.type === 'success';
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/10 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center">
            <Bell className="mr-3 text-primary w-6 h-6" /> Live Alerts 
            {alerts.length > 0 && (
              <span className="ml-3 bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {alerts.length} New
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-400 mt-1">Role-specific notifications and command escalations.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('danger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center ${filter === 'danger' ? 'bg-danger/20 text-danger' : 'text-gray-400 hover:text-danger'}`}
            >
              Critical
            </button>
            <button 
              onClick={() => setFilter('warning')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center ${filter === 'warning' ? 'bg-warning/20 text-warning' : 'text-gray-400 hover:text-warning'}`}
            >
              Warnings
            </button>
            <button 
              onClick={() => setFilter('info')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center ${filter === 'info' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-primary'}`}
            >
              Info
            </button>
          </div>
          
          <button 
            onClick={handleDispatchEmail}
            disabled={isSending}
            className="flex items-center px-3 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-lg text-sm transition-colors mr-2"
          >
            {isSending ? 'Sending...' : 'Dispatch Email (Catalyst)'}
          </button>

          <button 
            onClick={handleClearAll}
            disabled={alerts.length === 0}
            className="flex items-center px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
            title="Acknowledge All"
          >
            <CheckCheck className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-4">
        <AnimatePresence>
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                key={alert.id} 
                className={`glass p-5 rounded-xl border-l-4 flex items-start transition-all hover:-translate-y-0.5 ${
                  alert.type === 'danger' ? 'border-l-danger bg-danger/5 hover:bg-danger/10' : 
                  alert.type === 'warning' ? 'border-l-warning bg-warning/5 hover:bg-warning/10' : 
                  alert.type === 'success' ? 'border-l-success bg-success/5 hover:bg-success/10' : 
                  'border-l-primary bg-primary/5 hover:bg-primary/10'
                }`}
              >
                <div className={`p-2 rounded-lg mr-4 ${
                  alert.type === 'danger' ? 'bg-danger/20' : 
                  alert.type === 'warning' ? 'bg-warning/20' : 
                  alert.type === 'success' ? 'bg-success/20' : 
                  'bg-primary/20'
                }`}>
                  <alert.icon className={`w-6 h-6 ${
                    alert.type === 'danger' ? 'text-danger' : 
                    alert.type === 'warning' ? 'text-warning' : 
                    alert.type === 'success' ? 'text-success' : 
                    'text-primary'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-100">{alert.title}</h3>
                    <span className="text-xs font-mono text-gray-500 bg-black/40 px-2 py-1 rounded-md">{alert.time}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{alert.message}</p>
                  <div className="flex space-x-3">
                    <button onClick={() => setSelectedAlert(alert)} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md text-gray-300 font-semibold transition-colors">
                      View Context
                    </button>
                    <button onClick={() => handleDismiss(alert.id)} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md text-gray-300 transition-colors">
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="h-64 flex flex-col items-center justify-center text-gray-500 glass rounded-xl border border-dashed border-white/10"
            >
              <CheckCircle className="w-12 h-12 mb-4 opacity-30 text-success" />
              <p className="font-semibold text-gray-400">All clear!</p>
              <p className="text-sm">No {filter !== 'all' ? filter : ''} alerts at this time.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={!!selectedAlert} onClose={() => setSelectedAlert(null)} title="Intelligence Feed Details">
        {selectedAlert && (
          <div className="space-y-6">
            <div className={`p-5 rounded-xl flex items-start ${
              selectedAlert.type === 'danger' ? 'bg-danger/10 border border-danger/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 
              selectedAlert.type === 'warning' ? 'bg-warning/10 border border-warning/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 
              selectedAlert.type === 'success' ? 'bg-success/10 border border-success/30' : 
              'bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
            }`}>
              <div className={`p-3 rounded-full mr-4 ${
                  selectedAlert.type === 'danger' ? 'bg-danger/20 text-danger' : 
                  selectedAlert.type === 'warning' ? 'bg-warning/20 text-warning' : 
                  selectedAlert.type === 'success' ? 'bg-success/20 text-success' : 
                  'bg-primary/20 text-primary'
                }`}>
                <selectedAlert.icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white tracking-wide">{selectedAlert.title}</h3>
                <p className="text-sm font-mono text-gray-400 mt-1 uppercase tracking-wider">{selectedAlert.type} LEVEL ALERT • {selectedAlert.time}</p>
              </div>
            </div>
            
            <div className="bg-gray-100 dark:bg-black/50 p-5 rounded-xl border border-gray-200 dark:border-white/10">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Detailed Payload</h4>
              <p className="text-gray-800 dark:text-gray-300 leading-relaxed text-sm">
                {selectedAlert.message}
              </p>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs text-gray-500 dark:text-gray-400 uppercase">System Origin</h5>
                  <p className="text-sm text-gray-800 dark:text-gray-300 font-mono">Rakshak Pipeline Node-04</p>
                </div>
                <div>
                  <h5 className="text-xs text-gray-500 dark:text-gray-400 uppercase">Confidence</h5>
                  <p className="text-sm text-success font-mono">94.5% MATCH</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button onClick={() => setSelectedAlert(null)} className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-lg text-sm transition-colors text-white font-semibold">Keep in Queue</button>
              <button onClick={() => { handleDismiss(selectedAlert.id); setSelectedAlert(null); }} className="bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/25 px-5 py-2.5 rounded-lg text-sm transition-colors font-bold flex items-center">
                <CheckCheck className="w-4 h-4 mr-2" /> Acknowledge & Resolve
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Alerts;
