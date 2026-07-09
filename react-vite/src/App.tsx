import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import AiAssistant from './pages/AiAssistant';
import CrimeSearch from './pages/CrimeSearch';
import Network from './pages/Network';
import Heatmap from './pages/Heatmap';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import AiPipeline from './pages/AiPipeline';
import DigitalTwin from './pages/DigitalTwin';
import DailyBriefing from './pages/DailyBriefing';
import Timeline from './pages/Timeline';
import AdminSettings from './pages/AdminSettings';
import FaceIntelligence from './pages/FaceIntelligence';
import DocumentIntelligence from './pages/DocumentIntelligence';
import EvidenceModeration from './pages/EvidenceModeration';
import ObjectIntelligence from './pages/ObjectIntelligence';
import BarcodeIntelligence from './pages/BarcodeIntelligence';
import ToastComponent from './components/Toast';
import { useCaseStore } from './store/caseStore';
import { useUserStore } from './store/userStore';
import { useEffect } from 'react';
// Auth Guard Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const fetchCases = useCaseStore(state => state.fetchCases);
  const fetchUsers = useUserStore(state => state.fetchUsers);

  useEffect(() => {
    fetchCases();
    fetchUsers();

    // Enable Catalyst Web Push Notifications
    try {
      if (window.catalyst && window.catalyst.notification) {
        window.catalyst.notification.enableNotification().then((resp: any) => {
          console.log("Catalyst Push Notifications Enabled:", resp);
          window.catalyst.notification.messageHandler = (msg: any) => {
            console.log("Received Push Notification:", msg);
            // Optionally, you can trigger a toast notification here
            alert("New Rakshak AI Alert: " + (msg.message || "You have a new notification"));
          };
        }).catch((err: any) => {
          console.warn("Catalyst Push Notification error:", err);
        });
      }
    } catch (e) {
      console.warn("Push Notifications skipped in local environment", e);
    }
  }, [fetchCases, fetchUsers]);

  return (
    <BrowserRouter>
      <ToastComponent />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ai-pipeline" element={<AiPipeline />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="ai-assistant" element={<AiAssistant />} />
          <Route path="face-intel" element={<FaceIntelligence />} />
          <Route path="doc-intel" element={<DocumentIntelligence />} />
          <Route path="evidence-safety" element={<EvidenceModeration />} />
          <Route path="object-intel" element={<ObjectIntelligence />} />
          <Route path="barcode-intel" element={<BarcodeIntelligence />} />
          <Route path="digital-twin" element={<DigitalTwin />} />
          <Route path="crime-search" element={<CrimeSearch />} />
          <Route path="network" element={<Network />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="heatmap" element={<Heatmap />} />
          <Route path="briefing" element={<DailyBriefing />} />
          <Route path="reports" element={<Reports />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="settings" element={<AdminSettings />} />
          {/* Catch-all route for invalid URLs to prevent blank screens */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
