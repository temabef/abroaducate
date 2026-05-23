/**
 * Device Fingerprinting Service
 * Collects browser/device characteristics to detect potential fraud
 */

import { browser } from '$app/environment';

export interface DeviceFingerprint {
    fingerprint: string;
    characteristics: {
        userAgent: string;
        language: string;
        platform: string;
        screenResolution: string;
        timezone: string;
        colorDepth: number;
        deviceMemory?: number;
        hardwareConcurrency?: number;
        cookieEnabled: boolean;
        doNotTrack: string | null;
        canvas?: string;
        webgl?: string;
        audio?: string;
    };
}

export class DeviceFingerprintService {
    private fingerprint: DeviceFingerprint | null = null;
    private hasUserInteracted: boolean = false;

    /**
     * Mark that user has interacted (for audio fingerprinting)
     */
    markUserInteraction(): void {
        this.hasUserInteracted = true;
    }

    /**
     * Generate device fingerprint
     */
    async generateFingerprint(): Promise<DeviceFingerprint> {
        if (this.fingerprint) {
            return this.fingerprint;
        }

        const characteristics = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            colorDepth: screen.colorDepth,
            deviceMemory: (navigator as any).deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            canvas: await this.getCanvasFingerprint(),
            webgl: this.getWebGLFingerprint(),
            audio: await this.getAudioFingerprint()
        };

        // Create fingerprint hash
        const fingerprintData = JSON.stringify(characteristics);
        const fingerprint = await this.hashString(fingerprintData);

        this.fingerprint = {
            fingerprint,
            characteristics
        };

        return this.fingerprint;
    }

    /**
     * Get cached fingerprint or generate new one
     */
    async getFingerprint(): Promise<string> {
        const deviceInfo = await this.generateFingerprint();
        return deviceInfo.fingerprint;
    }

    /**
     * Canvas fingerprinting for more unique identification
     */
    private async getCanvasFingerprint(): Promise<string> {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) return 'canvas-not-supported';

            canvas.width = 200;
            canvas.height = 50;

            // Draw text with specific styling
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Abroaducate 🎓', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Device ID', 4, 17);

            // Draw some shapes
            ctx.beginPath();
            ctx.arc(50, 25, 20, 0, Math.PI * 2);
            ctx.fillStyle = '#f60';
            ctx.fill();

            // Get canvas data
            const canvasData = canvas.toDataURL();
            return await this.hashString(canvasData);
        } catch (error) {
            console.warn('Canvas fingerprinting failed:', error);
            return 'canvas-error';
        }
    }

    /**
     * WebGL fingerprinting
     */
    private getWebGLFingerprint(): string {
        try {
            const canvas = document.createElement('canvas');
            const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
            
            if (!gl) return 'webgl-not-supported';

            const renderer = gl.getParameter(gl.RENDERER);
            const vendor = gl.getParameter(gl.VENDOR);
            const version = gl.getParameter(gl.VERSION);
            const shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);

            return btoa(`${renderer}-${vendor}-${version}-${shadingLanguageVersion}`);
        } catch (error) {
            console.warn('WebGL fingerprinting failed:', error);
            return 'webgl-error';
        }
    }

    /**
     * Audio context fingerprinting
     */
    private async getAudioFingerprint(): Promise<string> {
        try {
            // Only create audio context after user interaction to avoid autoplay warnings
            if (!this.hasUserInteracted) {
                return 'audio-pending';
            }
            
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Resume context if suspended
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            // Create oscillator
            const oscillator = audioContext.createOscillator();
            const analyser = audioContext.createAnalyser();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'triangle';
            oscillator.frequency.value = 1000;
            
            gainNode.gain.value = 0; // Silent
            
            oscillator.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            
            // Get frequency data
            const frequencyData = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(frequencyData);
            
            oscillator.stop();
            await audioContext.close();
            
            // Create hash from frequency data
            const dataString = Array.from(frequencyData).join(',');
            return await this.hashString(dataString);
        } catch (error) {
            console.warn('Audio fingerprinting failed:', error);
            return 'audio-error';
        }
    }

    /**
     * Hash a string using Web Crypto API
     */
    private async hashString(str: string): Promise<string> {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            // Fallback to simple hash if crypto API not available
            console.warn('Crypto API not available, using fallback hash');
            return this.simpleHash(str);
        }
    }

    /**
     * Simple fallback hash function
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Store fingerprint in database
     */
    async storeFingerprint(supabase: any, userId: string): Promise<void> {
        const deviceInfo = await this.generateFingerprint();
        
        try {
            const { error } = await supabase
                .from('device_fingerprints')
                .upsert({
                    user_id: userId,
                    fingerprint_hash: deviceInfo.fingerprint,
                    ip_address: await this.getClientIP(),
                    user_agent: deviceInfo.characteristics.userAgent,
                    screen_resolution: deviceInfo.characteristics.screenResolution,
                    timezone: deviceInfo.characteristics.timezone,
                    language: deviceInfo.characteristics.language,
                    platform: deviceInfo.characteristics.platform,
                    canvas_fingerprint: deviceInfo.characteristics.canvas,
                    webgl_fingerprint: deviceInfo.characteristics.webgl,
                    audio_fingerprint: deviceInfo.characteristics.audio,
                    last_seen_at: new Date().toISOString()
                }, {
                    onConflict: 'fingerprint_hash'
                });

            if (error) {
                console.error('Error storing device fingerprint:', error);
            }
        } catch (error) {
            console.error('Failed to store device fingerprint:', error);
        }
    }

    /**
     * Get client IP address (best effort)
     */
    private async getClientIP(): Promise<string> {
        try {
            // This is a best-effort approach. In production, you'd typically 
            // get the IP from your server logs or a service like ipify
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Could not determine IP address:', error);
            return 'unknown';
        }
    }

    /**
     * Check if current device shows signs of fraud
     */
    async checkDeviceRisk(supabase: any): Promise<{
        riskScore: number;
        riskFactors: string[];
        shouldBlock: boolean;
    }> {
        const deviceInfo = await this.generateFingerprint();
        const clientIP = await this.getClientIP();
        
        try {
            // Check for multiple recent registrations from this device/IP
            const { data: recentRegistrations } = await supabase
                .from('registration_events')
                .select('*')
                .or(`device_fingerprint.eq.${deviceInfo.fingerprint},ip_address.eq.${clientIP}`)
                .gte('registration_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            const riskFactors: string[] = [];
            let riskScore = 0;

            // Check device fingerprint matches
            const fingerprintMatches = recentRegistrations?.filter((r: any) => 
                r.device_fingerprint === deviceInfo.fingerprint) || [];
            
            if (fingerprintMatches.length > 3) {
                riskScore += 40;
                riskFactors.push(`Multiple registrations from same device (${fingerprintMatches.length})`);
            } else if (fingerprintMatches.length > 1) {
                riskScore += 20;
                riskFactors.push(`Repeated device fingerprint (${fingerprintMatches.length})`);
            }

            // Check IP matches
            const ipMatches = recentRegistrations?.filter((r: any) => 
                r.ip_address === clientIP) || [];
            
            if (ipMatches.length > 5) {
                riskScore += 30;
                riskFactors.push(`Multiple registrations from same IP (${ipMatches.length})`);
            } else if (ipMatches.length > 2) {
                riskScore += 15;
                riskFactors.push(`Repeated IP address (${ipMatches.length})`);
            }

            // Check for suspicious characteristics
            if (deviceInfo.characteristics.userAgent.length < 50) {
                riskScore += 10;
                riskFactors.push('Suspicious user agent');
            }

            if (deviceInfo.characteristics.platform === 'unknown' ||
                deviceInfo.characteristics.canvas === 'canvas-error' ||
                deviceInfo.characteristics.webgl === 'webgl-error') {
                riskScore += 15;
                riskFactors.push('Blocked browser features (possible automation)');
            }

            return {
                riskScore: Math.min(100, riskScore),
                riskFactors,
                shouldBlock: riskScore > 60
            };
        } catch (error) {
            console.error('Error checking device risk:', error);
            return {
                riskScore: 0,
                riskFactors: ['Error checking device history'],
                shouldBlock: false
            };
        }
    }
}

// Singleton instance
export const deviceFingerprintService = new DeviceFingerprintService(); 
