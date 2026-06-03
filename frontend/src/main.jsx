// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router'; // Modern Data Router Engine
import { AuthProvider } from './context/AuthContext';
import App from './App';

// Build a clean, standard routing entry point array mapping
const router = createBrowserRouter([
  {
    path: "*",
    element: <App />
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

