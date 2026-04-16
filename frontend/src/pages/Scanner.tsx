import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Search, Package, XCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useInventory } from '@/context/InventoryContext';
import { getStockStatus } from '@/types/inventory';
import StockBadge from '@/components/inventory/StockBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Scanner = () => {
  const { products } = useInventory();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);

  const matchedProduct = products.find(
    p => p.barcode === (scanResult || manualCode) || p.sku === (scanResult || manualCode)
  );

  const startScanner = useCallback(() => {
    setScanning(true);
    setScanResult(null);
  }, []);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1, rememberLastUsedCamera: true },
      false
    );

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        setScanning(false);
        scanner.clear().catch(() => {});
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanning]);

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      setScanResult(manualCode.trim());
    }
  };

  const reset = () => {
    setScanResult(null);
    setManualCode('');
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <ScanLine className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Barcode / QR Scanner
        </h1>
        <p className="text-muted-foreground text-sm">Scan or enter a barcode to look up products</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 sm:p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Camera Scanner</h2>
          {!scanning ? (
            <div className="flex flex-col items-center py-8 sm:py-12">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-accent flex items-center justify-center mb-4">
                <ScanLine className="w-10 h-10 sm:w-12 sm:h-12 text-accent-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4 text-center">Point your camera at a barcode or QR code</p>
              <Button onClick={startScanner} className="gradient-primary text-primary-foreground border-0 gap-2">
                <ScanLine className="w-4 h-4" /> Start Scanner
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-sm mx-auto">
              <div id="qr-reader" className="w-full overflow-hidden rounded-2xl bg-card shadow-sm" />
              <Button variant="outline" className="w-full mt-4" onClick={() => setScanning(false)}>
                Stop Scanner
              </Button>
            </div>
          )}

          {/* Manual Entry */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-2">Manual Entry</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter barcode or SKU..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                className="flex-1 text-sm"
              />
              <Button onClick={handleManualSearch} variant="outline" className="gap-1 flex-shrink-0">
                <Search className="w-4 h-4" /> Look Up
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Result Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 sm:p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Product Details</h2>

          {!scanResult && !manualCode ? (
            <div className="flex flex-col items-center py-8 sm:py-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">Scan a barcode or enter a code to see product details</p>
            </div>
          ) : matchedProduct ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{matchedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{matchedProduct.sku}</p>
                </div>
                <StockBadge status={getStockStatus(matchedProduct.quantity, matchedProduct.minStock)} animated />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Category', value: matchedProduct.category },
                  { label: 'Brand', value: matchedProduct.brand },
                  { label: 'Price', value: `₹${matchedProduct.price.toLocaleString('en-IN')}` },
                  { label: 'Cost Price', value: `₹${matchedProduct.costPrice.toLocaleString('en-IN')}` },
                  { label: 'In Stock', value: `${matchedProduct.quantity} ${matchedProduct.unit}` },
                  { label: 'Min Stock', value: `${matchedProduct.minStock} ${matchedProduct.unit}` },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              {matchedProduct.barcode && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[11px] text-muted-foreground">Barcode</p>
                  <p className="text-sm font-mono font-semibold text-foreground">{matchedProduct.barcode}</p>
                </div>
              )}

              <Button variant="outline" onClick={reset} className="w-full mt-2 gap-2">
                <ScanLine className="w-4 h-4" /> Scan Another
              </Button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8 sm:py-12 text-center">
              <XCircle className="w-16 h-16 text-destructive/30 mb-4" />
              <h3 className="text-base font-semibold text-foreground">No Product Found</h3>
              <p className="text-sm text-muted-foreground mt-1">Code: <span className="font-mono">{scanResult || manualCode}</span></p>
              <Button variant="outline" onClick={reset} className="mt-4 gap-2">
                <ScanLine className="w-4 h-4" /> Try Again
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Scanner;
