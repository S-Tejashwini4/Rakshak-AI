import { useState, useEffect, useCallback } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { generateNetworkFromCase, CASE_MASTERS } from '../utils/mockData';
import { Network as NetworkIcon, Search, CheckCircle, Zap, ShieldAlert, FileText, User, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimelineStore } from '../store/timelineStore';
import { useCaseStore, useAssignedCases } from '../store/caseStore';
import { useToastStore } from '../store/toastStore';
import Modal from '../components/Modal';

const Network = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'editNode' | 'deleteNode' | 'editEdge' | 'deleteEdge' | 'createEdge' | 'profile' | 'profileView';
    targetId?: string;
    initialValue?: string;
    edgeParams?: any;
  }>({ isOpen: false, type: 'profile' });
  
  const storeCases = useAssignedCases();
  const { addToast } = useToastStore();
  
  const cases = [
    { id: 0, label: 'Global Syndicate View (All)' },
    ...storeCases.map((c: any) => ({
      id: c.id,
      label: `FIR ${c.id} (${c.type})`
    }))
  ];
  
  const [selectedCaseId, setSelectedCaseId] = useState<string | number>(cases[1]?.id || 0);

  useEffect(() => {
    if (cases.length > 0 && !cases.find(c => c.id === selectedCaseId)) {
      setSelectedCaseId(0);
    }
  }, [cases, selectedCaseId]);

  const { events } = useTimelineStore();

  useEffect(() => {
    if (modalState.isOpen && modalState.type === 'profile') {
      const timer = setTimeout(() => {
        setModalState(prev => ({ ...prev, type: 'profileView' }));
        addToast('Profile loaded successfully.', 'success');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [modalState.isOpen, modalState.type, addToast]);

  useEffect(() => {
    // Generate graph data from mockData based on selected case
    let data: any = { nodes: [], edges: [] };
    const caseStyle = { backgroundColor: '#1e3a8a', color: 'white', border: '2px solid #3b82f6', borderRadius: '12px', padding: '12px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' };
    const accusedStyle = { backgroundColor: '#7f1d1d', color: 'white', border: '2px solid #ef4444', borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' };
    const victimStyle = { backgroundColor: '#14532d', color: 'white', border: '2px solid #22c55e', borderRadius: '8px', padding: '10px', fontSize: '12px' };
    const compStyle = { backgroundColor: '#713f12', color: 'white', border: '2px solid #eab308', borderRadius: '8px', padding: '10px', fontSize: '12px' };
    const syndicateStyle = { backgroundColor: '#4c1d95', color: 'white', border: '2px solid #8b5cf6', borderRadius: '50%', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' };

    if (typeof selectedCaseId === 'number' && selectedCaseId === 0) {
      data.nodes.push({
        id: 'syndicate-alpha',
        position: { x: 400, y: -100 },
        data: { label: 'Syndicate Alpha\n(Organized Crime)', type: 'syndicate' },
        style: syndicateStyle
      });

      storeCases.forEach((activeCase: any, index: number) => {
        const offsetX = (index % 3) * 600 - 600;
        const offsetY = Math.floor(index / 3) * 400 + 100;

        const caseNodeId = `case-${activeCase.id}`;
        const accusedId = `accused-${activeCase.id}`;
        const victimId = `victim-${activeCase.id}`;
        const compId = `comp-${activeCase.id}`;

        const suspectLabel = activeCase?.suspectName && activeCase.suspectName !== 'Unknown' ? `Suspect\n${activeCase.suspectName}` : 'Suspect\nUnknown';
        const victimLabel = activeCase?.victimName && activeCase.victimName !== 'Unknown' ? `Victim: ${activeCase.victimName}` : 'Victim: Unknown';
        const compLabel = activeCase?.complainantName && activeCase.complainantName !== 'Unknown' ? `Complainant: ${activeCase.complainantName}` : 'Complainant: Unknown';

        data.nodes.push(
          { id: caseNodeId, position: { x: 400 + offsetX, y: 300 + offsetY }, data: { label: `FIR:\n${activeCase.id}`, type: 'case', details: null }, style: caseStyle },
          { id: accusedId, position: { x: 200 + offsetX, y: 100 + offsetY }, data: { label: suspectLabel, type: 'accused', details: null }, style: accusedStyle },
          { id: victimId, position: { x: 600 + offsetX, y: 150 + offsetY }, data: { label: victimLabel, type: 'victim', details: null }, style: victimStyle },
          { id: compId, position: { x: 400 + offsetX, y: 100 + offsetY }, data: { label: compLabel, type: 'complainant', details: null }, style: compStyle }
        );

        data.edges.push(
          { id: `e-${caseNodeId}-${accusedId}`, source: caseNodeId, target: accusedId, label: 'Accused In', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
          { id: `e-${caseNodeId}-${victimId}`, source: caseNodeId, target: victimId, label: 'Victim Of', style: { stroke: '#22c55e' } },
          { id: `e-${compId}-${caseNodeId}`, source: compId, target: caseNodeId, label: 'Filed By', style: { stroke: '#eab308' } },
          { id: `e-syn-${accusedId}`, source: 'syndicate-alpha', target: accusedId, label: 'Known Associate', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 3 } }
        );
      });
    } else {
      const activeCase = storeCases.find((c: any) => c.id === selectedCaseId);
      const isCustomCase = activeCase && activeCase.complainantName !== undefined;
      const mockCase = CASE_MASTERS.find(c => c.CrimeNo === selectedCaseId || c.CaseMasterID === selectedCaseId);
      if (mockCase && !isCustomCase) {
        data = generateNetworkFromCase(mockCase.CaseMasterID);
      } else {
        const caseStyle = { backgroundColor: '#1e3a8a', color: 'white', border: '2px solid #3b82f6', borderRadius: '12px', padding: '12px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' };
        const accusedStyle = { backgroundColor: '#7f1d1d', color: 'white', border: '2px solid #ef4444', borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' };
        const victimStyle = { backgroundColor: '#14532d', color: 'white', border: '2px solid #22c55e', borderRadius: '8px', padding: '10px', fontSize: '12px' };
        const compStyle = { backgroundColor: '#713f12', color: 'white', border: '2px solid #eab308', borderRadius: '8px', padding: '10px', fontSize: '12px' };
        
        const caseNodeId = `case-${selectedCaseId}`;
        const accusedId = `accused-${selectedCaseId}`;
        const victimId = `victim-${selectedCaseId}`;
        const compId = `comp-${selectedCaseId}`;

        // Use activeCase already fetched above
        const suspectLabel = activeCase?.suspectName && activeCase.suspectName !== 'Unknown' ? `Suspect\n${activeCase.suspectName}` : 'Suspect\nUnknown';
        const victimLabel = activeCase?.victimName && activeCase.victimName !== 'Unknown' ? `Victim: ${activeCase.victimName}` : 'Victim: Unknown';
        const compLabel = activeCase?.complainantName && activeCase.complainantName !== 'Unknown' ? `Complainant: ${activeCase.complainantName}` : 'Complainant: Unknown';

        data = {
          nodes: [
            { id: caseNodeId, position: { x: 400, y: 300 }, data: { label: `FIR:\n${selectedCaseId}`, type: 'case', details: null }, style: caseStyle },
            { id: accusedId, position: { x: 200, y: 100 }, data: { label: suspectLabel, type: 'accused', details: null }, style: accusedStyle },
            { id: victimId, position: { x: 600, y: 150 }, data: { label: victimLabel, type: 'victim', details: null }, style: victimStyle },
            { id: compId, position: { x: 400, y: 100 }, data: { label: compLabel, type: 'complainant', details: null }, style: compStyle }
          ],
          edges: [
            { id: `e-${caseNodeId}-${accusedId}`, source: caseNodeId, target: accusedId, label: 'Accused In', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
            { id: `e-${caseNodeId}-${victimId}`, source: caseNodeId, target: victimId, label: 'Victim Of', style: { stroke: '#22c55e' } },
            { id: `e-${compId}-${caseNodeId}`, source: compId, target: caseNodeId, label: 'Filed By', style: { stroke: '#eab308' } }
          ]
        };
      }
    }
    let finalNodes = [...(data.nodes || [])];
    let finalEdges = [...(data.edges || [])];

    // Dynamically inject links based on timeline events!
    const evidStyle = { backgroundColor: '#374151', color: '#e5e7eb', border: '1px dashed #9ca3af', borderRadius: '4px', padding: '8px', fontSize: '11px' };
    
    const validEvents = [
      'Facial Intelligence Logged', 
      'Document Intelligence Logged',
      'Evidence Override & Indexed',
      'Evidence Uploaded & Indexed',
      'Object Evidence Extracted',
      'Barcode Asset Logged'
    ];

    events.forEach((e, index) => {
      if (validEvents.includes(e.title)) {
        const activeCase = storeCases.find((c: any) => c.id === e.caseId);
        const isCustomCase = activeCase && activeCase.complainantName !== undefined;
        const cMaster = CASE_MASTERS.find(c => c.CrimeNo === e.caseId || c.CaseNo === e.caseId);
        
        const internalCaseId = (cMaster && !isCustomCase) ? cMaster.CaseMasterID : e.caseId;
        
        if (selectedCaseId === 0 || selectedCaseId === internalCaseId || selectedCaseId === e.caseId) {
          const caseNodeId = `case-${internalCaseId}`;
          const evidNodeId = `evid-${e.id}`;
          
          let label = 'Evidence';
          let edgeLabel = 'Linked Evidence';
          let nodeStyle = { ...evidStyle };
          
          if (e.title === 'Facial Intelligence Logged') {
             label = 'Face Intel: MATCHED\n(Via Zia Analytics)';
             edgeLabel = 'Detected Face';
             nodeStyle = { ...evidStyle, border: '2px solid #22c55e', backgroundColor: '#064e3b', boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' };
          } else if (e.title === 'Document Intelligence Logged') {
             label = 'Document Intel\n(OCR Extracted)';
             edgeLabel = 'OCR Extracted';
             nodeStyle = { ...evidStyle, border: '2px solid #3b82f6', backgroundColor: '#1e3a8a' };
          } else if (e.title === 'Evidence Override & Indexed' || e.title === 'Evidence Uploaded & Indexed') {
             label = e.title === 'Evidence Override & Indexed' ? 'Evidence Safety\n(Override)' : 'Evidence Safety\n(Safe)';
             edgeLabel = 'Safety Scan';
             nodeStyle = e.title === 'Evidence Override & Indexed' 
               ? { ...evidStyle, border: '2px solid #ef4444', backgroundColor: '#7f1d1d' }
               : { ...evidStyle, border: '2px solid #22c55e', backgroundColor: '#064e3b' };
          } else if (e.title === 'Object Evidence Extracted') {
             label = 'Visual Intel\n(Object Extracted)';
             edgeLabel = 'Zia Vision';
             nodeStyle = { ...evidStyle, border: '2px solid #8b5cf6', backgroundColor: '#4c1d95' };
          } else if (e.title === 'Barcode Asset Logged') {
             label = 'Barcode Intel\n(Asset Logged)';
             edgeLabel = 'Asset Tracker';
             nodeStyle = { ...evidStyle, border: '2px solid #06b6d4', backgroundColor: '#164e63' };
          }

          const caseNode = finalNodes.find(n => n.id === caseNodeId);
          if (caseNode) {
             finalNodes.push({
               id: evidNodeId,
               position: { x: caseNode.position.x - 100 + (index * 50), y: caseNode.position.y + 150 + (index * 20) }, // Add slight offset to avoid overlaps
               data: { label, type: 'evidence' },
               style: nodeStyle
             });

             // Draw edge to case node
             finalEdges.push({
               id: `e-${caseNodeId}-${evidNodeId}`,
               source: caseNodeId,
               target: evidNodeId,
               label: edgeLabel,
               animated: true,
               style: { stroke: '#8b5cf6', strokeDasharray: '5,5' }
             });

             // If it's Face Intel, also connect to Suspect
             if (e.title === 'Facial Intelligence Logged') {
               const accusedNodeId = `accused-${internalCaseId}`; // Assume first suspect for now
               const accusedNodeIndex = finalNodes.findIndex(n => n.id === accusedNodeId);
               
               if (accusedNodeIndex !== -1) {
                  // Update the unknown suspect node
                  const caseRecord = storeCases.find((c: any) => c.id === internalCaseId || c.id === selectedCaseId);
                  const suspectName = caseRecord?.suspectName && caseRecord.suspectName !== 'Unknown' ? caseRecord.suspectName : 'Unknown Subject';
                  finalNodes[accusedNodeIndex] = {
                    ...finalNodes[accusedNodeIndex],
                    data: { 
                      ...finalNodes[accusedNodeIndex].data, 
                      label: `Suspect Identified:\n${suspectName}`,
                      details: { ...finalNodes[accusedNodeIndex].data.details, AgeYear: 28, GenderID: 1 } 
                    },
                    style: { ...finalNodes[accusedNodeIndex].style, border: '2px solid #eab308', backgroundColor: '#713f12' }
                  };

                  finalEdges.push({
                    id: `e-dynamic-face-match-${e.id}`,
                    source: evidNodeId,
                    target: accusedNodeId,
                    label: 'AI Biometric Match (99%)',
                    animated: true,
                    style: { stroke: '#22c55e', strokeWidth: 3 }
                  });
               }
             }
          }
        }
      }
    });

    setNodes(finalNodes);
    setEdges(finalEdges);
    setSelectedNode(null); 
    setSelectedEdge(null);
  }, [selectedCaseId, events]);

  const onNodeClick = (event: any, node: any) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };
  
  const onEdgeClick = (event: any, edge: any) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const onConnect = useCallback((params: any) => {
    setModalState({ isOpen: true, type: 'createEdge', initialValue: 'Manual Link', edgeParams: params });
  }, []);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <NetworkIcon className="mr-2 text-primary" /> AI Relationship Network
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Interactive network analysis with Explainable AI reasoning paths</p>
        </div>
        
        <div className="flex items-end gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-64">
            <label className="block text-xs font-semibold text-gray-400 mb-1">SELECT SCOPE</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                value={selectedCaseId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCaseId(val === '0' ? 0 : val);
                }}
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-50 dark:glass rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 relative">
        <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-black/60 p-3 rounded-lg border border-gray-200 dark:border-white/10 backdrop-blur-md pointer-events-none shadow-xl">
          <h4 className="text-gray-900 dark:text-white text-sm font-bold mb-2">Knowledge Base Legend</h4>
          <ul className="text-xs space-y-2">
            <li className="flex items-center text-blue-400"><div className="w-3 h-3 rounded bg-blue-800 border border-blue-500 mr-2"></div> Master Case File</li>
            <li className="flex items-center text-red-400"><div className="w-3 h-3 rounded-full bg-red-900 border border-red-500 mr-2"></div> Suspect/Accused</li>
            <li className="flex items-center text-green-400"><div className="w-3 h-3 rounded bg-green-900 border border-green-500 mr-2"></div> Victim Profile</li>
            <li className="flex items-center text-yellow-400"><div className="w-3 h-3 rounded bg-yellow-900 border border-yellow-500 mr-2"></div> Complainant</li>
            <li className="flex items-center text-gray-700 dark:text-gray-400"><div className="w-3 h-3 rounded border border-dashed border-gray-400 bg-gray-200 dark:bg-gray-800 mr-2"></div> AI Evidence Intel</li>
            {selectedCaseId === 0 && (
              <li className="flex items-center text-purple-600 dark:text-purple-400 mt-2 pt-2 border-t border-gray-200 dark:border-white/10"><div className="w-3 h-3 rounded-full bg-purple-200 dark:bg-purple-900 border border-purple-500 mr-2 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div> Hidden Syndicate Link</li>
            )}
          </ul>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
          fitView
          className="bg-gray-100 dark:bg-transparent"
        >
          <Controls />
          <MiniMap nodeStrokeColor={() => '#3B82F6'} nodeColor={(n) => n.style?.backgroundColor as string || '#111827'} maskColor="rgba(0,0,0,0.4)" />
          <Background color="#555" gap={16} />
        </ReactFlow>

        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 bottom-4 w-80 bg-white/95 dark:bg-black/85 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-5 z-20 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {selectedNode.data?.type === 'case' ? 'Master Case File' : 
                     selectedNode.data?.type === 'evidence' ? 'Intelligence Log' : 'Entity Profile'}
                  </h3>
                  <p className="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-full inline-block">ID: {selectedNode.id}</p>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">✕</button>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {/* Dynamic Details based on type */}
                {selectedNode.data.type === 'accused' && selectedNode.data.details && (
                  <div className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Entity Overview</p>
                    <p className="text-gray-900 dark:text-gray-200 font-medium whitespace-pre-wrap">{selectedNode.data?.label}</p>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-3 space-y-1">
                      <p><span className="text-gray-400">Age:</span> {selectedNode.data.details.AgeYear}</p>
                      <p><span className="text-gray-400">Gender:</span> {selectedNode.data.details.GenderID === 1 ? 'Male' : 'Female'}</p>
                      <p><span className="text-gray-400">Threat Level:</span> <span className="text-red-500 font-bold">HIGH</span></p>
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'syndicate' && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-500/30">
                    <h4 className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-2">Syndicate Profile</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">AI identified common structural topologies across multiple files.</p>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg border border-gray-200 dark:border-white/5">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">AI Reasoning Path</h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" /> Processed via Rakshak Vision Pipeline.</li>
                    <li className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" /> 92% confidence score on extraction.</li>
                  </ul>
                </div>

                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => setModalState({ isOpen: true, type: 'editNode', targetId: selectedNode.id, initialValue: selectedNode.data?.label })} 
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 transition-colors text-gray-900 dark:text-white text-sm font-medium py-2 rounded">
                    Edit Name
                  </button>
                  <button 
                    onClick={() => setModalState({ isOpen: true, type: 'deleteNode', targetId: selectedNode.id })} 
                    className="flex-1 bg-red-500/20 hover:bg-red-500/40 transition-colors text-red-500 text-sm font-medium py-2 rounded">
                    Delete
                  </button>
                </div>
                <button onClick={() => setModalState({ isOpen: true, type: 'profile' })} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg py-2.5 text-sm font-semibold text-gray-900 dark:text-white transition-colors flex items-center justify-center">
                  <User className="w-4 h-4 mr-2" /> Access Full Profile
                </button>
              </div>
            </motion.div>
          )}

          {selectedEdge && !selectedNode && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-80 bg-white/95 dark:bg-black/85 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-5 z-20 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4 border-b border-gray-200 dark:border-white/10 pb-4">
                <div>
                  <div className="flex items-center text-primary text-xs font-bold mb-2 uppercase tracking-wider">
                    <Link2 className="w-3 h-3 mr-1" /> Relationship Link
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white whitespace-pre-wrap">{selectedEdge.label || 'Unnamed Link'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {selectedEdge.id}</p>
                </div>
                <button onClick={() => setSelectedEdge(null)} className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1 hover:bg-white/10 transition-colors">✕</button>
              </div>

              <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => setModalState({ isOpen: true, type: 'editEdge', targetId: selectedEdge.id, initialValue: selectedEdge.label })} 
                    className="flex-1 bg-white/10 hover:bg-white/20 transition-colors text-gray-900 dark:text-white text-sm font-medium py-2 rounded">
                    Edit Link
                  </button>
                  <button 
                    onClick={() => setModalState({ isOpen: true, type: 'deleteEdge', targetId: selectedEdge.id })} 
                    className="flex-1 bg-red-500/20 hover:bg-red-500/40 transition-colors text-red-500 text-sm font-medium py-2 rounded">
                    Delete
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={modalState.isOpen} onClose={() => setModalState({ ...modalState, isOpen: false })} title={
        modalState.type === 'createEdge' ? 'Create New Link' :
        modalState.type === 'editNode' ? 'Edit Node Name' :
        modalState.type === 'editEdge' ? 'Edit Link Name' :
        modalState.type === 'deleteNode' ? 'Confirm Deletion' :
        modalState.type === 'deleteEdge' ? 'Confirm Deletion' : 'Entity Profile Access'
      }>
        {modalState.type.startsWith('edit') || modalState.type === 'createEdge' ? (
          <form onSubmit={(e) => {
             e.preventDefault();
             const val = new FormData(e.currentTarget).get('val') as string;
             
             if (modalState.type === 'createEdge' && modalState.edgeParams) {
               setEdges((eds) => addEdge({ 
                 ...modalState.edgeParams, 
                 animated: true, 
                 style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '5,5' },
                 label: val || 'Manual Link' 
               }, eds));
             } else if (modalState.type === 'editNode') {
               setNodes(nds => nds.map(n => n.id === modalState.targetId ? { ...n, data: { ...n.data, label: val } } : n));
               if (selectedNode?.id === modalState.targetId) setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: val } });
             } else if (modalState.type === 'editEdge') {
               setEdges(eds => eds.map(edge => edge.id === modalState.targetId ? { ...edge, label: val } : edge));
               if (selectedEdge?.id === modalState.targetId) setSelectedEdge({ ...selectedEdge, label: val });
             }
             
             setModalState({ ...modalState, isOpen: false });
          }}>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
               {modalState.type === 'editNode' ? 'Enter new name:' : 'Enter link label:'}
            </label>
            <input name="val" defaultValue={modalState.initialValue} className="w-full bg-white dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none transition-colors mb-6" autoFocus />
            <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-white/10 pt-4">
              <button type="button" onClick={() => setModalState({ ...modalState, isOpen: false })} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-sm text-gray-600 dark:text-gray-300 font-medium">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm text-white font-bold">Save Changes</button>
            </div>
          </form>
        ) : modalState.type.startsWith('delete') ? (
          <div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete this {modalState.type === 'deleteNode' ? 'node' : 'link'}? This action will remove it from the visual graph.</p>
            <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-white/10 pt-4">
              <button onClick={() => setModalState({ ...modalState, isOpen: false })} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-sm text-gray-600 dark:text-gray-300 font-medium">Cancel</button>
              <button onClick={() => {
                 if (modalState.type === 'deleteNode') {
                    setNodes(nds => nds.filter(n => n.id !== modalState.targetId));
                    setSelectedNode(null);
                 } else {
                    setEdges(eds => eds.filter(e => e.id !== modalState.targetId));
                    setSelectedEdge(null);
                 }
                 setModalState({ ...modalState, isOpen: false });
                 addToast('Deleted successfully from visualization', 'success');
              }} className="px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-sm text-white font-bold">Confirm Delete</button>
            </div>
          </div>
        ) : modalState.type === 'profileView' ? (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-black/30 p-4 rounded-lg border border-gray-200 dark:border-white/10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                  {selectedNode?.data?.label?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedNode?.data?.label?.split('\n').pop() || 'Unknown Entity'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedNode?.id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Entity Type</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">{selectedNode?.data?.type || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Status</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">Active</span>
                </div>
                {selectedNode?.data?.details?.AgeYear && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block mb-1">Age</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedNode.data.details.AgeYear}</span>
                  </div>
                )}
                {selectedNode?.data?.details?.GenderID && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block mb-1">Gender</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedNode.data.details.GenderID === 1 ? 'Male' : 'Female'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
             <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <span className="text-white font-bold text-lg">Retrieving Secure Profile</span>
                <p className="text-center text-sm text-gray-400 mt-2">Querying central intelligence database for full dossier.</p>
             </div>
             <div className="flex justify-end border-t border-white/10 pt-4">
                <button onClick={() => setModalState({ ...modalState, isOpen: false })} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 font-medium">Close</button>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Network;

