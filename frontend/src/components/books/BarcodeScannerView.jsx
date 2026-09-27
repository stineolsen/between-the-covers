import { useEffect, useRef, useState } from "react";
import { BarcodeDetector } from "barcode-detector/ponyfill";

// Camera-based ISBN scanner for the Add Book search step. Renders inline
// inside AddBookModal's body (no separate overlay). Uses a WASM ponyfill
// rather than the native BarcodeDetector API because that API isn't
// implemented in Safari/iOS at all, and this app's members are on iPhones.
const BarcodeScannerView = ({ onDetected, onCancel }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stoppedRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    stoppedRef.current = false;
    let detector;

    const stopCamera = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const scanLoop = async () => {
      if (stoppedRef.current || !videoRef.current || !detector) return;
      try {
        const results = await detector.detect(videoRef.current);
        if (results.length > 0) {
          stoppedRef.current = true;
          stopCamera();
          onDetected(results[0].rawValue);
          return;
        }
      } catch {
        // Transient decode errors (e.g. a frame mid-motion-blur) are expected
        // and safe to ignore — just try again on the next frame.
      }
      if (!stoppedRef.current) requestAnimationFrame(scanLoop);
    };

    const start = async () => {
      try {
        detector = new BarcodeDetector({ formats: ["ean_13"] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stoppedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        requestAnimationFrame(scanLoop);
      } catch (err) {
        if (err.name === "NotAllowedError") {
          setError("Kamertilgang ble avslått. Slå det på i nettleserinnstillingene, eller søk manuelt i stedet.");
        } else if (err.name === "NotFoundError") {
          setError("Fant ikke noe kamera på denne enheten. Søk manuelt i stedet.");
        } else {
          setError("Greide ikke starte kameraet. Søk manuelt i stedet.");
        }
      }
    };

    start();

    return () => {
      stoppedRef.current = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {error ? (
        <div
          className="p-4 rounded-xl text-sm font-semibold text-center"
          style={{ background: "var(--color-terracotta-tint)", color: "var(--color-terracotta)" }}
        >
          {error}
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden" style={{ background: "#000" }}>
          <video ref={videoRef} muted playsInline className="w-full aspect-[4/3] object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-4/5 h-1/3 rounded-lg"
              style={{ border: "3px solid var(--color-secondary)", boxShadow: "0 0 0 999px rgba(0,0,0,0.35)" }}
            />
          </div>
          <p className="absolute bottom-3 inset-x-0 text-center text-white text-sm font-semibold drop-shadow">
            Hold strekkoden innenfor rammen
          </p>
        </div>
      )}
      <button type="button" onClick={onCancel} className="w-full btn-accent">
        ← Tilbake til søk
      </button>
    </div>
  );
};

export default BarcodeScannerView;
