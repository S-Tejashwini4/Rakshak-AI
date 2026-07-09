import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, UploadCloud, ChevronLeft, ChevronRight, User, Smile, Calendar, CheckCircle, Code, Database } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { useNavigate } from 'react-router-dom';
import { useTimelineStore } from '../store/timelineStore';
import { useCaseStore, useAssignedCases } from '../store/caseStore';

type SDKTab = 'Java SDK' | 'NodeJS SDK' | 'Python SDK';

const FaceIntelligence = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [facesList, setFacesList] = useState<any[]>([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState(0);
  const [targetCaseId, setTargetCaseId] = useState('104430006202600001');
  
  const [imageDims, setImageDims] = useState({ width: 0, height: 0, displayWidth: 0, displayHeight: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [activeSdkTab, setActiveSdkTab] = useState<SDKTab>('NodeJS SDK');
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const { addEvent } = useTimelineStore();
  const cases = useAssignedCases();

  useEffect(() => {
    if (cases.length > 0 && !cases.find(c => c.id === targetCaseId)) {
      setTargetCaseId(cases[0].id);
    }
  }, [cases, targetCaseId]);

  const handleIndexToCase = () => {
    if (!facesList.length) return;
    const selectedFace = facesList[selectedFaceIndex];
    addEvent({
      caseId: targetCaseId,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'Facial Intelligence Logged',
      type: 'evidence',
      desc: `Facial vector extracted from uploaded evidence. Matched metrics: ${selectedFace.gender?.prediction || selectedFace.gender}, ${selectedFace.age?.prediction || selectedFace.age} years old. Confidence score recorded.`,
      iconName: 'ScanFace',
      color: 'text-primary',
      bg: 'bg-primary/20'
    });
    
    addToast('Facial vector and metadata successfully indexed to Case Database!', 'success');
    navigate(`/timeline?caseId=${targetCaseId}`);
  };

  useEffect(() => {
    if (!imageRef.current || !imageContainerRef.current) return;
    const observer = new ResizeObserver(() => {
       if (imageRef.current) {
         setImageDims(prev => ({
           ...prev,
           displayWidth: imageRef.current!.width,
           displayHeight: imageRef.current!.height
         }));
       }
    });
    observer.observe(imageContainerRef.current);
    return () => observer.disconnect();
  }, [previewUrl, activeTab]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDims({
      width: img.naturalWidth,
      height: img.naturalHeight,
      displayWidth: img.width,
      displayHeight: img.height
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let selectedFile = e.target.files[0];
      setFile(selectedFile);
      setProcessingState('analyzing');
      setPreviewUrl(URL.createObjectURL(selectedFile));
      
      try {
        // Convert to JPEG before sending, because Zia only accepts JPG/PNG natively
        if (!selectedFile.type.match('image/jpeg') && !selectedFile.type.match('image/png')) {
          selectedFile = await new Promise<File>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) ctx.drawImage(img, 0, 0);
              canvas.toBlob((blob) => {
                if (blob) {
                  const newFileName = selectedFile.name.replace(/\.[^/.]+$/, "") + ".jpg";
                  resolve(new File([blob], newFileName, { type: 'image/jpeg' }));
                } else {
                  resolve(selectedFile); // fallback to original if canvas fails
                }
              }, 'image/jpeg', 0.95);
            };
            img.onerror = () => resolve(selectedFile);
            img.src = URL.createObjectURL(selectedFile);
          });
        }

        const formData = new FormData();
        formData.append('image', selectedFile);
        
        const response = await fetch('/server/rakshak_function/api/face-analytics', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
           const errData = await response.json();
           const debugStr = errData.debug_file ? ` (File: ${errData.debug_file}, MIME: ${errData.debug_mimetype})` : '';
           throw new Error((errData.error || 'Failed to analyze face') + debugStr);
        }
        
        const data = await response.json();
        
        setProcessingState('complete');
        
        const parsedFaces = Array.isArray(data) ? data : data.faces || data.face_details || [data];
        
        if (parsedFaces && parsedFaces.length > 0) {
            setFacesList(parsedFaces);
            setSelectedFaceIndex(0);
        } else {
            setFacesList([]);
        }
        
        const facesCount = parsedFaces.length || 0;
        addToast(`Facial analysis complete. ${facesCount} face(s) detected.`, 'success');
        
        setTimeout(() => {
            setActiveTab('dashboard');
            setProcessingState('idle');
        }, 1500);
        
      } catch (error) {
        console.error(error);
        setProcessingState('idle');
        addToast('Error during facial analysis.', 'error');
      }
    }
  };

  const formatStr = (str: string) => typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().replace('_', ' ') : String(str);
  
  const selectedFace = facesList[selectedFaceIndex];

  const renderMetric = (icon: React.ReactNode, title: string, valueStr: string, confVal: any, highlightColor: string = "bg-success", textHighlight: string = "text-success") => {
      let percent = typeof confVal === 'number' ? Math.round(confVal * 100) : 
                    typeof confVal === 'string' ? Math.round(parseFloat(confVal) * 100) : 
                    typeof confVal === 'object' && confVal !== null ? (
                         Object.values(confVal).reduce((a: any, b: any) => Math.max(a, parseFloat(b)), 0) * 100
                    ) : 99;
      
      if (isNaN(percent)) percent = 99;

      return (
          <div className={`relative overflow-hidden rounded-xl border p-4 transition-colors bg-white/5 border-${textHighlight.split('-')[1]}/30`}>
              <div 
                 className={`absolute top-0 left-0 h-full ${highlightColor}/20 transition-all duration-1000`} 
                 style={{ width: `${percent}%` }}
              ></div>
              
              <div className="relative z-10 flex justify-between items-center">
                 <div className="flex items-center space-x-3">
                    <div className={`${textHighlight}`}>
                       {icon}
                    </div>
                    <div>
                       <p className="text-gray-300 font-medium">
                          {title && <span className="text-gray-400 mr-2">{title}:</span>}
                          <span className="text-white font-bold">{valueStr}</span>
                       </p>
                    </div>
                 </div>
                 <div className={`font-bold ${textHighlight}`}>
                    {Math.round(percent)}%
                 </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center">
            <ScanFace className="mr-3 text-primary w-6 h-6" /> Zia Face Analytics
          </h2>
          <p className="text-sm text-gray-400 mt-1">Deep facial analytics, emotion recognition, and demographics</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'upload' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
        >
          Upload & Detect
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
        >
          Intelligence Dashboard
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        <AnimatePresence mode="wait">
          
          {activeTab === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto mt-10"
            >
              <div className="glass p-8 rounded-xl border border-white/10 text-center shadow-lg shadow-black/50">
                <div className="border-2 border-dashed border-primary/50 rounded-xl p-12 hover:bg-primary/5 transition-colors relative">
                  <input 
                    type="file" 
                    accept="image/*,video/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={processingState === 'analyzing'}
                  />
                  {processingState === 'idle' ? (
                    <>
                      <UploadCloud className="w-16 h-16 mx-auto text-primary mb-4" />
                      <h3 className="text-xl font-bold text-gray-200">Select a Sample Image</h3>
                      <p className="text-sm text-gray-500 mt-2">Upload a photo to analyze faces.</p>
                      <button className="mt-6 px-6 py-2 bg-primary text-black font-semibold rounded-lg pointer-events-none">Upload</button>
                    </>
                  ) : processingState === 'analyzing' ? (
                    <div className="space-y-4">
                      <ScanFace className="w-16 h-16 mx-auto text-primary animate-pulse" />
                      <h3 className="text-xl font-bold text-gray-200">Analyzing Image...</h3>
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-16 h-16 mx-auto text-success mb-4" />
                      <h3 className="text-xl font-bold text-gray-200">Analysis Complete</h3>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && previewUrl && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT PANEL: IMAGE & BOUNDING BOXES */}
                    <div className="lg:col-span-2 glass rounded-xl border border-white/10 p-6 flex items-center justify-center min-h-[500px]">
                       <div className="relative max-w-full max-h-full" ref={imageContainerRef}>
                          <img 
                            src={previewUrl} 
                            alt="Analysis" 
                            className="max-h-[600px] object-contain rounded shadow-lg"
                            onLoad={handleImageLoad}
                            ref={imageRef}
                          />
                          
                          {/* Render Bounding Boxes */}
                          {imageDims.width > 0 && facesList.map((face, index) => {
                              if (!face.co_ordinates) return null;
                              const [x_min, y_min, x_max, y_max] = face.co_ordinates;
                              const left = (parseFloat(x_min) / imageDims.width) * 100;
                              const top = (parseFloat(y_min) / imageDims.height) * 100;
                              const width = ((parseFloat(x_max) - parseFloat(x_min)) / imageDims.width) * 100;
                              const height = ((parseFloat(y_max) - parseFloat(y_min)) / imageDims.height) * 100;
                              
                              const isSelected = selectedFaceIndex === index;
                              
                              return (
                                  <div 
                                     key={index}
                                     onClick={() => setSelectedFaceIndex(index)}
                                     className={`absolute cursor-pointer transition-all border-2 group ${isSelected ? 'border-primary z-20' : 'border-white/70 hover:border-white z-10 shadow-[0_0_0_1px_rgba(0,0,0,0.5)]'}`}
                                     style={{
                                         left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`
                                     }}
                                  >
                                      {isSelected && (
                                          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-primary text-black font-bold text-xs px-3 py-1 rounded shadow-lg whitespace-nowrap">
                                              Face {index + 1}
                                          </div>
                                      )}
                                      {!isSelected && (
                                          <div className="absolute inset-0 bg-black/10 group-hover:bg-white/10 transition-colors"></div>
                                      )}
                                  </div>
                              );
                          })}
                       </div>
                    </div>
                    
                    {/* RIGHT PANEL: RESULTS */}
                    <div className="glass rounded-xl border border-white/10 flex flex-col">
                       <div className="p-6 border-b border-white/10 flex justify-between items-center">
                          <h3 className="font-bold text-lg text-white">Result</h3>
                       </div>
                       
                       <div className="p-6 flex-1 flex flex-col">
                           {/* Carousel Header */}
                           <div className="flex justify-between items-center mb-6 px-4">
                               <button 
                                  onClick={() => setSelectedFaceIndex(prev => prev > 0 ? prev - 1 : facesList.length - 1)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors text-primary"
                               >
                                  <ChevronLeft />
                               </button>
                               <span className="font-bold text-white text-lg">Face {selectedFaceIndex + 1}</span>
                               <button 
                                  onClick={() => setSelectedFaceIndex(prev => prev < facesList.length - 1 ? prev + 1 : 0)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors text-primary"
                               >
                                  <ChevronRight />
                               </button>
                           </div>
                           

                           {/* Metrics */}
                           {selectedFace ? (
                               <div className="space-y-4 flex-1">
                                   {renderMetric(
                                       <ScanFace className="w-5 h-5" />, 
                                       "Face Detected", 
                                       "", 
                                       selectedFace.confidence || 1,
                                       "bg-success", "text-success"
                                   )}
                                   {renderMetric(
                                       <User className="w-5 h-5" />, 
                                       "Gender Recognized", 
                                       formatStr(selectedFace.gender?.prediction || selectedFace.gender), 
                                       selectedFace.gender?.confidence,
                                       "bg-success", "text-success"
                                   )}
                                   {renderMetric(
                                       <Smile className="w-5 h-5" />, 
                                       "", // No prefix title, just the emotion
                                       formatStr(selectedFace.emotion?.prediction || selectedFace.emotion), 
                                       selectedFace.emotion?.confidence,
                                       "bg-success", "text-success"
                                   )}
                                   {renderMetric(
                                       <Calendar className="w-5 h-5" />, 
                                       "Age Range", 
                                       (selectedFace.age?.prediction || selectedFace.age) + " years old", 
                                       selectedFace.age?.confidence,
                                       "bg-warning", "text-warning"
                                   )}
                               </div>
                           ) : (
                               <div className="flex-1 flex items-center justify-center text-gray-500">
                                   No face data available
                               </div>
                           )}
                           
                           {/* Save to Case Action */}
                           <div className="mt-8 pt-6 border-t border-white/10">
                              <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center">
                                <Database className="w-4 h-4 mr-2 text-primary" /> Store Intelligence to Case
                              </h4>
                              <div className="space-y-3">
                                <select 
                                  value={targetCaseId}
                                  onChange={(e) => setTargetCaseId(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-primary"
                                >
                                  {cases.filter((c: any) => c.status !== 'Completed').map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                      {c.id} — {c.type} ({c.status})</option>
                                  ))}
                                </select>
                                <button 
                                  onClick={handleIndexToCase}
                                  className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center text-sm shadow-lg shadow-primary/20"
                                >
                                  <Database className="w-4 h-4 mr-2" /> Index & Cross-Reference Face
                                </button>
                              </div>
                           </div>
                       </div>
                    </div>
                </div>

                {/* SDK Code Snippets removed per user request */}
            </motion.div>
          )}

          {activeTab === 'dashboard' && !previewUrl && (
             <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <ScanFace className="w-16 h-16 mb-4 opacity-50" />
                <p>No image uploaded yet.</p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 px-6 py-2 bg-primary/20 text-primary rounded-lg font-medium hover:bg-primary/30 transition-colors"
                >
                  Go to Upload
                </button>
             </div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default FaceIntelligence;
