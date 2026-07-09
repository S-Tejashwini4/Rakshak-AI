import { useState, useMemo, useEffect, useRef } from 'react';
import { Map, Layers, Navigation, AlertTriangle, Shield, Thermometer, Filter, Crosshair, Users, CheckCircle, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useToastStore } from '../store/toastStore';
import { useCaseStore } from '../store/caseStore';
import { useThemeStore } from '../store/themeStore';

const MAP_CENTER: [number, number] = [14.0, 75.7139];
const ZOOM_LEVEL = 7;

// ---------- Geocoding helpers ----------
const KARNATAKA_LOCATION_COORDS: Record<string, [number, number]> = {
  'ramakrishna nagar': [12.2828, 76.6235],
  'ramakrishnagar': [12.2828, 76.6235],
  'agrahara': [12.2985, 76.6521],
  'mysuru central': [12.3058, 76.6553],
  'mysore': [12.2958, 76.6394],
  'mysuru': [12.2958, 76.6394],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'vijayanagar': [12.9560, 77.5350],
  'hebbal': [13.0354, 77.5988],
  'koramangala': [12.9352, 77.6245],
  'jayanagar': [12.9308, 77.5831],
  'jp nagar': [12.9107, 77.5857],
  'indiranagar': [12.9784, 77.6408],
  'whitefield': [12.9698, 77.7499],
  'electronic city': [12.8399, 77.6770],
  'hubballi': [15.3647, 75.1240],
  'hubli': [15.3647, 75.1240],
  'dharwad': [15.4589, 75.0078],
  'mangaluru': [12.9141, 74.8560],
  'mangalore': [12.9141, 74.8560],
  'belagavi': [15.8497, 74.4977],
  'belgaum': [15.8497, 74.4977],
  'gulbarga': [17.3297, 76.8343],
  'kalaburagi': [17.3297, 76.8343],
  'davangere': [14.4644, 75.9218],
  'tumkur': [13.3379, 77.1173],
  'shivamogga': [13.9299, 75.5681],
  'shimoga': [13.9299, 75.5681],
  'udupi': [13.3409, 74.7421],
  'raichur': [16.2120, 77.3566],
  'ballari': [15.1394, 76.9214],
  'vijayapura': [16.8302, 75.7100],
  'bijapur': [16.8302, 75.7100],
  'hassan': [13.0068, 76.0996],
  'chikkamagaluru': [13.3161, 75.7720],
  'madikeri': [12.4244, 75.7382],
};

function resolveLocationCoords(location: string, district?: string): [number, number] | null {
  const locLower = (location || '').toLowerCase();
  for (const [key, coords] of Object.entries(KARNATAKA_LOCATION_COORDS)) {
    if (locLower.includes(key)) return coords;
  }
  if (district) {
    const distLower = district.toLowerCase();
    for (const [key, coords] of Object.entries(KARNATAKA_LOCATION_COORDS)) {
      if (distLower.includes(key)) return coords;
    }
  }
  return null;
}

// ---------- Custom Marker Icon ----------
const createCustomIcon = (risk: string, layer: string, hasDeployedActions: boolean) => {
  let colorClass = risk === 'Critical' ? 'bg-danger' : risk === 'High' ? 'bg-warning' : 'bg-primary';
  let innerIcon = '';

  if (layer === 'patrol') {
    colorClass = 'bg-cyan-500';
    innerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H8.3a2 2 0 0 0-1.6.8L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3m14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>`;
  } else if (layer === 'clusters') {
    colorClass = risk === 'Critical' ? 'bg-purple-600' : 'bg-pink-600';
    innerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  }

  const ringColorClass = hasDeployedActions ? 'bg-success' : colorClass;
  const badgeHtml = hasDeployedActions
    ? `<div class="absolute -top-2 -right-2 bg-success text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-black shadow-lg">
         <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
       </div>`
    : '';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="relative flex items-center justify-center group cursor-pointer" style="width: 24px; height: 24px;">
            <div class="absolute w-[60px] h-[60px] rounded-full animate-pulse opacity-40 blur-md ${ringColorClass}" style="left: -18px; top: -18px;"></div>
            <div class="relative z-10 w-6 h-6 rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.8)] ${colorClass} flex items-center justify-center">
              ${innerIcon}
            </div>
            ${badgeHtml}
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to recenter the map on layer change
const MapRecenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, ZOOM_LEVEL, { animate: true });
  }, [center, map]);
  return null;
};

// ---------- Patrol Unit Store (local state) ----------
interface PatrolUnit {
  id: number;
  name: string;
  lat: number;
  lng: number;
  risk: 'Critical' | 'High' | 'Medium';
  type: string;
  radius: number;
  cases: number;
  prediction: string;
  actions: string[];
  location: string;
}

const DigitalTwin = () => {
  const [activeLayer, setActiveLayer] = useState<'heat' | 'clusters' | 'patrol'>('heat');
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['Critical', 'High', 'Medium']);
  const [overlays, setOverlays] = useState({ cctv: true, cell: true, anpr: false });
  const [deployedActions, setDeployedActions] = useState<Record<number, string[]>>({});
  const [patrolUnits, setPatrolUnits] = useState<PatrolUnit[]>([]);
  const [showAddPatrol, setShowAddPatrol] = useState(false);
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [criminalNetworks, setCriminalNetworks] = useState<any[]>([]);

  // Add Patrol form state
  const [patrolForm, setPatrolForm] = useState({ name: '', location: '', type: 'Patrol Vehicle', status: 'Available' });
  // Add Network form state
  const [networkForm, setNetworkForm] = useState({ name: '', location: '', type: 'Suspect Node', risk: 'High', caseLinkId: '' });

  const { addToast } = useToastStore();
  const { cases } = useCaseStore();
  const { theme } = useThemeStore();

  // ---- Derive Predictive Heatmap from real FIR cases ----
  const heatmapData = useMemo(() => {
    return cases
      .filter(c => c.district || c.location)
      .map((c, idx) => {
        // Prefer Nominatim-geocoded coords stored on the case, else fallback to local lookup
        let resolvedLat: number | null = null;
        let resolvedLng: number | null = null;
        if (c.lat && c.lng) {
          resolvedLat = c.lat;
          resolvedLng = c.lng;
        } else {
          const fallback = resolveLocationCoords(c.location || '', c.district);
          if (fallback) { resolvedLat = fallback[0]; resolvedLng = fallback[1]; }
        }
        if (!resolvedLat || !resolvedLng) return null;
        const offset = idx * 0.0002;
        return {
          id: 1000 + idx,
          name: `FIR: ${c.id} — ${c.location || c.district}`,
          lat: resolvedLat + offset,
          lng: resolvedLng + offset,
          risk: c.priority === 'High' ? 'Critical' : c.priority === 'Medium' ? 'High' : 'Medium',
          type: c.type || 'Unclassified',
          radius: 30,
          cases: 1,
          caseRef: c.id,
          suspect: c.suspectName || 'Unknown',
          victim: c.victimName || 'Unknown',
          prediction: `FIR ${c.id} filed on ${c.date || 'N/A'}. Type: ${c.type || 'Unknown'}. Status: ${c.status || 'Active'}. Suspect: ${c.suspectName || 'Unknown'}.`,
          actions: ['Deploy Rapid Response', 'Initiate Preliminary Investigation', 'Request Forensics'],
        };
      })
      .filter(Boolean) as any[];
  }, [cases]);

  // ---- Derive Criminal Networks from suspects in FIRs + manually added ----
  const clusterData = useMemo(() => {
    const fromFirs = cases
      .filter(c => c.suspectName && c.suspectName !== 'Unknown' && (c.location || c.district))
      .map((c, idx) => {
        let resolvedLat: number | null = null;
        let resolvedLng: number | null = null;
        if (c.lat && c.lng) {
          resolvedLat = c.lat;
          resolvedLng = c.lng;
        } else {
          const fallback = resolveLocationCoords(c.location || '', c.district);
          if (fallback) { resolvedLat = fallback[0]; resolvedLng = fallback[1]; }
        }
        if (!resolvedLat || !resolvedLng) return null;
        const offset = idx * 0.0002;
        return {
          id: 2000 + idx,
          name: `Suspect: ${c.suspectName}`,
          lat: resolvedLat + offset,
          lng: resolvedLng + offset,
          risk: c.priority === 'High' ? 'Critical' : c.priority === 'Medium' ? 'High' : 'Medium',
          type: 'Suspect Node',
          radius: 30,
          cases: 1,
          caseRef: c.id,
          suspect: c.suspectName,
          prediction: `Linked to FIR: ${c.id}. Crime type: ${c.type || 'Unknown'}. Last known location: ${c.location || c.district}.`,
          actions: ['Issue Lookout Notice', 'Initiate Surveillance', 'Coordinate with Narcotics Bureau'],
        };
      })
      .filter(Boolean) as any[];

    return [...fromFirs, ...criminalNetworks];
  }, [cases, criminalNetworks]);

  // ---- Live Patrol: only from manually added units ----
  const patrolData = useMemo(() => patrolUnits, [patrolUnits]);

  const currentData = useMemo(() => {
    switch (activeLayer) {
      case 'heat': return heatmapData;
      case 'clusters': return clusterData;
      case 'patrol': return patrolData;
      default: return heatmapData;
    }
  }, [activeLayer, heatmapData, clusterData, patrolData]);

  const visibleHotspots = useMemo(() => {
    if (activeLayer === 'patrol') return currentData; // Patrol units always show regardless of threat filter
    return currentData.filter(spot => activeFilters.includes(spot.risk));
  }, [currentData, activeFilters, activeLayer]);

  const handleLayerChange = (layer: 'heat' | 'clusters' | 'patrol') => {
    setActiveLayer(layer);
    setSelectedHotspot(null);
  };

  const handleQuickResponse = () => {
    if (selectedHotspot) {
      addToast(`Emergency response units deployed to ${selectedHotspot.name}!`, 'success');
      setDeployedActions(prev => ({
        ...prev,
        [selectedHotspot.id]: [...(prev[selectedHotspot.id] || []), 'Global Deploy']
      }));
    } else {
      addToast('General Quick Response Units placed on standby.', 'info');
    }
  };

  const handleSpecificAction = (action: string) => {
    if (!selectedHotspot) return;
    const isAlreadyDeployed = deployedActions[selectedHotspot.id]?.includes(action);
    if (isAlreadyDeployed) return;
    addToast(`Executing: "${action}" at ${selectedHotspot.name}`, 'success');
    setDeployedActions(prev => ({
      ...prev,
      [selectedHotspot.id]: [...(prev[selectedHotspot.id] || []), action]
    }));
  };

  const toggleFilter = (level: string) => {
    setActiveFilters(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
    setSelectedHotspot(null);
  };

  const getLayerTitle = () => {
    if (activeLayer === 'heat') return 'FIR Intelligence';
    if (activeLayer === 'clusters') return 'Suspect Profile';
    return 'Unit Status';
  };

  const getPredictionTitle = () => {
    if (activeLayer === 'heat') return 'Case Details';
    if (activeLayer === 'clusters') return 'Link Analysis';
    return 'Current Dispatch';
  };

  // --- Add Patrol Unit ---
  const handleAddPatrol = () => {
    if (!patrolForm.name || !patrolForm.location) {
      addToast('Please fill Unit Name and Location.', 'error');
      return;
    }
    const coords = resolveLocationCoords(patrolForm.location);
    if (!coords) {
      addToast('Could not resolve location. Please use a recognized Karnataka locality name.', 'error');
      return;
    }
    const newUnit: PatrolUnit = {
      id: Date.now(),
      name: patrolForm.name,
      lat: coords[0],
      lng: coords[1],
      location: patrolForm.location,
      risk: 'Medium',
      type: patrolForm.type,
      radius: 20,
      cases: 0,
      prediction: `${patrolForm.name} is currently patrolling ${patrolForm.location}. Status: ${patrolForm.status}.`,
      actions: ['Redirect to Hotspot', 'Request Status Update', 'Dispatch Backup'],
    };
    setPatrolUnits(prev => [...prev, newUnit]);
    setPatrolForm({ name: '', location: '', type: 'Patrol Vehicle', status: 'Available' });
    setShowAddPatrol(false);
    addToast(`Patrol unit "${patrolForm.name}" added successfully.`, 'success');
  };

  const handleRemovePatrol = (id: number) => {
    setPatrolUnits(prev => prev.filter(u => u.id !== id));
    if (selectedHotspot?.id === id) setSelectedHotspot(null);
    addToast('Patrol unit removed.', 'info');
  };

  // --- Add Criminal Network Node ---
  const handleAddNetwork = () => {
    if (!networkForm.name || !networkForm.location) {
      addToast('Please fill Node Name and Location.', 'error');
      return;
    }
    const coords = resolveLocationCoords(networkForm.location);
    if (!coords) {
      addToast('Could not resolve location. Please use a recognized Karnataka locality name.', 'error');
      return;
    }
    const linkedCase = cases.find(c => c.id === networkForm.caseLinkId);
    const newNode: any = {
      id: Date.now(),
      name: networkForm.name,
      lat: coords[0],
      lng: coords[1],
      risk: networkForm.risk,
      type: networkForm.type,
      radius: 30,
      cases: linkedCase ? 1 : 0,
      caseRef: networkForm.caseLinkId || null,
      prediction: `Manually added criminal network node at ${networkForm.location}.${linkedCase ? ` Linked to FIR: ${networkForm.caseLinkId}.` : ''}`,
      actions: ['Issue Lookout Notice', 'Initiate Surveillance', 'Coordinate with Narcotics Bureau'],
    };
    setCriminalNetworks(prev => [...prev, newNode]);
    setNetworkForm({ name: '', location: '', type: 'Suspect Node', risk: 'High', caseLinkId: '' });
    setShowAddNetwork(false);
    addToast(`Network node "${networkForm.name}" added successfully.`, 'success');
  };

  const handleRemoveNetwork = (id: number) => {
    setCriminalNetworks(prev => prev.filter(n => n.id !== id));
    if (selectedHotspot?.id === id) setSelectedHotspot(null);
    addToast('Network node removed.', 'info');
  };


  return (
    <div className="h-full flex flex-col space-y-4 relative">
      <div className="flex justify-between items-center z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center">
            <Map className="mr-2 text-primary" /> Digital Twin: Karnataka Crime Ecosystem
          </h2>
          <p className="text-sm text-gray-400 mt-1">Real-time predictive GIS mapping driven by filed FIRs and case data</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleLayerChange('heat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${activeLayer === 'heat' ? 'bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
          >
            <Thermometer className="w-4 h-4 mr-2" /> Predictive Heatmap
          </button>
          <button
            onClick={() => handleLayerChange('clusters')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${activeLayer === 'clusters' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
          >
            <Users className="w-4 h-4 mr-2" /> Criminal Networks
          </button>
          <button
            onClick={() => handleLayerChange('patrol')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${activeLayer === 'patrol' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
          >
            <Shield className="w-4 h-4 mr-2" /> Live Patrol Units
          </button>
        </div>
      </div>

      <div className="flex-1 glass rounded-xl border border-gray-200 dark:border-white/10 relative overflow-hidden flex bg-gray-100 dark:bg-[#0f172a]">

        {/* Leaflet Map */}
        <div className="absolute inset-0 z-0 map-container-override">
          <style>{`
            .leaflet-container { background: ${theme === 'dark' ? '#0f172a' : '#f3f4f6'} !important; height: 100%; width: 100%; font-family: inherit; }
            .leaflet-bar a { background-color: ${theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'} !important; color: ${theme === 'dark' ? 'white' : 'black'} !important; border: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important; }
            .leaflet-bar a:hover { background-color: ${theme === 'dark' ? 'rgba(34, 211, 238, 0.2)' : 'rgba(0, 0, 0, 0.1)'} !important; }
            .leaflet-control-attribution { background: ${theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'} !important; color: ${theme === 'dark' ? '#888' : '#333'} !important; }
          `}</style>
          <MapContainer center={MAP_CENTER} zoom={ZOOM_LEVEL} zoomControl={true} scrollWheelZoom={true}>
            <MapRecenter center={MAP_CENTER} />
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url={theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
            />
            {visibleHotspots.map(spot => {
              const hasActions = deployedActions[spot.id] && deployedActions[spot.id].length > 0;
              return (
                <Marker
                  key={`${activeLayer}-${spot.id}-${hasActions ? 'active' : 'idle'}`}
                  position={[spot.lat, spot.lng]}
                  icon={createCustomIcon(spot.risk, activeLayer, hasActions)}
                  eventHandlers={{ click: () => setSelectedHotspot(spot) }}
                >
                  <Tooltip direction="top" offset={[0, -10]} className="custom-tooltip !bg-white dark:!bg-gray-900 !border-gray-200 dark:!border-gray-700 !text-gray-900 dark:!text-white rounded p-1 shadow-md">
                    {spot.name}
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>




        {/* Info / Filter Panel */}
        <div className="absolute left-4 top-4 bottom-4 w-72 bg-white/90 dark:bg-black/70 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-4 z-[400] flex flex-col shadow-2xl overflow-y-auto">
          <h3 className="text-gray-900 dark:text-white font-bold text-base mb-3 flex items-center border-b border-gray-200 dark:border-white/10 pb-3">
            <Filter className="w-4 h-4 mr-2 text-primary" /> Filters & Controls
          </h3>

          {activeLayer !== 'patrol' && (
            <div className="bg-gray-100 dark:bg-white/5 rounded p-3 border border-gray-200 dark:border-white/5 mb-3">
              <label className="text-xs text-gray-600 dark:text-gray-500 uppercase font-bold block mb-2">Threat Level</label>
              <div className="flex flex-wrap gap-2">
                {['Critical', 'High', 'Medium'].map(level => (
                  <span
                    key={level}
                    onClick={() => toggleFilter(level)}
                    className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors border ${
                      activeFilters.includes(level)
                        ? level === 'Critical' ? 'bg-danger/20 text-danger border-danger/30'
                          : level === 'High' ? 'bg-warning/20 text-warning border-warning/30'
                          : 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-transparent text-gray-500 border-gray-700 hover:bg-white/5'
                    }`}
                  >{level}</span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-100 dark:bg-white/5 rounded p-3 border border-gray-200 dark:border-white/5 mb-3">
            <label className="text-xs text-gray-600 dark:text-gray-500 uppercase font-bold block mb-2">Data Overlays</label>
            <div className="space-y-2">
              {[['cctv', 'CCTV Camera Nodes'], ['cell', 'Cell Tower Ranges'], ['anpr', 'Auto Number Plate Recognition']].map(([key, label]) => (
                <label key={key} className="flex items-center text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={(overlays as any)[key]} onChange={() => setOverlays(p => ({ ...p, [key]: !(p as any)[key] }))} className="mr-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary focus:ring-primary" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Layer-specific list */}
          {activeLayer === 'patrol' && (
            <div className="flex-1 space-y-2 overflow-y-auto mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 uppercase font-bold">Active Units ({patrolUnits.length})</span>
                <button onClick={() => setShowAddPatrol(true)} className="text-xs bg-cyan-600 text-white px-2 py-1 rounded flex items-center hover:bg-cyan-700">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </button>
              </div>
              {patrolUnits.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No patrol units. Click Add above.</p>}
              {patrolUnits.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-gray-100 dark:bg-white/5 p-2 rounded border border-gray-200 dark:border-white/5">
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{u.name}</p>
                    <p className="text-[10px] text-gray-500">{u.type} — {u.location}</p>
                  </div>
                  <button onClick={() => handleRemovePatrol(u.id)} className="text-danger/60 hover:text-danger">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeLayer === 'clusters' && (
            <div className="flex-1 space-y-2 overflow-y-auto mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 uppercase font-bold">Manual Nodes ({criminalNetworks.length})</span>
                <button onClick={() => setShowAddNetwork(true)} className="text-xs bg-purple-600 text-white px-2 py-1 rounded flex items-center hover:bg-purple-700">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </button>
              </div>
              {criminalNetworks.length === 0 && <p className="text-xs text-gray-500 text-center py-2">FIR suspects auto-mapped. Add nodes manually above.</p>}
              {criminalNetworks.map(n => (
                <div key={n.id} className="flex items-center justify-between bg-gray-100 dark:bg-white/5 p-2 rounded border border-gray-200 dark:border-white/5">
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{n.name}</p>
                    <p className="text-[10px] text-gray-500">{n.type} — {n.risk}</p>
                  </div>
                  <button onClick={() => handleRemoveNetwork(n.id)} className="text-danger/60 hover:text-danger">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleQuickResponse} className="w-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center mt-auto">
            <Navigation className="w-4 h-4 mr-2" /> Global Deploy Quick Response
          </button>
        </div>

        {/* Contextual Action Panel */}
        <AnimatePresence>
          {selectedHotspot && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-4 bottom-4 w-96 bg-white/95 dark:bg-black/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-5 z-[400] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4 border-b border-gray-200 dark:border-white/10 pb-4">
                <div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded mb-2 inline-block ${selectedHotspot.risk === 'Critical' ? 'bg-danger/20 text-danger' : selectedHotspot.risk === 'High' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}`}>
                    {selectedHotspot.risk} Risk Area
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <Crosshair className="w-4 h-4 mr-2 text-primary" /> {selectedHotspot.name}
                  </h3>
                </div>
                <button onClick={() => setSelectedHotspot(null)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl">✕</button>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{getLayerTitle()}</h4>
                  <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/5 space-y-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Type:</strong> {selectedHotspot.type}</p>
                    {selectedHotspot.caseRef && <p className="text-sm text-gray-800 dark:text-gray-200"><strong>FIR ID:</strong> {selectedHotspot.caseRef}</p>}
                    {selectedHotspot.suspect && activeLayer !== 'patrol' && <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Suspect:</strong> {selectedHotspot.suspect}</p>}
                    {selectedHotspot.victim && activeLayer === 'heat' && <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Victim:</strong> {selectedHotspot.victim}</p>}
                    <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Active Cases:</strong> {selectedHotspot.cases}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 text-warning" /> {getPredictionTitle()}
                  </h4>
                  <div className="bg-warning/10 p-3 rounded-lg border border-warning/20 text-warning text-sm">
                    {selectedHotspot.prediction}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Recommended Actions</h4>
                  <ul className="space-y-2">
                    {selectedHotspot.actions.map((action: string, idx: number) => {
                      const isDeployed = deployedActions[selectedHotspot.id]?.includes(action);
                      return (
                        <li
                          key={idx}
                          onClick={() => handleSpecificAction(action)}
                          className={`flex items-center text-sm p-3 rounded border transition-all ${
                            isDeployed
                              ? 'bg-success/20 border-success/50 text-gray-900 dark:text-white cursor-default'
                              : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer border-gray-200 dark:border-white/5'
                          }`}
                        >
                          {isDeployed ? <CheckCircle className="w-4 h-4 mr-2 text-success" /> : <Shield className="w-4 h-4 mr-2 text-primary" />}
                          <span className={isDeployed ? 'font-semibold' : ''}>{isDeployed ? `${action} (Deployed)` : action}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Patrol Unit Modal */}
        <AnimatePresence>
          {showAddPatrol && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg flex items-center"><Shield className="w-5 h-5 mr-2 text-cyan-500" /> Add Patrol Unit</h3>
                  <button onClick={() => setShowAddPatrol(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-900 dark:hover:text-white" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Unit Name *</label>
                    <input value={patrolForm.name} onChange={e => setPatrolForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Unit Delta-1" className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Location (Karnataka locality) *</label>
                    <input value={patrolForm.location} onChange={e => setPatrolForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Agrahara, Mysuru" className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Unit Type</label>
                    <select value={patrolForm.type} onChange={e => setPatrolForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option>Patrol Vehicle</option>
                      <option>Interceptor</option>
                      <option>K9 Unit</option>
                      <option>Forensic Van</option>
                      <option>Rapid Response Team</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Status</label>
                    <select value={patrolForm.status} onChange={e => setPatrolForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option>Available</option>
                      <option>On Duty</option>
                      <option>En Route</option>
                      <option>Standby</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddPatrol(false)} className="flex-1 bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white py-2 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">Cancel</button>
                  <button onClick={handleAddPatrol} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors">Add Unit</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Criminal Network Node Modal */}
        <AnimatePresence>
          {showAddNetwork && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg flex items-center"><Users className="w-5 h-5 mr-2 text-purple-500" /> Add Criminal Network Node</h3>
                  <button onClick={() => setShowAddNetwork(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-900 dark:hover:text-white" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Node Name / Suspect *</label>
                    <input value={networkForm.name} onChange={e => setNetworkForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ravi Kumar (Cartel Leader)" className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Last Known Location *</label>
                    <input value={networkForm.location} onChange={e => setNetworkForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Ramakrishna Nagar, Mysuru" className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Node Type</label>
                    <select value={networkForm.type} onChange={e => setNetworkForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option>Suspect Node</option>
                      <option>Cartel Leader</option>
                      <option>Distributor</option>
                      <option>Money Launderer</option>
                      <option>Informant</option>
                      <option>Safe House</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Threat Level</label>
                    <select value={networkForm.risk} onChange={e => setNetworkForm(p => ({ ...p, risk: e.target.value }))} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Link to FIR Case ID (optional)</label>
                    <select value={networkForm.caseLinkId} onChange={e => setNetworkForm(p => ({ ...p, caseLinkId: e.target.value }))} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option value="">-- None --</option>
                      {cases.map(c => <option key={c.id} value={c.id}>{c.id} ({c.type})</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddNetwork(false)} className="flex-1 bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white py-2 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">Cancel</button>
                  <button onClick={handleAddNetwork} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">Add Node</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default DigitalTwin;
