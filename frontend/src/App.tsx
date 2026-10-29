import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppLayout, GuestLayout, RoleGuard } from './layouts/AppLayout';
import { LoadingSpinner } from './components/ui';

// Lazy imports for code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Disasters = lazy(() => import('./pages/Disasters'));
const Locations = lazy(() => import('./pages/Locations'));
const AffectedPeople = lazy(() => import('./pages/AffectedPeople'));
const ReliefCenters = lazy(() => import('./pages/ReliefCenters'));
const Resources = lazy(() => import('./pages/Resources'));
const Inventory = lazy(() => import('./pages/Inventory'));
const ResourceRequests = lazy(() => import('./pages/ResourceRequests'));
const Distribution = lazy(() => import('./pages/Distribution'));
const Volunteers = lazy(() => import('./pages/Volunteers'));
const VolunteerAssignments = lazy(() => import('./pages/VolunteerAssignments'));
const Donors = lazy(() => import('./pages/Donors'));
const Donations = lazy(() => import('./pages/Donations'));
const RescueOperations = lazy(() => import('./pages/RescueOperations'));
const ReliefTasks = lazy(() => import('./pages/ReliefTasks'));
const Transportation = lazy(() => import('./pages/Transportation'));
const MedicalFacilities = lazy(() => import('./pages/MedicalFacilities'));
const EmergencyContacts = lazy(() => import('./pages/EmergencyContacts'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Users = lazy(() => import('./pages/Users'));
const Reports = lazy(() => import('./pages/Reports'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <LoadingSpinner message="Loading page..." />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: '14px', maxWidth: '380px' },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Guest routes */}
          <Route element={<GuestLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/affected-people" element={<AffectedPeople />} />
            <Route path="/relief-centers" element={<ReliefCenters />} />
            <Route path="/resource-requests" element={<ResourceRequests />} />
            <Route path="/relief-tasks" element={<ReliefTasks />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/emergency-contacts" element={<EmergencyContacts />} />

            {/* Admin/Coordinator routes */}
            <Route path="/disasters" element={
              <RoleGuard roles={['Admin', 'Disaster Coordinator']}>
                <Disasters />
              </RoleGuard>
            } />
            <Route path="/locations" element={
              <RoleGuard roles={['Admin']}>
                <Locations />
              </RoleGuard>
            } />
            <Route path="/resources" element={
              <RoleGuard roles={['Admin', 'Disaster Coordinator']}>
                <Resources />
              </RoleGuard>
            } />
            <Route path="/inventory" element={
              <RoleGuard roles={['Admin', 'Disaster Coordinator']}>
                <Inventory />
              </RoleGuard>
            } />
            <Route path="/distribution" element={
              <RoleGuard roles={['Admin', 'Disaster Coordinator']}>
                <Distribution />
              </RoleGuard>
            } />
            <Route path="/volunteers" element={
              <RoleGuard roles={['Admin', 'Disaster Coordinator']}>
                <Volunteers />
              </RoleGuard>
            } />
            <Route path="/volunteer-assignments" element={
              <RoleGuard roles={['Admin', 'Disaster Coordinator']}>
                <VolunteerAssignments />
              </RoleGuard>
            } />
            <Route path="/rescue-operations" element={
              <RoleGuard roles={['Admin', 'Disaster Coordinator']}>
                <RescueOperations />
              </RoleGuard>
            } />
            <Route path="/transportation" element={
              <RoleGuard roles={['Admin', 'Disaster Coordinator']}>
                <Transportation />
              </RoleGuard>
            } />
            <Route path="/medical-cases" element={
              <RoleGuard roles={['Admin', 'Disaster Coordinator']}>
                <MedicalFacilities />
              </RoleGuard>
            } />
            <Route path="/donors" element={
              <RoleGuard roles={['Admin']}>
                <Donors />
              </RoleGuard>
            } />
            <Route path="/medical-facilities" element={
              <RoleGuard roles={['Admin']}>
                <MedicalFacilities />
              </RoleGuard>
            } />
            <Route path="/users" element={
              <RoleGuard roles={['Admin']}>
                <Users />
              </RoleGuard>
            } />
            <Route path="/reports" element={
              <RoleGuard roles={['Admin', 'Disaster Coordinator']}>
                <Reports />
              </RoleGuard>
            } />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
              <div className="text-8xl">🆘</div>
              <h1 className="text-4xl font-bold text-gray-800">Page Not Found</h1>
              <p className="text-gray-500">The page you're looking for doesn't exist.</p>
              <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
