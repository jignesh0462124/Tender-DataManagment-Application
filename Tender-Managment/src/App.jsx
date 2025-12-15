// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./Home/Landing";
import "./App.css";
import Login from "./Login/Login";
import Dashboard from "./Dashboard/Dashboard";
import Inventory from "./Dashboard/Inventory";
import RequireAuth from "./Login/RequireAuth";
import InventoryList from './Dashboard/InventoryList';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="login" element={<Login />} />

        {/* Protected routes — user must be authenticated */}
        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="inventory-list"
          element={
            <RequireAuth>
              <InventoryList />
            </RequireAuth>
          }
        />

        <Route
          path="inventory"
          element={
            <RequireAuth>
              <Inventory />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
