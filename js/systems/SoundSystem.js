/**
 * SoundSystem - Procedural Web Audio API sound generator
 * Generates all sound effects and music procedurally using oscillators
 */
class SoundSystem {
  constructor(scene) {
    this.scene = scene;

    // Initialize AudioContext
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
      this.audioContext = null;
    }

    // Load settings from localStorage
    this.soundEnabled = localStorage.getItem('ff_sound_enabled') !== 'false';
    this.musicEnabled = localStorage.getItem('ff_music_enabled') !== 'false';

    // Track active sounds
    this.activeSounds = new Set();
    this.bgmNode = null;
    this.bgmGain = null;
    this.currentBGM = null;

    // Master gain nodes
    if (this.audioContext) {
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);

      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.audioContext.createGain();
      this.musicGain.connect(this.masterGain);

      // Set initial volumes
      this.sfxGain.gain.value = this.soundEnabled ? 0.3 : 0;
      this.musicGain.gain.value = this.musicEnabled ? 0.15 : 0;
    }
  }

  /**
   * Resume audio context (required after user interaction on some browsers)
   */
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Play a sound effect by key
   */
  play(key) {
    if (!this.audioContext || !this.soundEnabled) return;

    this.resume();

    const now = this.audioContext.currentTime;

    switch (key) {
      case 'sfx_eat':
        this.playEatSound(now);
        break;
      case 'sfx_eat_big':
        this.playEatBigSound(now);
        break;
      case 'sfx_grow':
        this.playGrowSound(now);
        break;
      case 'sfx_hit':
        this.playHitSound(now);
        break;
      case 'sfx_death':
        this.playDeathSound(now);
        break;
      case 'sfx_power_up':
        this.playPowerUpSound(now);
        break;
      case 'sfx_frenzy':
        this.playFrenzySound(now);
        break;
      case 'sfx_level_up':
        this.playLevelUpSound(now);
        break;
      case 'sfx_click':
        this.playClickSound(now);
        break;
      default:
        console.warn('Unknown sound key:', key);
    }
  }

  /**
   * Quick chomp/pop sound - short, percussive
   */
  playEatSound(startTime) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, startTime);
    osc.frequency.exponentialRampToValueAtTime(150, startTime + 0.05);

    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(startTime);
    osc.stop(startTime + 0.08);

    this.trackSound(osc);
  }

  /**
   * Deeper, more satisfying chomp for bigger fish
   */
  playEatBigSound(startTime) {
    // Main chomp
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, startTime);
    osc1.frequency.exponentialRampToValueAtTime(80, startTime + 0.1);

    gain1.gain.setValueAtTime(0.5, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);

    // Low rumble
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(60, startTime);

    gain2.gain.setValueAtTime(0.3, startTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);

    osc1.start(startTime);
    osc1.stop(startTime + 0.15);
    osc2.start(startTime);
    osc2.stop(startTime + 0.15);

    this.trackSound(osc1);
    this.trackSound(osc2);
  }

  /**
   * Ascending chime/sparkle for growth
   */
  playGrowSound(startTime) {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + i * 0.05);

      gain.gain.setValueAtTime(0, startTime + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.3, startTime + i * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime + i * 0.05);
      osc.stop(startTime + i * 0.05 + 0.2);

      this.trackSound(osc);
    });
  }

  /**
   * Impact/thud sound
   */
  playHitSound(startTime) {
    // White noise burst
    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, startTime);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.5, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(startTime);
    noise.stop(startTime + 0.1);

    this.trackSound(noise);
  }

  /**
   * Descending sad sound for death
   */
  playDeathSound(startTime) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, startTime);
    osc.frequency.exponentialRampToValueAtTime(110, startTime + 0.5);

    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(startTime);
    osc.stop(startTime + 0.5);

    this.trackSound(osc);
  }

  /**
   * Magical ascending sound for power-ups
   */
  playPowerUpSound(startTime) {
    // Arpeggio: C4, E4, G4, C5
    const notes = [261.63, 329.63, 392.00, 523.25];

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + i * 0.06);

      gain.gain.setValueAtTime(0, startTime + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.25, startTime + i * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime + i * 0.06);
      osc.stop(startTime + i * 0.06 + 0.3);

      this.trackSound(osc);
    });

    // Shimmer effect
    const shimmer = this.audioContext.createOscillator();
    const shimmerGain = this.audioContext.createGain();
    const shimmerLFO = this.audioContext.createOscillator();

    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1200, startTime);

    shimmerLFO.frequency.setValueAtTime(8, startTime);
    shimmerLFO.connect(shimmerGain.gain);

    shimmerGain.gain.setValueAtTime(0.1, startTime);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.sfxGain);

    shimmer.start(startTime);
    shimmer.stop(startTime + 0.4);
    shimmerLFO.start(startTime);
    shimmerLFO.stop(startTime + 0.4);

    this.trackSound(shimmer);
    this.trackSound(shimmerLFO);
  }

  /**
   * Exciting rising sound for frenzy mode
   */
  playFrenzySound(startTime) {
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(200, startTime);
    osc1.frequency.exponentialRampToValueAtTime(800, startTime + 0.3);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(400, startTime);
    osc2.frequency.exponentialRampToValueAtTime(1600, startTime + 0.3);

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(startTime);
    osc1.stop(startTime + 0.3);
    osc2.start(startTime);
    osc2.stop(startTime + 0.3);

    this.trackSound(osc1);
    this.trackSound(osc2);
  }

  /**
   * Victory fanfare for level up
   */
  playLevelUpSound(startTime) {
    // Fanfare: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const durations = [0.15, 0.15, 0.15, 0.4];

    let offset = 0;
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime + offset);

      gain.gain.setValueAtTime(0.3, startTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + offset + durations[i]);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime + offset);
      osc.stop(startTime + offset + durations[i]);

      this.trackSound(osc);

      offset += durations[i] * 0.8;
    });
  }

  /**
   * UI click sound
   */
  playClickSound(startTime) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, startTime);
    osc.frequency.exponentialRampToValueAtTime(400, startTime + 0.05);

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(startTime);
    osc.stop(startTime + 0.05);

    this.trackSound(osc);
  }

  /**
   * Play background music (looping)
   */
  playBGM(key) {
    if (!this.audioContext || !this.musicEnabled) return;

    this.stopBGM();
    this.resume();

    this.currentBGM = key;

    if (key === 'bgm_menu') {
      this.playMenuBGM();
    } else if (key === 'bgm_game') {
      this.playGameBGM();
    }
  }

  /**
   * Calm underwater melody for menu
   */
  playMenuBGM() {
    // Simple pentatonic melody loop
    const melody = [
      { freq: 261.63, duration: 0.5 }, // C4
      { freq: 293.66, duration: 0.5 }, // D4
      { freq: 329.63, duration: 0.5 }, // E4
      { freq: 392.00, duration: 0.5 }, // G4
      { freq: 329.63, duration: 0.5 }, // E4
      { freq: 293.66, duration: 0.5 }, // D4
      { freq: 261.63, duration: 1.0 }, // C4
    ];

    const bass = [
      { freq: 130.81, duration: 2.0 }, // C3
      { freq: 146.83, duration: 2.0 }, // D3
    ];

    this.loopMelody(melody, bass, 0.15);
  }

  /**
   * Upbeat gameplay music
   */
  playGameBGM() {
    // More energetic melody
    const melody = [
      { freq: 523.25, duration: 0.3 }, // C5
      { freq: 587.33, duration: 0.3 }, // D5
      { freq: 659.25, duration: 0.3 }, // E5
      { freq: 523.25, duration: 0.3 }, // C5
      { freq: 783.99, duration: 0.4 }, // G5
      { freq: 659.25, duration: 0.4 }, // E5
      { freq: 587.33, duration: 0.6 }, // D5
    ];

    const bass = [
      { freq: 130.81, duration: 1.2 }, // C3
      { freq: 196.00, duration: 1.2 }, // G3
    ];

    this.loopMelody(melody, bass, 0.2);
  }

  /**
   * Create looping melody with bass line
   */
  loopMelody(melody, bass, volume) {
    if (!this.audioContext) return;

    // Calculate total duration
    const melodyDuration = melody.reduce((sum, note) => sum + note.duration, 0);
    const bassDuration = bass.reduce((sum, note) => sum + note.duration, 0);
    const loopDuration = Math.max(melodyDuration, bassDuration);

    const scheduleLoop = () => {
      if (this.currentBGM === null) return;

      const startTime = this.audioContext.currentTime;

      // Schedule melody notes
      let offset = 0;
      melody.forEach(note => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, startTime + offset);

        gain.gain.setValueAtTime(0, startTime + offset);
        gain.gain.linearRampToValueAtTime(volume, startTime + offset + 0.01);
        gain.gain.linearRampToValueAtTime(volume * 0.7, startTime + offset + note.duration * 0.8);
        gain.gain.linearRampToValueAtTime(0, startTime + offset + note.duration);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(startTime + offset);
        osc.stop(startTime + offset + note.duration);

        offset += note.duration;
      });

      // Schedule bass notes
      offset = 0;
      bass.forEach(note => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, startTime + offset);

        gain.gain.setValueAtTime(volume * 0.5, startTime + offset);
        gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + offset + note.duration);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(startTime + offset);
        osc.stop(startTime + offset + note.duration);

        offset += note.duration;
      });

      // Schedule next loop
      this.bgmNode = setTimeout(() => scheduleLoop(), loopDuration * 1000 - 100);
    };

    scheduleLoop();
  }

  /**
   * Stop current background music
   */
  stopBGM() {
    if (this.bgmNode) {
      clearTimeout(this.bgmNode);
      this.bgmNode = null;
    }
    this.currentBGM = null;
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    this.stopBGM();

    this.activeSounds.forEach(sound => {
      try {
        sound.stop();
      } catch (e) {
        // Sound may have already stopped
      }
    });

    this.activeSounds.clear();
  }

  /**
   * Enable or disable sound effects
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    localStorage.setItem('ff_sound_enabled', enabled);

    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(enabled ? 0.3 : 0, this.audioContext.currentTime);
    }
  }

  /**
   * Enable or disable music
   */
  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    localStorage.setItem('ff_music_enabled', enabled);

    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(enabled ? 0.15 : 0, this.audioContext.currentTime);
    }

    if (!enabled) {
      this.stopBGM();
    }
  }

  /**
   * Track active sound for cleanup
   */
  trackSound(sound) {
    this.activeSounds.add(sound);
    sound.onended = () => {
      this.activeSounds.delete(sound);
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopAll();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Register on window
window.SoundSystem = SoundSystem;
