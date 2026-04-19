/**
 * Advanced Proctoring Service
 * Enhanced anti-cheating measures and integrity monitoring
 */

// =====================================================
// INTERFACES
// =====================================================

export interface ProctoringSession {
    sessionId: string;
    candidateId: string;
    assessmentId: string;
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'flagged' | 'terminated' | 'completed';
    integrityScore: number; // 0-100
    violations: Violation[];
    environmentCheck: EnvironmentCheck;
    behaviorMetrics: BehaviorMetrics;
}

export interface Violation {
    id: string;
    type: ViolationType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    description: string;
    evidence?: string;
    acknowledged: boolean;
    action: 'warning' | 'flagged' | 'terminated';
}

export type ViolationType =
    | 'tab_switch'
    | 'window_blur'
    | 'copy_paste'
    | 'screenshot_attempt'
    | 'second_monitor'
    | 'browser_resize'
    | 'devtools_open'
    | 'face_not_detected'
    | 'multiple_faces'
    | 'voice_detected'
    | 'phone_detected'
    | 'suspicious_keystroke'
    | 'external_resource'
    | 'code_similarity'
    | 'ai_generated_content';

export interface EnvironmentCheck {
    singleMonitor: boolean;
    webcamAccess: boolean;
    microphoneAccess: boolean;
    screenShareAllowed: boolean;
    browserType: string;
    browserVersion: string;
    osType: string;
    ipAddress: string;
    timezone: string;
    fullscreenEnabled: boolean;
    extensionsDisabled: boolean;
}

export interface BehaviorMetrics {
    keystrokePatterns: KeystrokePattern[];
    averageWPM: number;
    pauseDurations: number[];
    copyPasteEvents: number;
    tabSwitchCount: number;
    focusLostDuration: number;
    mouseIdleTime: number;
}

export interface KeystrokePattern {
    timestamp: number;
    key: string;
    duration: number;
    interval: number;
}

export interface ProctoringConfig {
    enableWebcam: boolean;
    enableMicrophone: boolean;
    enableScreenShare: boolean;
    allowTabSwitch: boolean;
    maxTabSwitches: number;
    enforceFullscreen: boolean;
    detectDevTools: boolean;
    detectSecondMonitor: boolean;
    enableKeystrokeAnalysis: boolean;
    enablePlagiarismCheck: boolean;
    enableAIDetection: boolean;
    strictnessLevel: 'low' | 'medium' | 'high' | 'enterprise';
}

interface ProctoringCallbacks {
    onViolation?: (violation: Violation) => void;
    onWarning?: (message: string) => void;
    onTerminate?: (reason: string) => void;
    onIntegrityUpdate?: (score: number) => void;
}

// =====================================================
// PROCTORING SERVICE
// =====================================================

class ProctoringService {
    private session: ProctoringSession | null = null;
    private config: ProctoringConfig;
    private callbacks: ProctoringCallbacks = {};
    private eventListeners: (() => void)[] = [];
    private keystrokeBuffer: KeystrokePattern[] = [];
    private lastKeystrokeTime = 0;
    private tabSwitchWarnings = 0;
    private isFullscreen = false;

    // Advanced proctoring state
    private videoElement: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private initialFaceDescriptor: { centerX: number; centerY: number; width: number; height: number } | null = null;
    private gazeCalibration: { centerX: number; centerY: number } | null = null;
    private faceCheckInterval: NodeJS.Timeout | null = null;
    private gazeCheckInterval: NodeJS.Timeout | null = null;
    private deviceId: string;

    constructor(config?: Partial<ProctoringConfig>) {
        this.config = {
            enableWebcam: true,
            enableMicrophone: false,
            enableScreenShare: false,
            allowTabSwitch: false,
            maxTabSwitches: 3,
            enforceFullscreen: true,
            detectDevTools: true,
            detectSecondMonitor: true,
            enableKeystrokeAnalysis: true,
            enablePlagiarismCheck: true,
            enableAIDetection: true,
            strictnessLevel: 'medium',
            ...config
        };

        // Generate unique device ID for multi-device detection
        this.deviceId = localStorage.getItem('lune_device_id') || `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem('lune_device_id', this.deviceId);
    }

    async startSession(
        sessionId: string,
        candidateId: string,
        assessmentId: string,
        callbacks: ProctoringCallbacks = {}
    ): Promise<ProctoringSession> {
        this.callbacks = callbacks;
        const envCheck = await this.checkEnvironment();

        this.session = {
            sessionId,
            candidateId,
            assessmentId,
            startTime: new Date(),
            status: 'active',
            integrityScore: 100,
            violations: [],
            environmentCheck: envCheck,
            behaviorMetrics: {
                keystrokePatterns: [],
                averageWPM: 0,
                pauseDurations: [],
                copyPasteEvents: 0,
                tabSwitchCount: 0,
                focusLostDuration: 0,
                mouseIdleTime: 0
            }
        };

        this.setupEventListeners();

        // Check for multi-device
        await this.checkMultiDevice(candidateId, assessmentId);

        // Check for screen recording
        await this.detectScreenRecording();

        if (this.config.enforceFullscreen) {
            await this.enterFullscreen();
        }

        return this.session;
    }

    // =====================================================
    // FACE VERIFICATION
    // =====================================================

    async initializeFaceVerification(videoElement: HTMLVideoElement): Promise<boolean> {
        this.videoElement = videoElement;
        this.canvas = document.createElement('canvas');
        this.canvas.width = 320;
        this.canvas.height = 240;
        this.ctx = this.canvas.getContext('2d');

        if (!this.ctx) return false;

        // Capture initial face
        const captured = await this.captureInitialFace();

        if (captured) {
            // Start periodic face verification
            this.faceCheckInterval = setInterval(() => {
                this.verifyFace();
            }, 30000); // Check every 30 seconds

            // Start gaze tracking
            this.gazeCheckInterval = setInterval(() => {
                this.detectGaze();
            }, 5000); // Check every 5 seconds
        }

        return captured;
    }

    private async captureInitialFace(): Promise<boolean> {
        if (!this.videoElement || !this.ctx || !this.canvas) return false;

        this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const faceRegion = this.detectFaceRegion(imageData);

        if (faceRegion) {
            this.initialFaceDescriptor = faceRegion;
            this.gazeCalibration = {
                centerX: faceRegion.centerX,
                centerY: faceRegion.centerY
            };
            return true;
        }

        return false;
    }

    private async verifyFace(): Promise<void> {
        if (!this.initialFaceDescriptor || !this.videoElement || !this.ctx || !this.canvas) return;

        this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const currentFace = this.detectFaceRegion(imageData);

        if (!currentFace) {
            this.handleViolation('face_not_detected', 'No face detected in frame', 'high');
            return;
        }

        // Compare face regions
        const sizeDifference = Math.abs(
            (currentFace.width * currentFace.height) -
            (this.initialFaceDescriptor.width * this.initialFaceDescriptor.height)
        );

        // If face size changed dramatically, might be different person
        if (sizeDifference > 5000) {
            this.handleViolation('face_not_detected', 'Face verification failed - possible different person', 'high');
        }
    }

    private detectFaceRegion(imageData: ImageData): { centerX: number; centerY: number; width: number; height: number } | null {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        let minX = width, maxX = 0, minY = height, maxY = 0;
        let skinPixelCount = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                if (this.isSkinTone(r, g, b)) {
                    skinPixelCount++;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (skinPixelCount < 1000) return null;

        return {
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    private isSkinTone(r: number, g: number, b: number): boolean {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return (
            r > 95 && g > 40 && b > 20 &&
            max - min > 15 &&
            Math.abs(r - g) > 15 &&
            r > g && r > b
        );
    }

    // =====================================================
    // GAZE TRACKING
    // =====================================================

    private async detectGaze(): Promise<void> {
        if (!this.gazeCalibration || !this.videoElement || !this.ctx || !this.canvas) return;

        this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        const eyeRegion = this.findEyeRegion(imageData);

        if (!eyeRegion) {
            this.handleViolation('face_not_detected', 'Eyes not visible - possible looking away', 'medium');
            return;
        }

        const xDiff = eyeRegion.centerX - this.gazeCalibration.centerX;
        const yDiff = eyeRegion.centerY - this.gazeCalibration.centerY;

        const horizontalThreshold = 30;
        const verticalThreshold = 20;

        if (Math.abs(xDiff) > horizontalThreshold || Math.abs(yDiff) > verticalThreshold) {
            const direction = Math.abs(xDiff) > Math.abs(yDiff)
                ? (xDiff > 0 ? 'right' : 'left')
                : (yDiff > 0 ? 'down' : 'up');
            this.handleViolation('face_not_detected', `Gaze direction: looking ${direction}`, 'low');
        }
    }

    private findEyeRegion(imageData: ImageData): { centerX: number; centerY: number } | null {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        const searchStartY = Math.floor(height * 0.2);
        const searchEndY = Math.floor(height * 0.5);

        let darkPixelSumX = 0, darkPixelSumY = 0, darkPixelCount = 0;

        for (let y = searchStartY; y < searchEndY; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

                if (brightness < 60) {
                    darkPixelSumX += x;
                    darkPixelSumY += y;
                    darkPixelCount++;
                }
            }
        }

        if (darkPixelCount < 50) return null;

        return {
            centerX: darkPixelSumX / darkPixelCount,
            centerY: darkPixelSumY / darkPixelCount
        };
    }

    // =====================================================
    // SCREEN RECORDING DETECTION
    // =====================================================

    private async detectScreenRecording(): Promise<void> {
        // Method 1: Check frame timing irregularities
        const frameTimings: number[] = [];
        let lastFrameTime = performance.now();

        await new Promise<void>((resolve) => {
            let frameCount = 0;
            const checkFrameTiming = () => {
                const now = performance.now();
                frameTimings.push(now - lastFrameTime);
                lastFrameTime = now;
                frameCount++;

                if (frameCount < 30) {
                    requestAnimationFrame(checkFrameTiming);
                } else {
                    const avgDelta = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
                    const variance = frameTimings.reduce((sum, t) => sum + Math.pow(t - avgDelta, 2), 0) / frameTimings.length;

                    if (variance > 150) {
                        this.handleViolation('screenshot_attempt', 'Possible screen recording detected (frame timing irregularity)', 'high');
                    }
                    resolve();
                }
            };
            requestAnimationFrame(checkFrameTiming);
        });

        // Method 2: Check for display capture API usage indication

    }

    // =====================================================
    // MULTI-DEVICE DETECTION
    // =====================================================

    private async checkMultiDevice(candidateId: string, assessmentId: string): Promise<void> {
        const sessionKey = `lune_session_${assessmentId}_${candidateId}`;
        const existingSessions = JSON.parse(localStorage.getItem(sessionKey) || '[]');
        const now = Date.now();

        // Clean old sessions (older than 30 minutes)
        const activeSessions = existingSessions.filter(
            (s: { deviceId: string; timestamp: number }) => now - s.timestamp < 30 * 60 * 1000
        );

        // Check for other devices
        const otherDevices = activeSessions.filter(
            (s: { deviceId: string }) => s.deviceId !== this.deviceId
        );

        if (otherDevices.length > 0) {
            this.handleViolation('second_monitor', `Multiple devices detected (${otherDevices.length + 1} sessions)`, 'critical');
        }

        // Register this device
        const updatedSessions = activeSessions.filter(
            (s: { deviceId: string }) => s.deviceId !== this.deviceId
        );
        updatedSessions.push({ deviceId: this.deviceId, timestamp: now });
        localStorage.setItem(sessionKey, JSON.stringify(updatedSessions));

        // Setup heartbeat
        const heartbeatInterval = setInterval(() => {
            const sessions = JSON.parse(localStorage.getItem(sessionKey) || '[]');
            const mySession = sessions.find((s: { deviceId: string }) => s.deviceId === this.deviceId);
            if (mySession) {
                mySession.timestamp = Date.now();
                localStorage.setItem(sessionKey, JSON.stringify(sessions));
            }
        }, 10000);

        this.eventListeners.push(() => clearInterval(heartbeatInterval));
    }

    private async checkEnvironment(): Promise<EnvironmentCheck> {
        const check: EnvironmentCheck = {
            singleMonitor: (window.screen as any).isExtended !== true,
            webcamAccess: false,
            microphoneAccess: false,
            screenShareAllowed: false,
            browserType: this.getBrowserType(),
            browserVersion: navigator.userAgent,
            osType: navigator.platform,
            ipAddress: 'detected',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            fullscreenEnabled: document.fullscreenEnabled || false,
            extensionsDisabled: true
        };

        if (this.config.enableWebcam) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                check.webcamAccess = true;
            } catch {
                check.webcamAccess = false;
            }
        }

        return check;
    }

    private setupEventListeners(): void {
        const visibilityHandler = () => {
            if (document.hidden) {
                this.handleViolation('tab_switch', 'Switched to another tab');
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.push(() => document.removeEventListener('visibilitychange', visibilityHandler));

        const blurHandler = () => {
            this.handleViolation('window_blur', 'Window lost focus');
        };
        window.addEventListener('blur', blurHandler);
        this.eventListeners.push(() => window.removeEventListener('blur', blurHandler));

        const copyHandler = () => {
            if (this.session) this.session.behaviorMetrics.copyPasteEvents++;
            this.handleViolation('copy_paste', 'Copy event detected', 'low');
        };
        document.addEventListener('copy', copyHandler);
        this.eventListeners.push(() => document.removeEventListener('copy', copyHandler));

        const pasteHandler = () => {
            if (this.session) this.session.behaviorMetrics.copyPasteEvents++;
            this.handleViolation('copy_paste', 'Paste event detected', 'medium');
        };
        document.addEventListener('paste', pasteHandler);
        this.eventListeners.push(() => document.removeEventListener('paste', pasteHandler));

        // Fullscreen exit detection
        const fullscreenHandler = () => {
            if (!document.fullscreenElement && this.isFullscreen) {
                this.handleViolation('browser_resize', 'Exited fullscreen mode', 'high');
            }
        };
        document.addEventListener('fullscreenchange', fullscreenHandler);
        this.eventListeners.push(() => document.removeEventListener('fullscreenchange', fullscreenHandler));

        // Escape key blocking
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.handleViolation('browser_resize', 'Escape key pressed - attempting to exit fullscreen', 'medium');
            }
        };
        window.addEventListener('keydown', escapeHandler);
        this.eventListeners.push(() => window.removeEventListener('keydown', escapeHandler));

        if (this.config.detectDevTools) {
            const devtoolsHandler = () => {
                const widthThreshold = window.outerWidth - window.innerWidth > 160;
                const heightThreshold = window.outerHeight - window.innerHeight > 160;
                if (widthThreshold || heightThreshold) {
                    this.handleViolation('devtools_open', 'Developer tools may be open', 'high');
                }
            };
            window.addEventListener('resize', devtoolsHandler);
            this.eventListeners.push(() => window.removeEventListener('resize', devtoolsHandler));
        }

        const contextHandler = (e: MouseEvent) => {
            e.preventDefault();
            this.handleViolation('external_resource', 'Right-click menu attempted', 'low');
        };
        document.addEventListener('contextmenu', contextHandler);
        this.eventListeners.push(() => document.removeEventListener('contextmenu', contextHandler));

        // Beforeunload warning
        const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Your assessment is in progress. Are you sure you want to leave?';
            return e.returnValue;
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        this.eventListeners.push(() => window.removeEventListener('beforeunload', beforeUnloadHandler));
    }

    private handleViolation(
        type: ViolationType,
        description: string,
        severity: Violation['severity'] = 'medium'
    ): void {
        if (!this.session) return;

        let action: Violation['action'] = 'warning';
        let deduction = 0;

        switch (severity) {
            case 'low': deduction = 2; action = 'warning'; break;
            case 'medium': deduction = 5; action = 'warning'; break;
            case 'high': deduction = 10; action = 'flagged'; break;
            case 'critical': deduction = 25; action = 'terminated'; break;
        }

        const violation: Violation = {
            id: `vio-${Date.now()}`,
            type,
            severity,
            timestamp: new Date(),
            description,
            acknowledged: false,
            action
        };

        this.session.violations.push(violation);
        this.session.integrityScore = Math.max(0, this.session.integrityScore - deduction);

        if (action === 'flagged') this.session.status = 'flagged';
        if (action === 'terminated') {
            this.session.status = 'terminated';
            this.callbacks.onTerminate?.(description);
        }

        this.callbacks.onViolation?.(violation);
        this.callbacks.onIntegrityUpdate?.(this.session.integrityScore);
        if (action === 'warning') this.callbacks.onWarning?.(description);

        if (type === 'tab_switch') {
            this.tabSwitchWarnings++;
            if (this.tabSwitchWarnings >= this.config.maxTabSwitches) {
                this.handleViolation('tab_switch', 'Maximum tab switches exceeded', 'critical');
            }
        }
    }

    async checkPlagiarism(code: string): Promise<{ similarity: number; sources: string[]; isPlagiarized: boolean }> {
        // Quick heuristic checks
        const indicators = [
            { pattern: /according to (wikipedia|google)/i, weight: 0.3 },
            { pattern: /source:|reference:|citation:/i, weight: 0.2 },
            { pattern: /\[\d+\]|\(\d+\)/g, weight: 0.2 },
            { pattern: /furthermore|moreover|nevertheless/gi, weight: 0.1 },
            { pattern: /as an ai|generated by|language model/i, weight: 0.5 },
        ];

        let plagiarismScore = 0;
        const detectedPatterns: string[] = [];

        for (const indicator of indicators) {
            if (indicator.pattern.test(code)) {
                plagiarismScore += indicator.weight;
                detectedPatterns.push(indicator.pattern.toString());
            }
        }

        const isPlagiarized = plagiarismScore > 0.5;

        if (isPlagiarized) {
            this.handleViolation('code_similarity', `Potential plagiarism detected: ${detectedPatterns.join(', ')}`, 'high');
        }

        return {
            similarity: plagiarismScore * 100,
            sources: detectedPatterns,
            isPlagiarized
        };
    }

    async checkAIGenerated(content: string): Promise<{ probability: number; indicators: string[] }> {
        await new Promise(resolve => setTimeout(resolve, 500));
        const indicators: string[] = [];
        let probability = 0;

        const aiPhrases = ['as an AI', 'language model', 'I cannot', 'here is the', 'sure,', 'generated by', 'openai', 'gpt', 'claude'];
        aiPhrases.forEach(phrase => {
            if (content.toLowerCase().includes(phrase.toLowerCase())) {
                indicators.push(`Contains: "${phrase}"`);
                probability += 15;
            }
        });

        // Check for overly perfect formatting
        if ((content.match(/\n- /g) || []).length > 3 || (content.match(/\d\. /g) || []).length > 3) {
            indicators.push('Suspiciously perfect formatting');
            probability += 20;
        }

        if (probability > 50) {
            this.handleViolation('ai_generated_content', `Possible AI content (${probability}%)`, 'high');
        }
        return { probability: Math.min(probability, 100), indicators };
    }

    private async enterFullscreen(): Promise<void> {
        try {
            await document.documentElement.requestFullscreen();
            this.isFullscreen = true;
        } catch { /* fullscreen not supported */ }
    }

    private getBrowserType(): string {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    endSession(): ProctoringSession | null {
        if (!this.session) return null;

        this.session.endTime = new Date();
        this.session.status = this.session.status === 'active' ? 'completed' : this.session.status;

        // Clean up intervals
        if (this.faceCheckInterval) clearInterval(this.faceCheckInterval);
        if (this.gazeCheckInterval) clearInterval(this.gazeCheckInterval);

        this.eventListeners.forEach(cleanup => cleanup());
        this.eventListeners = [];

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }

        const finalSession = this.session;
        this.session = null;
        return finalSession;
    }

    getSessionStatus(): ProctoringSession | null {
        return this.session;
    }

    acknowledgeViolation(violationId: string): void {
        if (!this.session) return;
        const violation = this.session.violations.find(v => v.id === violationId);
        if (violation) violation.acknowledged = true;
    }
}

export const proctoringService = new ProctoringService();
export { ProctoringService };

