/**
 * Real face-presence proctoring using @mediapipe/face_mesh.
 * Periodically samples a frame from the proctoring video stream and checks
 * whether a face is visible. The callback fires when absence is detected.
 */

type AbsenceCallback = (secondsAbsent: number) => void;

interface FaceProctor {
    start: () => void;
    stop: () => void;
}

const SAMPLE_INTERVAL_MS = 2000;
const ABSENCE_ALERT_THRESHOLD_S = 5;

// FaceMesh is expensive to init — share the single instance across all proctors.
let sharedFaceMeshInstance: any = null;

async function loadFaceMesh(): Promise<any> {
    if (sharedFaceMeshInstance) return sharedFaceMeshInstance;

    const { FaceMesh } = await import("@mediapipe/face_mesh");
    const instance = new FaceMesh({
        locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
    });
    instance.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });
    await instance.initialize();
    sharedFaceMeshInstance = instance;
    return instance;
}

export function createFaceProctor(
    videoEl: HTMLVideoElement,
    onAbsence: AbsenceCallback,
): FaceProctor {
    // Per-instance state — no shared globals
    let faceDetected = true;
    let absenceSince: number | null = null;
    let tickInterval: ReturnType<typeof setInterval> | null = null;
    let stopped = false;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;

    async function tick() {
        if (stopped || !videoEl || videoEl.readyState < 2) return;

        try {
            const fm = await loadFaceMesh();
            if (stopped) return; // guard against in-flight ticks after stop()

            // Wire up per-instance result handler each tick (FaceMesh is shared)
            fm.onResults((results: any) => {
                faceDetected =
                    results.multiFaceLandmarks &&
                    results.multiFaceLandmarks.length > 0;
            });

            if (!canvas) {
                canvas = document.createElement("canvas");
                ctx = canvas.getContext("2d");
            }
            canvas.width = videoEl.videoWidth || 320;
            canvas.height = videoEl.videoHeight || 240;
            ctx?.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

            await fm.send({ image: canvas });
            if (stopped) return;

            if (!faceDetected) {
                if (absenceSince === null) {
                    absenceSince = Date.now();
                } else {
                    const absentSeconds = (Date.now() - absenceSince) / 1000;
                    if (absentSeconds >= ABSENCE_ALERT_THRESHOLD_S) {
                        onAbsence(Math.round(absentSeconds));
                    }
                }
            } else {
                absenceSince = null;
            }
        } catch {
            // Non-fatal — proctoring degraded but assessment continues
        }
    }

    return {
        start() {
            stopped = false;
            faceDetected = true;
            absenceSince = null;
            if (tickInterval) clearInterval(tickInterval);
            tickInterval = setInterval(tick, SAMPLE_INTERVAL_MS);
        },
        stop() {
            stopped = true;
            if (tickInterval) {
                clearInterval(tickInterval);
                tickInterval = null;
            }
            absenceSince = null;
            canvas = null;
            ctx = null;
        },
    };
}
