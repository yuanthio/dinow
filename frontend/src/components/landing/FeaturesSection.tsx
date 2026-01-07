// dinow/frontend/src/components/landing/FeaturesSection.tsx
"use client";

import { motion } from 'framer-motion';
import { ListTodo, KanbanSquare, ArrowLeftRight, BarChart3, CheckCircle } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: ListTodo,
      title: "Task Management",
      description: "Create, edit, and organize tasks easily based on work status.",
      color: "from-blue-500 to-blue-600",
      benefits: ["Easy task creation", "Status tracking", "Priority setting"]
    },
    {
      icon: KanbanSquare,
      title: "Kanban Board",
      description: "Visual board display like Trello for monitoring workflow.",
      color: "from-emerald-500 to-emerald-600",
      benefits: ["Visual workflow", "Column organization", "Board customization"]
    },
    {
      icon: ArrowLeftRight,
      title: "Drag & Drop",
      description: "Move tasks between statuses with simple drag and drop.",
      color: "from-purple-500 to-purple-600",
      benefits: ["Intuitive interface", "Quick status changes", "Smooth animations"]
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description: "View work progress visually and in real-time.",
      color: "from-orange-500 to-orange-600",
      benefits: ["Real-time updates", "Visual analytics", "Progress insights"]
    }
  ];

  return (
    <section id="features" className="py-24 px-8 bg-linear-to-br from-gray-50 to-white">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Boost productivity with Trello-like visual workflow management
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className={`w-20 h-20 rounded-2xl bg-linear-to-br ${feature.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">{feature.description}</p>
              
              <div className="space-y-3">
                {feature.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
