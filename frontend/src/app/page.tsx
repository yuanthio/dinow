"use client";

import { useState, useEffect } from "react";
import { 
  Menu, 
  X, 
  CheckCircle2, 
  Layout, 
  Zap, 
  Shield, 
  ArrowRight, 
  Github, 
  Twitter, 
  Linkedin, 
  Layers,
  BarChart3,
  Users,
  Code2,
  Globe
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Note: Kalau mau pake logo gambar, uncomment import Image dan ganti bagian Logo di bawah
import Image from "next/image";
import logo from "@/assets/dinow.png";

const LandingPage = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Efek scroll buat navbar glassmorphism yang smooth
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500/30">
      
{/* --- NAVIGATION --- */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-[50] transition-all duration-300 border-b ${
          scrolled 
            ? "h-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-gray-200 dark:border-gray-800 shadow-sm" 
            : "h-20 bg-transparent border-transparent"
        }`}
      >
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo Area */}
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          >
             {/* Balikin ukuran width sesuai request lo (w-28 / w-32) */}
             {/* Navbar udah di-lock height-nya di parent, jadi aman */}
             {/* Note: Pastikan import Image dan logo ada di atas */}
             <Image 
               src={logo} 
               className="w-28 md:w-32 h-auto object-contain" 
               alt="Dinow" 
             />
          </div>
            
          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 h-full">
            {['Features', 'How it works', 'Testimonials'].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollToSection(item.toLowerCase().replace(/\s/g, '-'))}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white transition-colors h-full flex items-center"
              >
                {item}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => router.push("/login")}
              className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Log in
            </button>
            <Button
              onClick={() => router.push("/register")}
              className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white font-semibold rounded-full px-6 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-gray-600 dark:text-gray-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4 md:hidden shadow-xl animate-in slide-in-from-top-5">
            <button onClick={() => scrollToSection('features')} className="text-left font-medium py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-left font-medium py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg">How it works</button>
            <hr className="dark:border-gray-800" />
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => router.push("/login")} variant="outline" className="w-full justify-center">Log In</Button>
                <Button onClick={() => router.push("/register")} className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white">Sign Up</Button>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-normal" />
          <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-normal" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 mb-8 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide">New Features v2.0 Available</span>
            </div>
          
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-[1.1]">
                Project management <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    built for speed.
                </span>
            </h1>
          
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
                Dinow helps teams move faster by organizing tasks, workflows, and goals in one intuitive visual interface. No clutter, just focus.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                <Button 
                onClick={() => router.push("/register")}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                >
                Start for free
                <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button 
                variant="outline"
                className="h-12 px-8 text-base font-medium rounded-full border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
                >
                View Live Demo
                </Button>
            </div>

            {/* --- VISUAL DASHBOARD PREVIEW (CSS ONLY) --- */}
            <div className="relative max-w-5xl mx-auto perspective-[2000px]">
                {/* Glow behind dashboard */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent blur-3xl -z-10 transform translate-y-10" />
                
                {/* Main Dashboard Window */}
                <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden transform rotate-x-12 hover:rotate-0 transition-transform duration-700 ease-out">
                    {/* Window Controls */}
                    <div className="h-10 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center px-4 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    
                    {/* Fake UI Content */}
                    <div className="p-6 grid grid-cols-12 gap-6 h-[400px] md:h-[500px] overflow-hidden">
                        {/* Sidebar */}
                        <div className="hidden md:block col-span-2 border-r border-gray-100 dark:border-gray-800 pr-4 space-y-4">
                            <div className="h-8 w-3/4 bg-gray-100 dark:bg-gray-800 rounded-md" />
                            <div className="h-4 w-1/2 bg-gray-50 dark:bg-gray-800/50 rounded-md" />
                            <div className="h-4 w-2/3 bg-gray-50 dark:bg-gray-800/50 rounded-md" />
                            <div className="h-4 w-3/4 bg-gray-50 dark:bg-gray-800/50 rounded-md" />
                        </div>
                        
                        {/* Main Content (Kanban) */}
                        <div className="col-span-12 md:col-span-10">
                            <div className="flex justify-between mb-6">
                                <div className="h-8 w-40 bg-gray-100 dark:bg-gray-800 rounded-md" />
                                <div className="h-8 w-24 bg-blue-600 rounded-md opacity-80" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Column 1: Todo */}
                                <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                            <div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-700/50 rounded" />
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                            <div className="flex gap-2">
                                                <div className="h-4 w-4 bg-purple-100 dark:bg-purple-900 rounded-full" />
                                                <div className="h-4 w-4 bg-blue-100 dark:bg-blue-900 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Column 2: In Progress */}
                                <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border-l-4 border-blue-500">
                                        <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                        <div className="h-20 w-full bg-gray-100 dark:bg-gray-700/30 rounded mb-2" />
                                        <div className="flex justify-between items-center">
                                            <div className="h-2 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
                                            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Done */}
                                <div className="hidden md:block bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm opacity-60">
                                        <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 decoration-slice line-through" />
                                        <div className="h-2 w-1/3 bg-gray-100 dark:bg-gray-700/50 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tech Stack Strip */}
            <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Trusted by developers from</p>
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Placeholder Icons for companies/tech */}
                    <div className="flex items-center gap-2 font-bold text-lg"><Code2 size={24}/> Acme Corp</div>
                    <div className="flex items-center gap-2 font-bold text-lg"><Globe size={24}/> GlobalTech</div>
                    <div className="flex items-center gap-2 font-bold text-lg"><Zap size={24}/> FastScale</div>
                    <div className="flex items-center gap-2 font-bold text-lg"><Shield size={24}/> SecureNet</div>
                </div>
            </div>
        </div>
      </section>

      {/* --- FEATURES BENTO GRID --- */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Features</h2>
            <p className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Everything you need to ship faster.</p>
            <p className="text-lg text-gray-500 dark:text-gray-400">
                Stop juggling multiple tools. Dinow integrates everything into one cohesive workflow platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 - Large */}
            <div className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                  <Layout />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Smart Kanban Boards</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  Drag, drop, and customize. Our boards adapt to your workflow, not the other way around. Includes custom fields and automation rules.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-1/3 h-full bg-gradient-to-l from-white/50 to-transparent dark:from-black/20 z-0" />
            </div>

            {/* Feature 2 */}
            <div className="group rounded-3xl bg-gray-900 dark:bg-black text-white p-8 shadow-xl flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Built on Next.js with optimistic UI updates. Zero loading states, zero waiting.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6 text-green-600">
                <Users />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Real-time Collab</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                See who's viewing tasks and updates instantly. No refresh needed.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                <BarChart3 />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Deep Analytics</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Track velocity, burndown charts, and team performance automatically.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 p-8 flex items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Secure by Design</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Enterprise grade encryption & JWT Auth.</p>
              </div>
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Timeline) --- */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16 dark:text-white">Workflow made simple</h2>
            
            <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-4 md:ml-0 space-y-12">
                {[
                    { title: "Create Workspace", desc: "Set up your team environment in seconds.", icon: <Layers size={20}/> },
                    { title: "Invite Team", desc: "Send magic links to onboard your squad instantly.", icon: <Users size={20}/> },
                    { title: "Start Building", desc: "Create tasks, assign roles, and ship products.", icon: <CheckCircle2 size={20}/> }
                ].map((step, idx) => (
                    <div key={idx} className="relative pl-12 md:pl-0 md:flex md:items-center md:gap-10 group">
                        <div className="absolute left-[-9px] top-0 md:relative md:left-auto md:w-1/2 md:text-right md:pr-10">
                            {/* Dot on Mobile */}
                            <div className="absolute left-[-9px] top-1 md:hidden w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-gray-950" />
                            
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 md:ml-auto md:max-w-xs">{step.desc}</p>
                        </div>

                        {/* Center Icon Desktop */}
                        <div className="hidden md:flex flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 items-center justify-center border-4 border-gray-50 dark:border-gray-950 z-10">
                            {step.icon}
                        </div>

                        <div className="hidden md:block w-1/2" />
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto rounded-[3rem] bg-gray-900 dark:bg-blue-950 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/30 blur-[100px] rounded-full" />
          
          <div className="relative z-10 px-8 py-20 md:p-24 text-center">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
              Ready to organize<br />your chaos?
            </h2>
            <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join 10,000+ teams who have switched to Dinow for a clearer, faster, and more enjoyable workflow.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => router.push("/register")}
                className="px-10 py-7 bg-white text-gray-900 hover:bg-gray-100 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                Get Started Free
              </Button>
            </div>
            <p className="mt-8 text-sm text-gray-500">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-gray-200 dark:border-gray-900 pt-16 pb-8 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-gray-900">
                    <Layers size={18} strokeWidth={3} />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Dinow.</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                Making project management invisible, so you can focus on the work that matters.
              </p>
              <div className="flex gap-4">
                {[Twitter, Github, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-blue-600 hover:text-white transition-all">
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-blue-600">Features</a></li>
                <li><a href="#" className="hover:text-blue-600">Integrations</a></li>
                <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-600">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-blue-600">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600">API Reference</a></li>
                <li><a href="#" className="hover:text-blue-600">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-blue-600">About</a></li>
                <li><a href="#" className="hover:text-blue-600">Blog</a></li>
                <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600">Legal</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-400">
              © 2025 Dinow Inc. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs font-semibold text-gray-500">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

// "use client";

// import HeroSection from '@/components/landing/HeroSection';
// import FeaturesSection from '@/components/landing/FeaturesSection';
// import PreviewSection from '@/components/landing/PreviewSection';
// import Footer from '@/components/landing/Footer';
// import Navigation from '@/components/landing/Navigation';

// const LandingPage = () => {
//   return (
//     <div className="bg-white">
//       <Navigation />
//       <HeroSection />
//       <FeaturesSection />
//       <PreviewSection />
//       <Footer />
//     </div>
//   );
// };

// export default LandingPage