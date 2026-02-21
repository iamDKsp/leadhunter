// Sound effects for the Lead Hunter system using Web Audio API
// No external files needed — all sounds are generated programmatically

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/**
 * Plays a short notification "ding" sound — two ascending tones.
 * Used when a new WhatsApp message arrives.
 */
export function playNotificationSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // First tone (C5 = 523 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523, now);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        // Second tone (E5 = 659 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659, now + 0.12);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0.3, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.35);
    } catch (e) {
        console.warn('Could not play notification sound:', e);
    }
}

/**
 * Plays a celebratory fanfare — ascending chord progression.
 * Used when a lead is marked as "won" (sale closed).
 */
export function playCelebrationSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Fanfare notes: C5, E5, G5, C6 (major chord arpeggio)
        const notes = [
            { freq: 523.25, start: 0, dur: 0.2 },  // C5
            { freq: 659.25, start: 0.15, dur: 0.2 },  // E5
            { freq: 783.99, start: 0.3, dur: 0.2 },  // G5
            { freq: 1046.5, start: 0.45, dur: 0.5 },  // C6 (longer, grand finale)
        ];

        notes.forEach(({ freq, start, dur }) => {
            // Main oscillator (sine for clean tone)
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + start);
            gain.gain.setValueAtTime(0.25, now + start);
            gain.gain.exponentialRampToValueAtTime(0.01, now + start + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + start);
            osc.stop(now + start + dur);

            // Harmonic overtone (triangle for richness)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq * 2, now + start);
            gain2.gain.setValueAtTime(0.08, now + start);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + start + dur);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + start);
            osc2.stop(now + start + dur);
        });

        // Final shimmering chord (all notes together)
        const chordStart = now + 0.7;
        const chordFreqs = [523.25, 659.25, 783.99, 1046.5];
        chordFreqs.forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, chordStart);
            gain.gain.setValueAtTime(0.15, chordStart);
            gain.gain.exponentialRampToValueAtTime(0.01, chordStart + 1.0);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(chordStart);
            osc.stop(chordStart + 1.0);
        });
    } catch (e) {
        console.warn('Could not play celebration sound:', e);
    }
}

/**
 * Plays a smooth meeting chime — 3 ascending notes.
 * Used when a lead meeting is scheduled.
 */
export function playMeetingSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Smooth chime: D5, F#5, A5 (D major arpeggio — warm, professional)
        const notes = [
            { freq: 587.33, start: 0, dur: 0.25 },    // D5
            { freq: 739.99, start: 0.2, dur: 0.25 },   // F#5
            { freq: 880.00, start: 0.4, dur: 0.4 },    // A5 (longer)
        ];

        notes.forEach(({ freq, start, dur }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + start);
            gain.gain.setValueAtTime(0.2, now + start);
            gain.gain.exponentialRampToValueAtTime(0.01, now + start + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + start);
            osc.stop(now + start + dur);

            // Soft triangle overtone
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq * 1.5, now + start);
            gain2.gain.setValueAtTime(0.06, now + start);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + start + dur);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + start);
            osc2.stop(now + start + dur);
        });

        // Final sustained chord
        const chordStart = now + 0.65;
        [587.33, 739.99, 880.00].forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, chordStart);
            gain.gain.setValueAtTime(0.1, chordStart);
            gain.gain.exponentialRampToValueAtTime(0.01, chordStart + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(chordStart);
            osc.stop(chordStart + 0.8);
        });
    } catch (e) {
        console.warn('Could not play meeting sound:', e);
    }
}
