import React, { useState } from 'react';
import { 
  CheckCircle, 
  Database, 
  Filter, 
  Bell, 
  BarChart3, 
  ShieldCheck, 
  ChevronDown, 
  Search, 
  ArrowRight,
  PlayCircle,
  Zap,
  LayoutDashboard,
  Menu,
  X,
  Twitter,
  Linkedin,
  Instagram,
  Globe
} from 'lucide-react';


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full py-5 px-6 md:px-12 flex justify-between items-center z-50 relative bg-slate-950/80 backdrop-blur-md sticky top-0 border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="bg-emerald-500 p-1.5 rounded-md">
           <Database className="text-white w-5 h-5" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight">Osaioriginal</span>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-8 text-slate-300 text-sm font-medium">
        <a href="#features" className="hover:text-emerald-400 transition">Features</a>
        <a href="#datastore" className="hover:text-emerald-400 transition">Data Store</a>
        <a href="#howitworks" className="hover:text-emerald-400 transition">How It Works</a>
        <a href="#pricing" className="hover:text-emerald-400 transition">Pricing</a>
        <a href="#contact" className="hover:text-emerald-400 transition">Contact</a>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <button className="text-white text-sm font-medium hover:text-emerald-400 transition">Login</button>
      </div>

      {/* Mobile Menu Toggle */}
      <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 p-4 flex flex-col gap-4 md:hidden">
            <a href="#features" className="text-slate-300 hover:text-emerald-400">Features</a>
            <a href="#datastore" className="text-slate-300 hover:text-emerald-400">Data Store</a>
            <a href="#howitworks" className="text-slate-300 hover:text-emerald-400">How It Works</a>
            <a href="#pricing" className="text-slate-300 hover:text-emerald-400">Pricing</a>
            <button className="text-white font-medium text-left">Login</button>
            <button className="bg-emerald-500 text-white px-5 py-2 rounded-full font-semibold">Get Started</button>
        </div>
      )}
    </nav>
  );
};

const Hero = () => {
  return (
    <div className="relative pt-16 pb-32 flex flex-col items-center text-center px-4 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-900/40 rounded-full blur-[128px] -z-10"></div>
      <div className="absolute top-20 right-1/4 w-80 h-80 bg-blue-900/40 rounded-full blur-[128px] -z-10"></div>

      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        <span className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">Smart Tender Intelligence Platform</span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl md:text-6xl font-bold text-white max-w-4xl leading-tight mb-6">
        Osaioriginal – Smart Tender <br className="hidden md:block" />
        <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
          Data Store & Monitoring Platform
        </span>
      </h1>

      <p className="text-slate-400 text-lg max-w-2xl mb-10">
        Track, store, monitor and receive real-time government tenders effortlessly in one powerful dashboard.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-20">
        <button className="flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-3.5 rounded-full font-semibold hover:bg-emerald-50 transition shadow-lg shadow-emerald-900/20">
          Get Started <ArrowRight className="w-4 h-4" />
        </button>
        <button className="flex items-center justify-center gap-2 bg-slate-800 text-white border border-slate-700 px-8 py-3.5 rounded-full font-semibold hover:bg-slate-700 transition">
          View Live Tenders <PlayCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-12 md:gap-24 border-t border-slate-800 pt-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-white">10K+</h3>
          <p className="text-slate-500 text-sm">Active Tenders</p>
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-white">99.9%</h3>
          <p className="text-slate-500 text-sm">Uptime</p>
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-white">24/7</h3>
          <p className="text-slate-500 text-sm">Monitoring</p>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800 transition duration-300 group hover:border-emerald-500/30">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color}`}>
      <Icon className="text-white w-6 h-6" />
    </div>
    <h3 className="text-white text-xl font-bold mb-2 group-hover:text-emerald-400 transition">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

const Features = () => {
  const features = [
    { icon: Zap, title: "Live Tender Tracking", desc: "Real-time tender updates from multiple government portals with instant notifications.", color: "bg-blue-600" },
    { icon: Database, title: "Tender Data Store", desc: "Secure storage of all tender records with advanced filtering & search capabilities.", color: "bg-emerald-600" },
    { icon: Filter, title: "Region-Wise Filtering", desc: "Filter tenders by district, state, department with precision targeting.", color: "bg-purple-600" },
    { icon: Bell, title: "Automated Notifications", desc: "Email, WhatsApp & dashboard alerts for new tenders matching your criteria.", color: "bg-orange-600" },
    { icon: BarChart3, title: "Smart Dashboard Analytics", desc: "Comprehensive graphs, tender statistics & trend analysis at your fingertips.", color: "bg-pink-600" },
    { icon: ShieldCheck, title: "Secure & Reliable", desc: "Bank-grade security with 99.9% uptime guarantee for your business.", color: "bg-cyan-600" },
  ];

  return (
    <div className="py-20 px-6 md:px-12 max-w-7xl mx-auto" id="features">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Features</h2>
        <p className="text-slate-400">Everything you need to manage tenders efficiently</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => <FeatureCard key={i} {...f} />)}
      </div>
    </div>
  );
};

const DataStorePreview = () => {
  return (
    <div className="py-20 px-6 md:px-12 bg-slate-900/50" id="datastore">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Tender Data Store</h2>
          <p className="text-slate-400">Access and manage all tender records in one place</p>
        </div>

        {/* Dashboard UI Mockup */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-end">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-3/4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">District</label>
                <div className="bg-slate-900 border border-slate-700 rounded p-2 text-slate-300 text-sm flex justify-between items-center cursor-pointer hover:border-slate-500 transition">
                  All Districts <ChevronDown size={14} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date Range</label>
                <div className="bg-slate-900 border border-slate-700 rounded p-2 text-slate-400 text-sm">Select date range</div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Budget Range</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Min" className="w-1/2 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
                  <input type="text" placeholder="Max" className="w-1/2 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
            </div>
            <button className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:opacity-90 transition w-full md:w-auto justify-center">
              <Filter size={14} /> Apply Filters
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs text-slate-400 bg-slate-900/50 uppercase">
                <tr>
                  <th className="px-6 py-4">Tender ID</th>
                  <th className="px-6 py-4">Tender Title</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">District</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Closing Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-slate-300">
                {[
                  { id: 'TND-2024-001', title: 'Road Construction Project', dept: 'PWD', dist: 'Mumbai', val: '₹50 Lakhs', date: '15 Jan 2025', status: 'Active', color: 'bg-emerald-500/10 text-emerald-400' },
                  { id: 'TND-2024-002', title: 'IT Equipment Supply', dept: 'IT Dept', dist: 'Pune', val: '₹25 Lakhs', date: '20 Jan 2025', status: 'Active', color: 'bg-emerald-500/10 text-emerald-400' },
                  { id: 'TND-2024-003', title: 'Healthcare Equipment', dept: 'Health Dept', dist: 'Nagpur', val: '₹1.2 Crore', date: '10 Jan 2025', status: 'Closed', color: 'bg-red-500/10 text-red-400' },
                  { id: 'TND-2024-004', title: 'School Building Renovation', dept: 'Education', dist: 'Thane', val: '₹75 Lakhs', date: '25 Jan 2025', status: 'Active', color: 'bg-emerald-500/10 text-emerald-400' },
                  { id: 'TND-2024-005', title: 'Water Supply Pipeline', dept: 'Water Resources', dist: 'Nashik', val: '₹2.5 Crore', date: '30 Jan 2025', status: 'Active', color: 'bg-emerald-500/10 text-emerald-400' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4 font-mono text-slate-400">{row.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{row.title}</td>
                    <td className="px-6 py-4">{row.dept}</td>
                    <td className="px-6 py-4">{row.dist}</td>
                    <td className="px-6 py-4 font-semibold text-white">{row.val}</td>
                    <td className="px-6 py-4">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${row.color}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
            <span>Showing 1-5 of 247 tenders</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded border border-slate-700 hover:bg-slate-700 transition">Previous</button>
              <button className="px-3 py-1 rounded bg-blue-600 text-white">1</button>
              <button className="px-3 py-1 rounded border border-slate-700 hover:bg-slate-700 transition">2</button>
              <button className="px-3 py-1 rounded border border-slate-700 hover:bg-slate-700 transition">3</button>
              <button className="px-3 py-1 rounded border border-slate-700 hover:bg-slate-700 transition">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const steps = [
    { num: 1, title: 'Connect Sources', desc: 'Link government tender portals' },
    { num: 2, title: 'Auto Fetch Data', desc: 'Automatically collect tender data' },
    { num: 3, title: 'Apply Filters', desc: 'Set your preferences & criteria' },
    { num: 4, title: 'Receive Alerts', desc: 'Get instant notifications' },
    { num: 5, title: 'Download Reports', desc: 'Export data & analytics' },
  ];

  return (
    <div className="py-20 px-6 bg-slate-900 border-t border-slate-800" id="howitworks">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-2">How It Works</h2>
        <p className="text-slate-400 mb-16">Simple steps to get started with Osaioriginal</p>
        
        <div className="relative grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-4 left-0 w-full h-0.5 bg-emerald-900 -z-10"></div>
          
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center group">
              <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-500 text-white font-bold flex items-center justify-center mb-4 z-10 group-hover:bg-emerald-500 transition duration-300">
                {step.num}
              </div>
              <h3 className="text-white font-bold mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm max-w-[150px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WhyChooseUs = () => {
  return (
    <div className="py-20 px-6 md:px-12 bg-slate-800/20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Why Osaioriginal?</h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="mt-1 bg-blue-900/50 p-2 rounded h-fit"><Zap className="text-blue-400 w-5 h-5" /></div>
              <div>
                <h4 className="text-white font-bold text-lg">Fast & Efficient</h4>
                <p className="text-slate-400 text-sm mt-1">Lightning-fast tender updates with real-time synchronization across all government portals.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 bg-emerald-900/50 p-2 rounded h-fit"><ShieldCheck className="text-emerald-400 w-5 h-5" /></div>
              <div>
                <h4 className="text-white font-bold text-lg">Secure & Reliable</h4>
                <p className="text-slate-400 text-sm mt-1">Bank-grade encryption with 99.9% uptime guarantee for your business.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 bg-purple-900/50 p-2 rounded h-fit"><LayoutDashboard className="text-purple-400 w-5 h-5" /></div>
              <div>
                <h4 className="text-white font-bold text-lg">Maharashtra Coverage</h4>
                <p className="text-slate-400 text-sm mt-1">Comprehensive coverage of all Maharashtra government tenders with expansion plans.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 bg-orange-900/50 p-2 rounded h-fit"><Database className="text-orange-400 w-5 h-5" /></div>
              <div>
                <h4 className="text-white font-bold text-lg">Cloud-Based Archive</h4>
                <p className="text-slate-400 text-sm mt-1">Searchable tender archive with advanced filtering and historical data access.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 relative hover:border-emerald-500/30 transition duration-500">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80 rounded-2xl"></div>
            <div className="relative z-10 text-center py-10">
                <h3 className="text-5xl font-bold text-white mb-2">99.9%</h3>
                <p className="text-emerald-400 text-sm font-medium">Uptime Guarantee</p>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-slate-700 pt-8">
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">10K+</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Active Tenders</div>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">500+</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Happy Clients</div>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">24/7</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Support</div>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">50+</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Departments</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const CTA = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-emerald-500 py-24 px-6 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Tender <br/> Management?</h2>
      <p className="text-blue-50 text-lg mb-8">Join hundreds of contractors and businesses already using Osaioriginal</p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button className="bg-white text-blue-600 px-8 py-3 rounded-md font-bold hover:bg-blue-50 transition shadow-lg">
          Start Free Trial <ArrowRight className="inline w-4 h-4 ml-1" />
        </button>
        <button className="bg-white/20 text-white border border-white/40 px-8 py-3 rounded-md font-bold hover:bg-white/30 transition backdrop-blur-sm">
          Schedule Demo <Database className="inline w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="bg-slate-950 pt-20 pb-10 px-6 md:px-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div>
          <div className="flex items-center gap-2 mb-6">
             <div className="bg-emerald-500 p-1.5 rounded-md">
                <Database className="text-white w-5 h-5" />
             </div>
             <span className="text-white font-bold text-xl">Osaioriginal</span>
          </div>
          <p className="text-slate-500 text-sm mb-6">Powering Smart Tender Intelligence</p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition"><Twitter size={16} /></div>
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition"><Linkedin size={16} /></div>
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition"><Instagram size={16} /></div>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-6">Product</h4>
          <ul className="space-y-4 text-slate-500 text-sm">
            <li className="hover:text-emerald-400 cursor-pointer transition">Features</li>
            <li className="hover:text-emerald-400 cursor-pointer transition">Dashboard</li>
            <li className="hover:text-emerald-400 cursor-pointer transition">Pricing</li>
            <li className="hover:text-emerald-400 cursor-pointer transition">API</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Company</h4>
          <ul className="space-y-4 text-slate-500 text-sm">
            <li className="hover:text-emerald-400 cursor-pointer transition">About Us</li>
            <li className="hover:text-emerald-400 cursor-pointer transition">Careers</li>
            <li className="hover:text-emerald-400 cursor-pointer transition">Blog</li>
            <li className="hover:text-emerald-400 cursor-pointer transition">Contact</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Support</h4>
          <ul className="space-y-4 text-slate-500 text-sm">
            <li className="hover:text-emerald-400 cursor-pointer transition">Help Center</li>
            <li className="hover:text-emerald-400 cursor-pointer transition">Documentation</li>
            <li className="hover:text-emerald-400 cursor-pointer transition">Privacy Policy</li>
            <li className="hover:text-emerald-400 cursor-pointer transition">Terms of Service</li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-slate-900 pt-8 text-center text-slate-600 text-sm">
        © 2024 Osaioriginal. All rights reserved.
      </div>
    </footer>
  );
};

const Landing = () => {
  return (
    <div className="bg-slate-950 min-h-screen font-sans selection:bg-emerald-500/30">
      <Navbar />
      <Hero />
      <Features />
      <DataStorePreview />
      <HowItWorks />
      <WhyChooseUs />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;