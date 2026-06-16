import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/Register';
import Chat from './pages/Chat';

function App() {
  const token = localStorage.getItem('token');

  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={token ? <Navigate to="/chat" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;