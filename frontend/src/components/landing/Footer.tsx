// dinow/frontend/src/components/landing/Footer.tsx
"use client";

import { motion } from 'framer-motion';
import { KanbanSquare, Github, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-12 px-8 border-t border-gray-100 bg-linear-to-br from-gray-50 to-white">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row justify-between items-center gap-8"
        >
          {/* Brand Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-4"
            >
              <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <KanbanSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">Dinow</span>
                <p className="text-sm text-gray-600">Modern Task Management</p>
              </div>
            </motion.div>
          </div>

          {/* Links Section */}
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#preview" className="text-gray-600 hover:text-blue-600 transition-colors">
                Preview
              </a>
              <a href="#hero-section" className="text-gray-600 hover:text-blue-600 transition-colors">
                Home
              </a>
            </div>
          </div>

          {/* Social & Credits */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
              >
                <Github className="h-5 w-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </motion.a>
            </div>
            <div className="text-gray-500 text-sm text-center">
              © 2024 Dinow. Built with ❤️ by Fikri & Yuan
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 pt-8 border-t border-gray-100 text-center"
        >
          <p className="text-gray-500 text-sm">
            Boost your productivity with visual task management
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
