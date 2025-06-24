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
      className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group"
    >
      <div className="bg-blue-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
        {Icon && (
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-900 group-hover:text-white transition-colors duration-300" />
        )}
      </div>
      <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 group-hover:text-blue-600 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
        {description}
      </p>
    </motion.div>
  );
};

export default WhyCard;
