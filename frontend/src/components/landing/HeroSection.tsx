// dinow/src/components/landing/HeroSection.tsx
"use client";

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const HeroSection = () => {
  const router = useRouter();

  return (
    <section id='hero-section' className="pt-32 px-8 bg-linear-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-linear-to-r from-blue-50 to-emerald-50 text-blue-600 rounded-full text-base font-medium mb-8 border border-blue-100 cursor-pointer"
            >
              <Sparkles className="h-5 w-5 mr-3" />
              Modern Task Management
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8"
            >
              Manage Tasks & Boost
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-emerald-600 mt-4">
                Productivity with Dinow
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              Create tasks, drag between statuses, set priorities, and track progress all in one place. 
              Experience the power of visual workflow management.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Button 
                onClick={() => router.push('/register')}
                className="px-8 py-4 bg-linear-to-r from-blue-600 to-emerald-600 text-white font-medium rounded-2xl hover:from-blue-700 hover:to-emerald-700 transition-all text-lg shadow-lg hover:shadow-xl cursor-pointer"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/login')}
                className="px-8 py-4 border-2 border-blue-200 text-blue-600 font-medium rounded-2xl hover:bg-blue-50 transition-all text-lg cursor-pointer"
              >
                Sign In
              </Button>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
