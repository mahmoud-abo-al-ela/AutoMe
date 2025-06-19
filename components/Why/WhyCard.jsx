import { motion } from "framer-motion";
import { Zap, Shield, Clock, ChevronRight } from "lucide-react";

const WhyCard = ({ icon, title, description, delay }) => {
  const Icon = icon ? { Zap, Shield, Clock }[icon] : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group"
    >
      <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
        {Icon && (
          <Icon className="h-8 w-8 text-blue-900 group-hover:text-white transition-colors duration-300" />
        )}
      </div>
      <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-600 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 mb-6">{description}</p>
    </motion.div>
  );
};

export default WhyCard;
