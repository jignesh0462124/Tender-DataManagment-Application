import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './Home/Landing'
import './App.css'
import Login from './Login/Login'
import Dashboard from './Dashboard/Dashboard'
import Inventory from "./Dashboard/Inventory";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="login" element={<Login />} />
         <Route path="dashboard" element={<Dashboard />} />
         <Route path="inventory" element={<Inventory />} />
      </Routes>
    </Router>
  )
}

export default App
