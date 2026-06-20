import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AddMealByAI from "./pages/AddMealByAI";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Meals from "./pages/Meals";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-meal-ai" element={<AddMealByAI />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
