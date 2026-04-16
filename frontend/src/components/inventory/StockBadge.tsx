import { StockStatus, getStockStatusLabel } from '@/types/inventory';
import { motion } from 'framer-motion';

interface StockBadgeProps {
  status: StockStatus;
  animated?: boolean;
}

const statusStyles: Record<StockStatus, string> = {
  'in-stock': 'stock-high',
  'low-stock': 'stock-medium',
  'critical': 'stock-low',
  'out-of-stock': 'stock-out',
};

const StockBadge = ({ status, animated = false }: StockBadgeProps) => {
  const Wrapper = animated ? motion.span : 'span';
  const props = animated ? { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 } } : {};

  return (
    <Wrapper
      {...(props as any)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles[status]} ${status === 'out-of-stock' ? 'animate-pulse-glow' : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'in-stock' ? 'bg-green-500' :
        status === 'low-stock' ? 'bg-yellow-500' :
        status === 'critical' ? 'bg-orange-500' : 'bg-red-500'
      }`} />
      {getStockStatusLabel(status)}
    </Wrapper>
  );
};

export default StockBadge;
