import { useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Camera, Activity, CheckCircle, Search, Cpu, Database, ScanLine, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/toastStore';
import { useTimelineStore } from '../store/timelineStore';
import { useCaseStore, useAssignedCases } from '../store/caseStore';
import { useAuthStore } from '../store/authStore';


const AiPipeline = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processingState, setProcessingState] = useState<'idle' | 'uploading' | 'analyzing' | 'complete'>('idle');
  const [targetCaseId, setTargetCaseId] = useState('');
  
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { addEvent } = useTimelineStore();
  const assignedCases = useAssignedCases();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      simulatePipeline();
    }
  };

  const simulatePipeline = () => {
    setProcessingState('uploading');
    setTimeout(() => {
      setProcessingState('analyzing');
      setTimeout(() => {
        setProcessingState('complete');
      }, 3000); // 3 seconds of "analysis"
    }, 1500); // 1.5 seconds of "upload"
  };

  const handleIndex = () => {
    addEvent({
      caseId: targetCaseId,
      date: 'July 3, 2026',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'New Evidence Indexed',
      type: 'document',
      desc: `CCTV Footage / Video Evidence "${file?.name || 'unknown'}" successfully processed via Zoho Zia AI Pipeline and linked to active investigation. AI Extracted Intelligence will be populated asynchronously.`,
      iconName: 'Video',
      color: 'text-success',
      bg: 'bg-success/20'
    });
    
    addToast(`Evidence indexed successfully into Case ${targetCaseId}!`, 'success');
    navigate('/timeline');
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center">
            <Cpu className="mr-2 text-primary" /> Zoho Zia Video Evidence Pipeline
          </h2>
          <p className="text-sm text-gray-400 mt-1">Intelligent processing for CCTV footage and video evidence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Upload & Pipeline Status Column */}
        <div className="glass p-6 rounded-xl flex flex-col space-y-6 border-t-2 border-t-primary">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-200">1. Evidence Ingestion</h3>
            
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Target Case ID</label>
              <select 
                value={targetCaseId}
                onChange={(e) => setTargetCaseId(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="" disabled>Select a case...</option>
                {assignedCases.filter(c => c.status !== 'Completed').map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.type} ({c.status})
                  </option>
                ))}
              </select>
              {assignedCases.length === 0 && (
                <p className="text-xs text-gray-500 mt-1 italic">No cases assigned yet.</p>
              )}
            </div>

            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:bg-white/5 transition-colors relative">
              <input 
                type="file" 
                accept="video/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
              <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-300 font-medium">Drag & Drop CCTV Footage</p>
              <p className="text-xs text-gray-500 mt-1">Upload .mp4, .mov, .avi files</p>
            </div>
            
            {file && (
              <div className="mt-4 p-3 bg-black/30 rounded-lg flex items-center border border-white/5">
                {file.type.includes('image') ? <ImageIcon className="w-5 h-5 mr-3 text-primary" /> : <FileText className="w-5 h-5 mr-3 text-primary" />}
                <div className="flex-1 truncate">
                  <p className="text-sm text-gray-200 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
          </div>


          {processingState === 'complete' && (
            <button onClick={handleIndex} className="w-full bg-success/20 text-success border border-success/30 hover:bg-success/30 font-bold py-3 rounded-lg transition-colors flex justify-center items-center">
              <Database className="w-5 h-5 mr-2" /> Index to Crime Database
            </button>
          )}
        </div>

        {/* AI Extracted Intelligence Column */}
        <div className="lg:col-span-2 glass p-6 rounded-xl border-t-2 border-t-primary flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">2. AI Extracted Intelligence</h3>
          
          {processingState === 'idle' || processingState === 'uploading' ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 border border-dashed border-white/5 rounded-xl">
              <p>Awaiting CCTV footage upload...</p>
            </div>
          ) : processingState === 'analyzing' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4 border border-white/5 rounded-xl bg-black/20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <Cpu className="w-12 h-12 text-primary" />
              </motion.div>
              <p className="animate-pulse">Zoho Zia models analyzing video frames...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-white/5 rounded-xl bg-success/5 space-y-4">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center text-success mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-gray-100">Video Analysis Initialized</h4>
              <p className="text-gray-400 max-w-md">
                The CCTV footage has been successfully processed by the AI Pipeline. 
                Full intelligence insights (tracked objects, recognized faces, and anomalies) are being generated asynchronously.
              </p>
              <div className="p-4 bg-black/30 rounded-lg border border-white/10 w-full mt-4 text-left">
                <p className="text-sm text-gray-300 font-semibold mb-2">Next Steps:</p>
                <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
                  <li>Click <strong>Index to Crime Database</strong> to securely store the video hash and metadata.</li>
                  <li>Check the <strong>Case Timeline Engine</strong> for the detailed AI Extraction Report once it completes in the background.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components

export default AiPipeline;
