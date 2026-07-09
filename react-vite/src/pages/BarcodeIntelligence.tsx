import { useState, useEffect } from 'react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, UploadCloud, Search, Filter, ScanLine, Activity, Image as ImageIcon, Download, Link, Link2, Box } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { useTimelineStore } from '../store/timelineStore';
import { useCaseStore, useAssignedCases } from '../store/caseStore';

const MOCK_BARCODES: any[] = [];
const CHAIN_OF_CUSTODY: any[] = [];

const BarcodeIntelligence = () => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'dashboard' | 'custody'>('dashboard');
  const [file, setFile] = useState<File | null>(null);
  const [processingState, setProcessingState] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [sessionBarcodes, setSessionBarcodes] = useState<any[]>(MOCK_BARCODES);
  const [targetCaseId, setTargetCaseId] = useState('104430006202600001');
  const { addToast } = useToastStore();
  const { addEvent } = useTimelineStore();
  const cases = useAssignedCases();

  useEffect(() => {
    if (cases.length > 0 && !cases.find(c => c.id === targetCaseId)) {
      setTargetCaseId(cases[0].id);
    }
  }, [cases, targetCaseId]);

  const handleIndexToCase = () => {
    if (!scannedResult) return;

    const newBarcode = {
        id: `BAR-${Math.floor(10000 + Math.random() * 90000)}`,
        format: scannedResult.format || 'Unknown',
        value: scannedResult.content,
        type: 'Scanned Asset',
        confidence: '99%',
        case: targetCaseId,
        location: 'Live Upload Scanner',
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSessionBarcodes(prev => [newBarcode, ...prev]);

    addEvent({
      caseId: targetCaseId,
      title: 'Barcode Asset Logged',
      desc: `Asset ${scannedResult.content} logged to Chain of Custody.`,
      type: 'evidence',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      iconName: 'ScanLine',
      bg: 'bg-cyan-400/20',
      color: 'text-cyan-400'
    });
    addToast(`Barcode Asset linked to Case ${targetCaseId}`, 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setProcessingState('scanning');
      setScannedResult(null);

      try {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await fetch('/server/rakshak_function/api/scan-barcode', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Server Error');
        }

        const data = await response.json();
        console.log("Barcode Scan Response:", data);

        let barcodeData: any = null;
        if (data && data.data && data.data.length > 0) barcodeData = data.data[0];
        else if (Array.isArray(data) && data.length > 0) barcodeData = data[0];
        else if (data && data.content) barcodeData = data;
        else if (typeof data === 'string') barcodeData = { content: data, format: 'Unknown' };
        else if (data) barcodeData = data;

        // Ensure we handle string arrays as well
        if (typeof barcodeData === 'string') {
          barcodeData = { content: barcodeData, format: 'Unknown' };
        }

        if (barcodeData) {
          // Zia might return the decoded string in different properties depending on the format
          const decodedContent = barcodeData.content || barcodeData.text || barcodeData.value || barcodeData.barcode || (typeof barcodeData === 'string' ? barcodeData : null);
          const decodedFormat = barcodeData.format || barcodeData.type || 'Unknown';

          if (decodedContent) {
            setScannedResult({ content: decodedContent, format: decodedFormat });
            setProcessingState('complete');
            addToast(`Zia Barcode Scanner complete. Format: ${decodedFormat} detected.`, 'success');
            return;
          }
        }

        throw new Error(`No barcodes were detected in this image. Please ensure the barcode is clearly visible.`);
      } catch (err: any) {
        console.error("Barcode scan error:", err);
        addToast(`Scan Error: ${err.message}`, 'error');
        setProcessingState('idle');
      }
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center">
            <QrCode className="mr-3 text-cyan-400 w-6 h-6" /> Evidence & Asset Tracker
          </h2>
          <p className="text-sm text-gray-400 mt-1">Universal Barcode & QR Intelligence Engine for digital chain of custody</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors">
            <Download className="w-4 h-4 mr-2" /> Export Audit Log
          </button>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center ${activeTab === 'dashboard' ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
        >
          <Activity className="w-4 h-4 mr-2" /> Asset Analytics
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center ${activeTab === 'scanner' ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
        >
          <ScanLine className="w-4 h-4 mr-2" /> Intelligent Scanner
        </button>
        <button
          onClick={() => setActiveTab('custody')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center ${activeTab === 'custody' ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
        >
          <Link2 className="w-4 h-4 mr-2" /> Chain of Custody
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">

          {activeTab === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {processingState === 'idle' && (
                <div className="glass p-12 rounded-xl border border-white/10 text-center max-w-2xl mx-auto mt-10">
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-12 hover:bg-white/5 transition-colors relative">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                    />
                    <UploadCloud className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-200">Upload Asset or Evidence Image</h3>
                    <p className="text-sm text-gray-500 mt-2">Zia AI will auto-detect the barcode format (QR, Code 128, PDF417, etc.) and decode.</p>
                  </div>
                </div>
              )}

              {processingState === 'scanning' && (
                <div className="glass p-12 rounded-xl border border-white/10 text-center max-w-2xl mx-auto mt-10">
                  <div className="space-y-6">
                    <ScanLine className="w-16 h-16 mx-auto text-cyan-400 animate-pulse" />
                    <h3 className="text-xl font-bold text-gray-200">Scanning Image...</h3>
                    <div className="text-sm text-cyan-400 space-y-2">
                      <p className="animate-pulse opacity-75">Enhancing image and correcting perspective...</p>
                      <p className="animate-pulse opacity-50">Localizing machine-readable codes...</p>
                    </div>
                  </div>
                </div>
              )}

              {processingState === 'complete' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                  {/* Bounding Box Viewer */}
                  <div className="lg:col-span-2 glass rounded-xl border border-white/10 flex flex-col h-full overflow-hidden">
                    <div className="p-3 bg-black/40 border-b border-white/10 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-gray-300">Decoded Evidence Label</span>
                        <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">1 Barcode Detected</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">Target Case:</span>
                          <select 
                            value={targetCaseId}
                            onChange={(e) => setTargetCaseId(e.target.value)}
                            className="bg-black/50 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-400"
                          >
                            {cases.filter((c: any) => c.status !== 'Completed').map((c: any) => (
                              <option key={c.id} value={c.id}>
                                {c.id} — {c.type} ({c.status})
                              </option>
                            ))}
                          </select>
                        </div>
                        <button onClick={handleIndexToCase} className="bg-success/20 hover:bg-success/30 text-success px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center">
                           <Link className="w-3 h-3 mr-1.5" /> Index to Case
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center p-4">
                      <div className="w-full max-w-3xl aspect-video bg-gray-800 rounded relative border border-white/5 overflow-hidden flex items-center justify-center group">
                        {file ? (
                          <img src={URL.createObjectURL(file)} className="max-w-full max-h-full object-contain" alt="Scanned Barcode Preview" />
                        ) : (
                          <ImageIcon className="absolute inset-0 m-auto text-gray-700 w-24 h-24 opacity-20" />
                        )}

                        {/* Overlay to upload another image on hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileUpload}
                          />
                          <UploadCloud className="w-12 h-12 text-white mb-2" />
                          <span className="text-white font-medium">Upload Another Barcode</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decoded Data List */}
                  <div className="glass rounded-xl border border-white/10 flex flex-col h-full overflow-hidden">
                    <div className="p-3 bg-black/40 border-b border-white/10">
                      <span className="text-sm font-semibold text-gray-300">Extracted Asset Metadata</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {scannedResult ? (
                        <div className="bg-cyan-400/10 border border-cyan-400/30 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-cyan-400 text-lg break-all">{scannedResult.content}</h4>
                            <QrCode className="w-5 h-5 text-cyan-400 flex-shrink-0 ml-2" />
                          </div>
                          <p className="text-xs text-gray-400 mb-4">Decoded Value</p>

                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Format</p>
                              <p className="text-sm font-mono text-gray-200">{scannedResult.format || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Asset System Match</p>
                              <p className="text-sm text-gray-200">
                                {(() => {
                                  const val = scannedResult.content;
                                  if (val === '8901063001022') return 'Britannia NutriChoice 5 Grain Digestive Biscuits (200g)';
                                  if (val.startsWith('http')) return 'External Web Link (URL)';
                                  return `Record Lookup: ${val}`;
                                })()}
                              </p>
                            </div>
                            <button
                              onClick={() => { setProcessingState('idle'); setFile(null); }}
                              className="mt-6 w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 py-2 rounded-lg text-sm transition-colors border border-cyan-500/30"
                            >
                              Upload Another Barcode
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 mt-10">No barcode data available.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'dashboard' && (() => {
            const totalAssets = sessionBarcodes.length;
            const activeEvidence = sessionBarcodes.filter(b => /evidence|asset/i.test(b.type)).length;
            const seizedWeapons = sessionBarcodes.filter(b => /weapon/i.test(b.type)).length;
            const atForensic = sessionBarcodes.filter(b => /forensic|hq/i.test(b.location)).length;
            
            const qrCount = sessionBarcodes.filter(b => b.format === 'QR_CODE').length;
            const code128Count = sessionBarcodes.filter(b => b.format === 'CODE_128').length;
            const pdf417Count = sessionBarcodes.filter(b => b.format === 'PDF417').length;
            const ean13Count = sessionBarcodes.filter(b => b.format === 'EAN_13').length;
            
            const getPct = (cnt: number) => totalAssets ? Math.round((cnt/totalAssets)*100) : 0;
            const qrPct = getPct(qrCount);
            const code128Pct = getPct(code128Count);
            const pdf417Pct = getPct(pdf417Count);
            const ean13Pct = getPct(ean13Count);

            return (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-xl border-l-4 border-l-cyan-400">
                  <p className="text-xs text-gray-400 mb-1">Total Assets Tracked</p>
                  <h3 className="text-2xl font-bold text-white">{totalAssets}</h3>
                </div>
                <div className="glass p-5 rounded-xl border-l-4 border-l-blue-500">
                  <p className="text-xs text-gray-400 mb-1">Active Evidence Bags</p>
                  <h3 className="text-2xl font-bold text-white">{activeEvidence}</h3>
                </div>
                <div className="glass p-5 rounded-xl border-l-4 border-l-purple-500">
                  <p className="text-xs text-gray-400 mb-1">Seized Weapons</p>
                  <h3 className="text-2xl font-bold text-white">{seizedWeapons}</h3>
                </div>
                <div className="glass p-5 rounded-xl border-l-4 border-l-success">
                  <p className="text-xs text-gray-400 mb-1">Items at Forensic Lab</p>
                  <h3 className="text-2xl font-bold text-white">{atForensic}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-gray-200">Barcode Format Distribution</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">QR Code (Evidence & Officers)</span><span className="text-gray-400">{qrPct}%</span></div>
                      <div className="w-full h-2 bg-black/40 rounded-full"><div className="h-full bg-cyan-400 rounded-full" style={{ width: `${qrPct}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Code 128 (Weapons & Storage)</span><span className="text-gray-400">{code128Pct}%</span></div>
                      <div className="w-full h-2 bg-black/40 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${code128Pct}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">PDF417 (ID Cards & Licenses)</span><span className="text-gray-400">{pdf417Pct}%</span></div>
                      <div className="w-full h-2 bg-black/40 rounded-full"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${pdf417Pct}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">EAN-13 (Commercial Products)</span><span className="text-gray-400">{ean13Pct}%</span></div>
                      <div className="w-full h-2 bg-black/40 rounded-full"><div className="h-full bg-gray-400 rounded-full" style={{ width: `${ean13Pct}%` }}></div></div>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-gray-200">Recent Asset Scans</h3>
                  <div className="space-y-3">
                    {sessionBarcodes.slice(0, 5).map(item => (
                      <div key={item.id} className="bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                        <div className="flex items-center">
                          <Box className="w-8 h-8 text-cyan-400 bg-cyan-400/10 p-1.5 rounded mr-3" />
                          <div>
                            <p className="text-sm font-bold text-gray-200">{item.value}</p>
                            <p className="text-xs text-gray-500">{item.type} • {item.format}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-primary">{item.location}</p>
                          <p className="text-[10px] text-gray-500">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })()}

          {activeTab === 'custody' && (() => {
            const custodyItem = sessionBarcodes[0] || MOCK_BARCODES[0];
            const dynamicChain = [
              { step: 1, title: 'Evidence Collected', officer: 'Insp. Ramesh', loc: 'Crime Scene (MG Road)', time: 'July 1, 09:00 AM' },
              { step: 2, title: 'Transported to Station', officer: 'Const. Suresh', loc: 'Central Police Station', time: 'July 1, 10:00 AM' },
              { step: 3, title: 'Asset Scan (Live Entry)', officer: 'Current User', loc: custodyItem.location, time: custodyItem.date }
            ];

            return (
            <motion.div
              key="custody"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input type="text" placeholder="Search Barcode ID or Decoded Value..." className="bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 w-80" />
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-gray-200">{custodyItem.value}</h3>
                  <p className="text-xs text-cyan-400">Case: {custodyItem.case}</p>
                </div>
              </div>

              <div className="glass p-8 rounded-xl border border-white/10 max-w-3xl mx-auto">
                <h3 className="text-xl font-bold text-gray-200 mb-8 text-center">Digital Chain of Custody</h3>

                <div className="relative border-l-2 border-cyan-500/30 ml-4 space-y-8">
                  {dynamicChain.map((item, idx) => (
                    <div key={idx} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] border-2 border-black"></div>

                      <div className="bg-black/40 border border-white/5 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-200">{item.title}</h4>
                          <span className="text-xs text-gray-500 font-mono">{item.time}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-primary">{item.loc}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Handling Officer</p>
                            <p className="text-gray-300">{item.officer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Active/Pending Node */}
                  <div className="relative pl-8 opacity-50">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-600 border-2 border-black"></div>
                    <div className="border border-dashed border-gray-600 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-400">Awaiting Court Submission</h4>
                      <p className="text-xs text-gray-500 mt-1">Next scheduled scan point</p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
            );
          })()}

        </AnimatePresence>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BarcodeIntelligence;
