import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BrowserQRCodeReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

type WebQrScannerProps = {
    active: boolean;
    onScan: (payload: string) => void;
};

export function WebQrScanner({ active, onScan }: WebQrScannerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const controlsRef = useRef<{ stop: () => void } | null>(null);

    const reader = useMemo(() => new BrowserQRCodeReader(), []);

    useEffect(() => {
        if (!active || typeof window === "undefined" || !videoRef.current) {
            return;
        }

        let disposed = false;

        void (async () => {
            try {
                const controls = await reader.decodeFromConstraints(
                    {
                        audio: false,
                        video: { facingMode: "environment" },
                    },
                    videoRef.current!,
                    (result, err) => {
                        if (disposed) {
                            return;
                        }

                        if (result) {
                            onScan(result.getText());
                            return;
                        }

                        if (err && !(err instanceof NotFoundException)) {
                            return;
                        }
                    },
                );
                controlsRef.current = controls;
            } catch {
                return;
            }
        })();

        return () => {
            disposed = true;
            controlsRef.current?.stop();
            controlsRef.current = null;
            BrowserMultiFormatReader.releaseAllStreams();
        };
    }, [active, onScan, reader]);

    return (
        <>
            <video
                ref={videoRef}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 14,
                }}
                muted
                autoPlay
                playsInline
            />
        </>
    );
}
