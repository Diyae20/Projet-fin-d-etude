import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MedecinList from './pages/MedecinList';
import MedecinDetail from './pages/MedecinDetail';
import MedecinDashboard from './pages/MedecinDashboard';
import MedecinPatients from './pages/MedecinPatients';
import SuggestionsConfig from './pages/SuggestionsConfig';
import RendezvousList from './pages/RendezvousList';
import ChangePassword from './pages/ChangePassword';
import DeleteAccount from './pages/DeleteAccount';
import ResetPassword from './pages/ResetPassword';
import ReceptionDashboard from './pages/ReceptionDashboard';
import ReceptionUserList from './pages/ReceptionUserList';
import ReceptionUserDetail from './pages/ReceptionUserDetail';
import ReceptionMedecinList from './pages/ReceptionMedecinList';
import ReceptionMedecinDetail from './pages/ReceptionMedecinDetail';
import ReceptionRendezvousList from './pages/ReceptionRendezvousList';
import ReceptionRendezvousDetail from './pages/ReceptionRendezvousDetail';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/medecins"
                element={
                  <ProtectedRoute>
                    <MedecinList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medecins/:id"
                element={
                  <ProtectedRoute>
                    <MedecinDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/medecin"
                element={
                  <ProtectedRoute>
                    <MedecinDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/medecin/patients"
                element={
                  <ProtectedRoute>
                    <MedecinPatients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/medecin/suggestions"
                element={
                  <ProtectedRoute>
                    <SuggestionsConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rendezvous"
                element={
                  <ProtectedRoute>
                    <RendezvousList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/delete-account"
                element={
                  <ProtectedRoute>
                    <DeleteAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reception/dashboard"
                element={
                  <ProtectedRoute>
                    <ReceptionDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reception/users"
                element={
                  <ProtectedRoute>
                    <ReceptionUserList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reception/users/:id"
                element={
                  <ProtectedRoute>
                    <ReceptionUserDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reception/medecins"
                element={
                  <ProtectedRoute>
                    <ReceptionMedecinList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reception/medecins/:id"
                element={
                  <ProtectedRoute>
                    <ReceptionMedecinDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reception/rendezvous"
                element={
                  <ProtectedRoute>
                    <ReceptionRendezvousList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reception/rendezvous/:id"
                element={
                  <ProtectedRoute>
                    <ReceptionRendezvousDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
