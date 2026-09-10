"use client";

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-[#1e3a5f] text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#e67e22] rounded-lg flex items-center justify-center font-bold text-xl">AR</div>
            <span className="text-xl font-bold tracking-wider">AR CONSTRUCTIONS</span>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <a href="#services" className="hover:text-[#e67e22] transition-colors">Services</a>
            <a href="#about" className="hover:text-[#e67e22] transition-colors">About Us</a>
            <a href="#projects" className="hover:text-[#e67e22] transition-colors">Our Work</a>
            <a href="#contact" className="hover:text-[#e67e22] transition-colors">Contact</a>
            <Link href="/login" className="bg-[#e67e22] hover:bg-[#d35400] px-5 py-2 rounded-lg font-medium transition-colors ml-4">
              Admin Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-[#152a45] text-white py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1541888086925-eb22dbf9bdf6?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Building the Future <br/>
            <span className="text-[#e67e22]">Restoring the Past</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10">
            India's premier construction and infrastructure development company. We deliver excellence from foundation to finish.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="#contact" className="bg-[#e67e22] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#d35400] transition-colors">
              Get a Quote
            </a>
            <a href="#projects" className="bg-transparent border-2 border-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-[#152a45] transition-colors">
              View Projects
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1e3a5f] mb-4">Our Services</h2>
            <div className="w-24 h-1 bg-[#e67e22] mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🏢', title: 'Commercial Construction', desc: 'State-of-the-art office spaces, retail centers, and industrial facilities.' },
              { icon: '🏡', title: 'Residential Development', desc: 'Luxury apartments, villas, and modern housing complexes.' },
              { icon: '🛣️', title: 'Infrastructure', desc: 'Roads, bridges, and public utility projects built to last.' }
            ].map((service, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow text-center group">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">{service.icon}</div>
                <h3 className="text-2xl font-bold text-[#1e3a5f] mb-4">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-gray-400 py-12 border-t border-[#152a45]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-[#e67e22] text-white rounded-xl flex items-center justify-center font-bold text-3xl mx-auto mb-6">AR</div>
          <h4 className="text-white text-xl font-bold mb-6">AR Constructions</h4>
          <p className="mb-6 max-w-md mx-auto">Setting the standard in construction excellence. Quality, safety, and reliability in every project we undertake.</p>
          <div className="flex justify-center gap-6 mb-8 text-sm">
            <Link href="/login" className="hover:text-white transition-colors underline">Staff Login</Link>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} AR Constructions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
