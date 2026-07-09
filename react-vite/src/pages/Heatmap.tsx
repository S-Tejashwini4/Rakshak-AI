import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Filter } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

const MOCK_HOTSPOTS = [
  { id: 1, pos: [12.9716, 77.5946], intensity: 80, name: 'Bengaluru Central (Cyber)' },
  { id: 2, pos: [12.2958, 76.6394], intensity: 45, name: 'Mysore (Theft)' },
  { id: 3, pos: [13.3409, 74.7421], intensity: 60, name: 'Udupi (Assault)' },
  { id: 4, pos: [15.3647, 75.1240], intensity: 30, name: 'Hubli (Fraud)' },
];

const Heatmap = () => {
  const { theme } = useThemeStore();
  
  // Use a dark map tile provider for dark mode
  const tileUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center">
          <MapIcon className="mr-2 text-primary" /> Intelligence Heatmap
        </h2>
        <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center text-sm">
          <Filter className="w-4 h-4 mr-2" /> Filter Layers
        </button>
      </div>

      <div className="flex-1 glass rounded-xl overflow-hidden border border-white/10 z-0 relative">
        <MapContainer center={[15.3173, 75.7139]} zoom={6} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={tileUrl}
          />
          
          {MOCK_HOTSPOTS.map(spot => (
            <CircleMarker
              key={spot.id}
              center={spot.pos as [number, number]}
              radius={spot.intensity / 2}
              pathOptions={{
                fillColor: spot.intensity > 70 ? '#EF4444' : spot.intensity > 50 ? '#F59E0B' : '#3B82F6',
                color: spot.intensity > 70 ? '#EF4444' : spot.intensity > 50 ? '#F59E0B' : '#3B82F6',
                fillOpacity: 0.4,
                weight: 1
              }}
            >
              <Tooltip>
                <div className="text-gray-900 font-medium">{spot.name}</div>
                <div className="text-xs text-gray-600">Risk Intensity: {spot.intensity}%</div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Heatmap;
