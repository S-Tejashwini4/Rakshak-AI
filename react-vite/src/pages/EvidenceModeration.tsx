import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, UploadCloud, Search, Filter, CheckCircle, AlertTriangle, EyeOff, Eye, Image as ImageIcon, Download, Activity, Shield, XCircle } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { useTimelineStore } from '../store/timelineStore';
import { useCaseStore, useAssignedCases } from '../store/caseStore';

const EvidenceModeration = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'dashboard'>('queue');
  const [queue, setQueue] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [targetCaseId, setTargetCaseId] = useState('104430006202600001');
  const { addEvent } = useTimelineStore();
  const [processingState, setProcessingState] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [moderationResult, setModerationResult] = useState<any>(null);
  const [showUnsafeImage, setShowUnsafeImage] = useState(false);
  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null);
  
  const [totalScanned, setTotalScanned] = useState(0);
  const [safeScanned, setSafeScanned] = useState(0);
  
  const isSafe = moderationResult?.prediction === 'safe_to_use' || moderationResult?.prediction === 'safe';
  const { addToast } = useToastStore();
  const cases = useAssignedCases();

  useEffect(() => {
    if (cases.length > 0 && !cases.find(c => c.id === targetCaseId)) {
      setTargetCaseId(cases[0].id);
    }
  }, [cases, targetCaseId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let selectedFile = e.target.files[0];
      setFile(selectedFile);
      setProcessingState('scanning');
      setModerationResult(null);
      
      try {
        if (selectedFile.type.startsWith('image/') && !selectedFile.type.match('image/jpeg') && !selectedFile.type.match('image/png')) {
          selectedFile = await new Promise<File>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
              }
              canvas.toBlob((blob) => {
                if (blob) {
                  const newFileName = selectedFile.name.replace(/\.[^/.]+$/, "") + ".jpg";
                  resolve(new File([blob], newFileName, { type: 'image/jpeg' }));
                } else {
                  resolve(selectedFile);
                }
              }, 'image/jpeg', 0.95);
            };
            img.onerror = () => resolve(selectedFile);
            img.src = URL.createObjectURL(selectedFile);
          });
        }

        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await fetch('/server/rakshak_function/api/moderate-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || 'Server Error');
        }

        const data = await response.json();
        console.log("Moderation Response:", data);
        
        setModerationResult(data);
        setShowUnsafeImage(false); // Reset visibility on new upload
        setProcessingState('complete');
        addToast('Image Moderation scan complete.', 'info');
        
        setTotalScanned(prev => prev + 1);
        
        const isSafeResult = data.prediction === 'safe_to_use' || data.prediction === 'safe';
        if (isSafeResult) {
          setSafeScanned(prev => prev + 1);
        } else {
          const newItem = {
            id: `EVID-${Math.floor(1000 + Math.random() * 9000)}`,
            title: selectedFile.name,
            severity: data.prediction === 'unsafe_to_use' ? 'Restricted' : 'High Risk',
            flags: data.probability ? Object.entries(data.probability).filter(([_, val]) => parseFloat(val as string) > 0.1).map(([k]) => k.toUpperCase()) : ['UNSAFE'],
            confidence: data.confidence ? `${(data.confidence * 100).toFixed(1)}%` : 'High',
            uploader: 'Admin',
            date: 'Just now',
            blurred: true
          };
          setQueue(prev => [newItem, ...prev]);
          setLastUploadedId(newItem.id);
        }
      } catch (err: any) {
        console.error("Moderation error:", err);
        addToast(`Moderation Error: ${err.message}`, 'error');
        setProcessingState('idle');
      }
    }
  };

  const toggleBlur = (id: string) => {
    setQueue(queue.map(q => q.id === id ? { ...q, blurred: !q.blurred } : q));
  };

  const handleApprove = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    addEvent({
      caseId: targetCaseId,
      title: 'Evidence Override & Indexed',
      desc: `Quarantined evidence ${id} was manually approved by human reviewer and securely indexed.`,
      type: 'evidence',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      iconName: 'CheckCircle',
      bg: 'bg-success/20',
      color: 'text-success'
    });
    addToast(`Evidence ${id} overridden and indexed to Case ${targetCaseId}.`, 'success');
  };

  const handleReject = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    addToast('Evidence permanently rejected and securely deleted.', 'success');
  };

  const handleSafeIndex = () => {
    addEvent({
      caseId: targetCaseId,
      title: 'Evidence Uploaded & Indexed',
      desc: `Safe evidence was uploaded and securely indexed.`,
      type: 'evidence',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      iconName: 'Shield',
      bg: 'bg-success/20',
      color: 'text-success'
    });
    addToast(`Evidence securely indexed to Case ${targetCaseId}.`, 'success');
    setProcessingState('idle');
    setFile(null);
  };

  const handleExport = () => {
    const headers = ['Evidence ID', 'Title', 'Severity', 'Flags', 'Confidence', 'Uploader', 'Date'];
    const csvRows = [
      headers.join(','),
      ...queue.map(q => `"${q.id}","${q.title}","${q.severity}","${q.flags.join('; ')}","${q.confidence}","${q.uploader}","${q.date}"`)
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Quarantine_Audit_Log.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Audit log downloaded as CSV.', 'success');
  };

  // Dynamic Metrics for Dashboard
  const safePercent = totalScanned > 0 ? ((safeScanned / totalScanned) * 100).toFixed(1) : "0.0";
  const restrictedPercent = totalScanned > 0 ? (((totalScanned - safeScanned) / totalScanned) * 100).toFixed(1) : "0.0";
  
  const allFlags = queue.flatMap(q => q.flags);
  const getFlagCount = (cat: string) => allFlags.filter(f => f.toLowerCase().includes(cat.toLowerCase())).length;
  
  const violenceCount = getFlagCount('violen') + getFlagCount('assault') + getFlagCount('gore') + getFlagCount('blood');
  const nudityCount = getFlagCount('nudi') + getFlagCount('suggest');
  const drugCount = getFlagCount('drug');
  
  // Distribute remaining flags into "Other Categories"
  const categorizedCount = violenceCount + nudityCount + drugCount;
  const otherCount = allFlags.length - categorizedCount;
  
  const totalFlags = allFlags.length || 1; // prevent divide by zero
  const violencePercent = allFlags.length === 0 ? 0 : Math.round((violenceCount / totalFlags) * 100);
  const nudityPercent = allFlags.length === 0 ? 0 : Math.round((nudityCount / totalFlags) * 100);
  const drugPercent = allFlags.length === 0 ? 0 : Math.round((drugCount / totalFlags) * 100);
  const otherPercent = allFlags.length === 0 ? 0 : Math.max(0, 100 - (violencePercent + nudityPercent + drugPercent));

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <ShieldAlert className="mr-3 text-warning w-6 h-6" /> Evidence Safety & Compliance
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Zoho Zia Image Moderation Engine - Quarantining unsafe graphical content</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleExport} className="bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors">
            <Download className="w-4 h-4 mr-2" /> Export Audit Log
          </button>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 dark:border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center ${activeTab === 'queue' ? 'border-warning text-warning bg-warning/5' : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'}`}
        >
          <ShieldAlert className="w-4 h-4 mr-2" /> Review Queue
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center ${activeTab === 'dashboard' ? 'border-warning text-warning bg-warning/5' : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'}`}
        >
          <Activity className="w-4 h-4 mr-2" /> Moderation Analytics
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          
          {activeTab === 'queue' && (
            <motion.div 
              key="queue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Ingestion Simulator */}
              <div className="bg-white dark:glass p-6 rounded-xl border border-gray-200 dark:border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Simulate Evidence Ingestion / Review</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Target Case:</span>
                    <select 
                      value={targetCaseId}
                      onChange={(e) => setTargetCaseId(e.target.value)}
                      className="bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-warning"
                    >
                      {cases.filter((c: any) => c.status !== 'Completed').map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.id} — {c.type} ({c.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {processingState === 'idle' && (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative text-center w-full max-w-xl mx-auto">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                    />
                    <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Upload Evidence</h3>
                    <p className="text-xs text-gray-500 mt-1">Automatic Zia AI moderation will scan for violence, nudity, or gore before saving.</p>
                  </div>
                )}

                {processingState === 'scanning' && (
                  <div className="text-center py-10 w-full max-w-xl mx-auto">
                    <ShieldAlert className="w-12 h-12 mx-auto text-warning animate-pulse mb-2" />
                    <h3 className="text-lg font-bold text-warning">Scanning Image...</h3>
                    <p className="text-xs text-gray-400 animate-pulse mt-1">Checking against severe violence and adult content policies...</p>
                  </div>
                )}

                {processingState === 'complete' && (
                  <div className="flex space-x-6">
                    <div className={`w-1/3 aspect-video bg-gray-200 dark:bg-black/80 rounded-lg flex items-center justify-center border ${isSafe ? 'border-success/30' : 'border-danger/30'} relative overflow-hidden group`}>
                      {!isSafe && !showUnsafeImage && (
                          <div 
                              className="absolute inset-0 backdrop-blur-xl bg-black/50 z-10 flex flex-col items-center justify-center cursor-pointer hover:bg-black/40 transition-colors"
                              onClick={() => setShowUnsafeImage(true)}
                          >
                            <EyeOff className="text-white/50 w-8 h-8 mb-2" />
                            <span className="text-xs text-white/50 uppercase tracking-widest font-bold text-center px-4">Unsafe Content<br/>Click to View</span>
                          </div>
                      )}
                      
                      {file ? (
                          <img src={URL.createObjectURL(file)} className={`w-full h-full object-contain transition-all ${isSafe || showUnsafeImage ? 'opacity-100' : 'blur-xl opacity-50'}`} alt="Evidence Preview" />
                      ) : (
                          <ImageIcon className="text-gray-700 w-16 h-16" />
                      )}
                      
                      {!isSafe && showUnsafeImage && (
                          <button 
                              onClick={() => setShowUnsafeImage(false)}
                              className="absolute top-2 right-2 z-20 bg-gray-200/80 hover:bg-gray-300 dark:bg-black/80 dark:hover:bg-black text-gray-900 dark:text-white p-1.5 rounded-md border border-gray-300 dark:border-white/20 transition-colors shadow-sm"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      {isSafe ? (
                        <div>
                          <h4 className="text-success font-bold flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Upload Approved - Evidence is Safe</h4>
                          <p className="text-xs text-gray-400 mt-1">The evidence passed moderation and is ready to be securely indexed.</p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-danger font-bold flex items-center"><XCircle className="w-4 h-4 mr-2" /> Upload Blocked - Sent to Quarantine</h4>
                          <p className="text-xs text-gray-400 mt-1">The evidence was intercepted by the moderation engine before indexing.</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 p-3 rounded border border-white/5 overflow-hidden">
                          <p className="text-xs text-gray-500 mb-1">Zia AI Labels</p>
                          <div className="flex flex-wrap gap-2">
                            {isSafe ? (
                                <span className="bg-success/20 text-success px-2 py-0.5 rounded text-xs">Safe</span>
                            ) : moderationResult?.probability ? (
                                Object.entries(moderationResult.probability)
                                  .filter(([_, val]) => parseFloat(val as string) > 0.1) // Only show labels with some probability
                                  .map(([key, val]) => (
                                    <span key={key} className="bg-danger/20 text-danger px-2 py-0.5 rounded text-xs uppercase">
                                      {key} ({(parseFloat(val as string) * 100).toFixed(0)}%)
                                    </span>
                                  ))
                            ) : (
                                <span className="bg-danger/20 text-danger px-2 py-0.5 rounded text-xs">Unsafe Content</span>
                            )}
                          </div>
                        </div>
                        <div className="bg-black/40 p-3 rounded border border-white/5">
                          <p className="text-xs text-gray-500 mb-1">Prediction / Confidence</p>
                          <p className={`text-sm font-mono uppercase ${isSafe ? 'text-success' : 'text-danger'}`}>
                            {moderationResult?.prediction || 'Unknown'} - {moderationResult?.confidence ? `${(moderationResult.confidence * 100).toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-4 items-center">
                        {isSafe ? (
                          <button onClick={handleSafeIndex} className="bg-success/20 hover:bg-success/30 text-success px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center">
                            <Shield className="w-4 h-4 mr-2" /> Index to Case
                          </button>
                        ) : (
                          <button onClick={() => {
                            if (lastUploadedId) handleReject(lastUploadedId);
                            setProcessingState('idle');
                            setFile(null);
                          }} className="bg-danger/20 hover:bg-danger/30 text-danger px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center">
                            <XCircle className="w-4 h-4 mr-2" /> Reject Permanently
                          </button>
                        )}
                        <button onClick={() => setProcessingState('idle')} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline">Upload another file</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Review Queue List */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200">Quarantine Review Queue</h3>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input type="text" placeholder="Search Evidence ID..." className="bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg pl-10 pr-4 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-warning" />
                    </div>
                    <button onClick={() => addToast('Filters applied.', 'info')} className="bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 flex items-center transition-colors">
                      <Filter className="w-4 h-4 mr-2" /> Filters
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {queue.map(item => (
                    <div key={item.id} className="bg-white dark:glass rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col">
                      <div className="relative h-40 bg-gray-200 dark:bg-black/80 flex items-center justify-center">
                        {item.blurred && (
                          <div className="absolute inset-0 backdrop-blur-xl bg-white/60 dark:bg-black/60 z-10 flex flex-col items-center justify-center">
                            <Shield className="text-danger w-8 h-8 mb-2" />
                            <span className="text-xs text-gray-900 dark:text-white uppercase tracking-widest font-bold">Restricted</span>
                          </div>
                        )}
                        <ImageIcon className="text-gray-500 dark:text-gray-700 w-16 h-16" />
                        <button 
                          onClick={() => toggleBlur(item.id)}
                          className="absolute top-2 right-2 z-20 bg-gray-200/80 hover:bg-gray-300 dark:bg-black/80 dark:hover:bg-black text-gray-900 dark:text-white p-1.5 rounded-md border border-gray-300 dark:border-white/20 transition-colors"
                        >
                          {item.blurred ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate w-32">{item.title}</p>
                            <p className="text-xs text-primary font-mono">{item.id}</p>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${item.severity === 'Restricted' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>
                            {item.severity}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.flags.map((flag, idx) => (
                            <span key={idx} className="bg-white/5 text-gray-300 px-2 py-0.5 rounded text-[10px] border border-white/10">{flag} ({item.confidence})</span>
                          ))}
                        </div>
                        
                        <div className="mt-auto pt-3 border-t border-white/10 flex justify-between items-center text-xs text-gray-500">
                          <span>{item.uploader}</span>
                          <span>{item.date}</span>
                        </div>
                        
                        <div className="mt-3 flex space-x-2">
                          <button onClick={() => handleApprove(item.id)} className="flex-1 bg-success/20 hover:bg-success/30 text-success py-1.5 rounded text-xs font-semibold transition-colors">Approve (Override)</button>
                          <button onClick={() => handleReject(item.id)} className="flex-1 bg-danger/20 hover:bg-danger/30 text-danger py-1.5 rounded text-xs font-semibold transition-colors">Reject Permanently</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-xl border-l-4 border-l-primary">
                  <p className="text-xs text-gray-400 mb-1">Total Evidence Scanned</p>
                  <h3 className="text-2xl font-bold text-white">{totalScanned.toLocaleString()}</h3>
                </div>
                <div className="glass p-5 rounded-xl border-l-4 border-l-success">
                  <p className="text-xs text-gray-400 mb-1">Safe / Clean</p>
                  <h3 className="text-2xl font-bold text-white">{safePercent}%</h3>
                </div>
                <div className="glass p-5 rounded-xl border-l-4 border-l-danger">
                  <p className="text-xs text-gray-400 mb-1">Restricted Content</p>
                  <h3 className="text-2xl font-bold text-white">{restrictedPercent}%</h3>
                </div>
                <div className="glass p-5 rounded-xl border-l-4 border-l-warning">
                  <p className="text-xs text-gray-400 mb-1">Requires Manual Review</p>
                  <h3 className="text-2xl font-bold text-white">{queue.length}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-gray-200">Unsafe Content Categories</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Graphic Violence / Gore</span><span className="text-gray-400">{violencePercent}%</span></div>
                      <div className="w-full h-2 bg-black/40 rounded-full"><div className="h-full bg-danger rounded-full" style={{ width: `${violencePercent}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Adult Content / Nudity</span><span className="text-gray-400">{nudityPercent}%</span></div>
                      <div className="w-full h-2 bg-black/40 rounded-full"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${nudityPercent}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Drugs / Contraband</span><span className="text-gray-400">{drugPercent}%</span></div>
                      <div className="w-full h-2 bg-black/40 rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${drugPercent}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Other Restricted Flags</span><span className="text-gray-400">{otherPercent}%</span></div>
                      <div className="w-full h-2 bg-black/40 rounded-full"><div className="h-full bg-warning rounded-full" style={{ width: `${otherPercent}%` }}></div></div>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-gray-200">Moderation Override Trends</h3>
                  <div className="h-48 flex items-end justify-between space-x-2 pb-2">
                    {/* Mock Bar Chart */}
                    {[10, 15, 8, 20, 12, 25, 18].map((h, i) => (
                      <div key={i} className="w-full bg-black/40 rounded-t-sm relative group flex flex-col justify-end">
                        <div className="w-full bg-success/60 rounded-t-sm transition-all group-hover:bg-success" style={{ height: `${h}%` }}></div>
                        <div className="w-full bg-danger/60 rounded-t-sm transition-all group-hover:bg-danger mt-[1px]" style={{ height: `${h * 1.5}%` }}></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                  <div className="flex justify-center space-x-4 mt-4 text-xs">
                    <span className="flex items-center text-gray-400"><span className="w-2 h-2 bg-success rounded-full mr-1"></span> AI Rejected, Human Approved (False Positive)</span>
                    <span className="flex items-center text-gray-400"><span className="w-2 h-2 bg-danger rounded-full mr-1"></span> Permanently Rejected</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default EvidenceModeration;
