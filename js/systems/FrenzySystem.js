/**
 * FrenzySystem.js - Combo / Frenzy Multiplier System
 * Feeding Frenzy - Fish Feeding Game
 *
 * Tracks consecutive fish eaten, advances through frenzy tiers,
 * applies score multipliers, and emits events for visual/audio feedback.
 * Combo decays after FRENZY_DECAY_TIME ms of inactivity.
 */

window.FrenzySystem = class FrenzySystem {

    /**
     * @param {Phaser.Scene} scene - The game scene that owns this system.
     */
    constructor(scene) {
        this.scene = scene;

        // ---- State ----
        this.combo       = 0;     // Consecutive fish eaten without decay
        this.currentTier = 0;     // 0 = no frenzy, 1-4 = frenzy tiers
        this.multiplier  = 1;     // Current score multiplier
        this.decayTimer  = 0;     // ms remaining before combo resets
        this.isActive    = false; // True when currentTier > 0
    }

    // ------------------------------------------------------------------
    // PUBLIC API
    // ------------------------------------------------------------------

    /**
     * Call when the player successfully eats a fish.
     * Increments combo, checks for tier advancement, resets decay timer.
     */
    onFishEaten() {
        var C = window.Constants;

        this.combo++;
        this.decayTimer = C.FRENZY_DECAY_TIME;

        // ---- Check tier advancement ----
        var previousTier = this.currentTier;
        var newTier = 0;
        var thresholds = C.FRENZY_THRESHOLDS;

        for (var i = thresholds.length - 1; i >= 0; i--) {
            if (this.combo >= thresholds[i]) {
                newTier = i + 1; // tiers are 1-indexed (tier 1 = 2x, ... tier 4 = 5x)
                break;
            }
        }

        this.currentTier = newTier;
        this.multiplier  = C.FRENZY_MULTIPLIERS[this.currentTier];
        this.isActive    = this.currentTier > 0;

        // ---- Emit update event ----
        this.scene.events.emit('frenzyUpdate', {
            combo:      this.combo,
            tier:       this.currentTier,
            multiplier: this.multiplier,
            color:      this.getColor()
        });

        // ---- Emit tier-up event if we advanced ----
        if (this.currentTier > previousTier && this.currentTier > 0) {
            this.scene.events.emit('frenzyTierUp', {
                tier:       this.currentTier,
                multiplier: this.multiplier,
                color:      this.getColor(),
                combo:      this.combo
            });
        }
    }

    /**
     * @returns {number} Current frenzy score multiplier (1-5).
     */
    getMultiplier() {
        return window.Constants.FRENZY_MULTIPLIERS[this.currentTier];
    }

    /**
     * @returns {string} CSS colour string for the current frenzy tier.
     */
    getColor() {
        return window.Constants.FRENZY_COLORS[this.currentTier];
    }

    /**
     * @returns {boolean} True if the player is in any frenzy tier (>= tier 1).
     */
    isInFrenzy() {
        return this.currentTier > 0;
    }

    /**
     * Called every frame by the owning scene.
     * Counts down the decay timer and resets the combo when it expires.
     *
     * @param {number} time  - Current game time in ms.
     * @param {number} delta - ms elapsed since last frame.
     */
    update(time, delta) {
        if (this.combo === 0) {
            return; // Nothing to decay
        }

        this.decayTimer -= delta;

        if (this.decayTimer <= 0) {
            this.decayTimer = 0;
            var wasFrenzy = this.isActive;

            this.combo       = 0;
            this.currentTier = 0;
            this.multiplier  = 1;
            this.isActive    = false;

            // Only emit reset if we were actually in a frenzy or had a combo
            this.scene.events.emit('frenzyReset', {
                wasFrenzy: wasFrenzy
            });
        }
    }

    /**
     * Reset all frenzy state to defaults (e.g. on death or level restart).
     */
    reset() {
        this.combo       = 0;
        this.currentTier = 0;
        this.multiplier  = 1;
        this.decayTimer  = 0;
        this.isActive    = false;
    }

    /**
     * Clean up references.
     */
    destroy() {
        this.scene = null;
    }
};
