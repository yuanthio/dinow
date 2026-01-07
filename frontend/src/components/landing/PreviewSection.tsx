// dinow/frontend/src/components/landing/PreviewSection.tsx
"use client";

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Zap, Shield } from 'lucide-react';

const PreviewSection = () => {
  return (
    <section id="preview" className="py-24 px-8 bg-linear-to-br from-white to-blue-50">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            What Does Dinow's Kanban Board Look Like?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Clean and modern interface like Trello, with drag-and-drop features, status boards, and progress tracking.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <div className="space-y-8">
              {[
                { 
                  number: "01", 
                  title: "Create & Organize Tasks", 
                  desc: "Create new tasks and group them by status like To Do, In Progress, and Done.",
                  icon: Zap
                },
                { 
                  number: "02", 
                  title: "Powerful Kanban Board", 
                  desc: "Visualize your work with responsive and clean board layout.",
                  icon: CheckCircle 
                },
                { 
                  number: "03", 
                  title: "Drag & Drop System", 
                  desc: "Move tasks between columns with simple drag and drop functionality.",
                  icon: ArrowRight
                },
                { 
                  number: "04", 
                  title: "Progress Snapshot", 
                  desc: "View progress summary quickly based on status and task count.",
                  icon: Shield
                }
              ].map((item, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start group"
                >
                  <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-emerald-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl mr-6 group-hover:from-blue-600 group-hover:to-emerald-600 group-hover:text-white transition-all duration-300 shadow-lg group-hover:shadow-xl">
                    {item.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <item.icon className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="text-2xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Kanban Board Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 lg:max-w-lg"
          >
            <div className="relative">
              <motion.div 
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-linear-to-br from-blue-50 to-emerald-50 rounded-3xl p-8 border-2 border-blue-100 shadow-2xl"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Project Board</h3>
                  <p className="text-gray-600">Drag tasks to update status</p>
                </div>

                <div className="flex flex-wrap gap-4">

                  {/* Column 1 */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-2xl p-4 border border-blue-100 shadow-lg min-w-[140px]"
                  >
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      To Do
                    </h4>
                    <div className="space-y-3">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="p-3 bg-linear-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 h-16 hover:shadow-md transition-shadow"
                      ></motion.div>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="p-3 bg-linear-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 h-16 hover:shadow-md transition-shadow"
                      ></motion.div>
                    </div>
                  </motion.div>

                  {/* Column 2 */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-2xl p-4 border border-yellow-100 shadow-lg min-w-[140px]"
                  >
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      In Progress
                    </h4>
                    <div className="space-y-3">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="p-3 bg-linear-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 h-16 hover:shadow-md transition-shadow"
                      ></motion.div>
                    </div>
                  </motion.div>

                  {/* Column 3 */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-2xl p-4 border border-green-100 shadow-lg min-w-[140px]"
                  >
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Done
                    </h4>
                    <div className="space-y-3">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="p-3 bg-linear-to-r from-green-50 to-green-100 rounded-xl border border-green-200 h-16 hover:shadow-md transition-shadow"
                      ></motion.div>
                    </div>
                  </motion.div>

                </div>

                <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                  <span>3 columns</span>
                  <span>4 tasks</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PreviewSection;
