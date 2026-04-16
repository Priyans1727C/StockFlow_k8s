import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
  trend?: { value: number; positive: boolean };
}

const StatCard = ({ title, value, subtitle, icon: Icon, color, delay = 0, trend }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring', damping: 20 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card p-3.5 sm:p-5 cursor-default group relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className={`absolute -right-4 -top-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full opacity-[0.07] ${color}`} />

      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2, duration: 0.4 }}
            className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground truncate"
          >
            {value}
          </motion.p>
          {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={`text-[10px] sm:text-xs font-semibold ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <motion.div
          whileHover={{ rotate: 10, scale: 1.1 }}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color} shadow-sm`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StatCard;
