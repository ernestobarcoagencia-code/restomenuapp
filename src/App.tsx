import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicMenu } from './views/PublicMenu';
import { AdminDashboard } from './views/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicMenu />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
