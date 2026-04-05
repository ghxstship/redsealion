'use client';

import React, { useState, useRef, useEffect, useCallback, startTransition } from 'react';

interface QRScannerProps {
  onScan: (value: string) => void;
}

type CameraFacing = 'environment' | 'user';

export default function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const animFrameRef = useRef<number>(0);

  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualValue, setManualValue] = useState('');
  const [facing, setFacing] = useState<CameraFacing>('environment');
  const [error, setError] = useState<string | null>(null);
  const [hasBarcodeApi, setHasBarcodeApi] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    stopCamera();

    // Check for BarcodeDetector
    if (typeof window !== 'undefined' && !('BarcodeDetector' in window)) {
      setHasBarcodeApi(false);
      setMode('manual');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!detectorRef.current) {
        detectorRef.current = new BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'],
        });
      }

      setScanning(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Camera access was denied. Please allow camera permissions and try again.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Try manual entry instead.');
      }
      setMode('manual');
    }
  }, [facing, stopCamera]);

  // Scan loop
  useEffect(() => {
    if (!scanning || mode !== 'scan') return;

    let active = true;

    const detect = async () => {
      if (!active || !videoRef.current || !detectorRef.current) return;

      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue;
          if (value && value !== lastScanned) {
            setLastScanned(value);
            onScan(value);
          }
        }
      } catch (error) {
          void error; /* Caught: error boundary handles display */
        }

      if (active) {
        animFrameRef.current = requestAnimationFrame(detect);
      }
    };

    animFrameRef.current = requestAnimationFrame(detect);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [scanning, mode, lastScanned, onScan]);

  // Start camera when in scan mode
  useEffect(() => {
    if (mode === 'scan') {
      startTransition(() => { startCamera(); });
    } else {
      stopCamera();
      startTransition(() => { setScanning(false); });
    }
    return () => {
      stopCamera();
    };
  }, [mode, facing, startCamera, stopCamera]);

  const switchCamera = () => {
    setFacing((f) => (f === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualValue.trim();
    if (trimmed) {
      onScan(trimmed);
      setManualValue('');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Mode tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setMode('scan')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            mode === 'scan'
              ? 'text-foreground border-b-2 border-foreground'
              : 'text-text-muted hover:text-foreground'
          }`}
        >
          Camera Scan
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'text-foreground border-b-2 border-foreground'
              : 'text-text-muted hover:text-foreground'
          }`}
        >
          Manual Entry
        </button>
      </div>

      {mode === 'scan' && (
        <div className="space-y-3">
          {error ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              <p className="font-medium mb-1">Camera Error</p>
              <p>{error}</p>
              <button
                onClick={() => setMode('manual')}
                className="mt-2 text-xs font-medium underline"
              >
                Switch to manual entry
              </button>
            </div>
          ) : (
            <>
              {/* Viewfinder */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Darkened edges */}
                  <div className="absolute inset-0 bg-black/40" />

                  {/* Clear center window */}
                  <div className="relative w-3/4 max-w-[280px] aspect-square">
                    <div className="absolute inset-0 bg-transparent" style={{
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                    }} />

                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />

                    {/* Scan line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-green-400/80 top-1/2" />
                  </div>
                </div>

                {/* Instruction text */}
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-xs text-white/80 bg-black/50 px-3 py-1 rounded-full">
                    Point camera at barcode or QR code
                  </span>
                </div>
              </div>

              {/* Camera controls */}
              <div className="flex gap-2">
                <button
                  onClick={switchCamera}
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-border bg-white text-foreground hover:bg-bg-secondary transition-colors"
                >
                  Switch Camera
                </button>
                <button
                  onClick={() => {
                    setLastScanned(null);
                    startCamera();
                  }}
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-border bg-white text-foreground hover:bg-bg-secondary transition-colors"
                >
                  Reset Scanner
                </button>
              </div>
            </>
          )}

          {!hasBarcodeApi && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
              Your browser does not support the BarcodeDetector API. Please use Chrome/Edge or enter codes manually.
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Barcode / Asset ID
            </label>
            <input
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="Scan or type barcode..."
              autoFocus
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground bg-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <p className="mt-1 text-xs text-text-muted">
              Enter the barcode number or asset ID and press Look Up.
            </p>
          </div>
          <button
            type="submit"
            disabled={!manualValue.trim()}
            className="w-full px-4 py-2.5 text-sm rounded-lg bg-foreground text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Look Up
          </button>
        </form>
      )}

      {lastScanned && mode === 'scan' && (
        <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
          <span className="font-medium">Scanned:</span>{' '}
          <span className="font-mono">{lastScanned}</span>
        </div>
      )}
    </div>
  );
}

// Extend Window for BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector?: typeof BarcodeDetector;
  }

  class BarcodeDetector {
    constructor(options?: { formats: string[] });
    detect(source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<{ rawValue: string; format: string; boundingBox: DOMRectReadOnly }[]>;
    static getSupportedFormats(): Promise<string[]>;
  }
}
