/**
 * ScoreSystem.js - Score Tracking, High Scores & Level Progression
 * Feeding Frenzy - Fish Feeding Game
 *
 * Manages current score, per-level score tracking, level-clear conditions,
 * high score persistence, and emits events for UI updates.
 */

window.ScoreSystem = class ScoreSystem {

    /**
     * @param {Phaser.Scene} scene - The game scene that owns this system.
     */
    constructor(scene) {
        var C = window.Constants;

        this.scene = scene;

        // ---- Persistent scores (loaded from localStorage) ----
        this.highScore    = this._loadNumber(C.STORAGE.HIGH_SCORE, 0);
        this.highestLevel = this._loadNumber(C.STORAGE.HIGHEST_LEVEL, 1);

        // ---- Session scores ----
        this.score        = 0;
        this.levelScore   = 0;   // Score accumulated in the current level
        this.currentLevel = 1;
    }

    // ------------------------------------------------------------------
    // PUBLIC API - SCORING
    // ------------------------------------------------------------------

    /**
     * Award points for eating a fish.
     *
     * @param {number} fishSize         - Size index of the eaten fish (0-4).
     * @param {number} frenzyMultiplier - Current frenzy multiplier (1-5).
     * @returns {number} The total points added (after multiplier).
     */
    addScore(fishSize, frenzyMultiplier) {
        var C = window.Constants;

        var base  = C.SCORE_PER_FISH[fishSize] || 10;
        var added = base * (frenzyMultiplier || 1);

        this.score      += added;
        this.levelScore += added;

        // High score check
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }

        // Emit for HUD
        this.scene.events.emit('scoreUpdate', {
            score:      this.score,
            levelScore: this.levelScore,
            added:      added,
            highScore:  this.highScore
        });

        return added;
    }

    /**
     * Award bonus points for collecting a power-up.
     */
    addPowerUpBonus() {
        var C = window.Constants;
        var added = C.SCORE_POWER_UP_BONUS;

        this.score      += added;
        this.levelScore += added;

        if (this.score > this.highScore) {
            this.highScore = this.score;
        }

        this.scene.events.emit('scoreUpdate', {
            score:      this.score,
            levelScore: this.levelScore,
            added:      added,
            highScore:  this.highScore
        });

        return added;
    }

    /**
     * Award bonus points for clearing a level.
     */
    addLevelClearBonus() {
        var C = window.Constants;
        var added = C.SCORE_LEVEL_CLEAR_BONUS;

        this.score += added;
        // Level clear bonus does NOT count toward the *next* level's levelScore

        if (this.score > this.highScore) {
            this.highScore = this.score;
        }

        this.scene.events.emit('scoreUpdate', {
            score:      this.score,
            levelScore: this.levelScore,
            added:      added,
            highScore:  this.highScore
        });

        return added;
    }

    // ------------------------------------------------------------------
    // PUBLIC API - LEVEL PROGRESSION
    // ------------------------------------------------------------------

    /**
     * @returns {boolean} True if the player has scored enough to clear the current level.
     */
    isLevelCleared() {
        var C = window.Constants;
        return this.levelScore >= C.DIFFICULTY.levelClearScore(this.currentLevel);
    }

    /**
     * Get the player's progress toward clearing the current level.
     * @returns {number} A value between 0.0 and 1.0 (clamped).
     */
    getLevelProgress() {
        var C = window.Constants;
        var target = C.DIFFICULTY.levelClearScore(this.currentLevel);
        if (target <= 0) return 1;
        return Math.min(this.levelScore / target, 1.0);
    }

    /**
     * Advance to the next level.  Resets levelScore and persists the highest level reached.
     */
    nextLevel() {
        this.currentLevel++;
        this.levelScore = 0;

        if (this.currentLevel > this.highestLevel) {
            this.highestLevel = this.currentLevel;
            this.saveHighestLevel();
        }

        this.scene.events.emit('levelUpdate', {
            level:         this.currentLevel,
            highestLevel:  this.highestLevel
        });
    }

    // ------------------------------------------------------------------
    // PUBLIC API - GETTERS
    // ------------------------------------------------------------------

    /** @returns {number} Current total score. */
    getScore() {
        return this.score;
    }

    /** @returns {number} All-time high score. */
    getHighScore() {
        return this.highScore;
    }

    /** @returns {number} Current level number (1-based). */
    getLevel() {
        return this.currentLevel;
    }

    /** @returns {number} Highest level ever reached. */
    getHighestLevel() {
        return this.highestLevel;
    }

    // ------------------------------------------------------------------
    // PUBLIC API - PERSISTENCE
    // ------------------------------------------------------------------

    /** Save the high score to localStorage. */
    saveHighScore() {
        var C = window.Constants;
        try {
            localStorage.setItem(C.STORAGE.HIGH_SCORE, String(this.highScore));
        } catch (e) {
            // localStorage may be unavailable (private browsing, quota)
        }
    }

    /** Save the highest level reached to localStorage. */
    saveHighestLevel() {
        var C = window.Constants;
        try {
            localStorage.setItem(C.STORAGE.HIGHEST_LEVEL, String(this.highestLevel));
        } catch (e) {
            // Silently ignore
        }
    }

    // ------------------------------------------------------------------
    // RESET / DESTROY
    // ------------------------------------------------------------------

    /**
     * Reset session scores for a new game.  High score is preserved.
     */
    reset() {
        this.score        = 0;
        this.levelScore   = 0;
        this.currentLevel = 1;
    }

    /**
     * Persist scores and clean up.
     */
    destroy() {
        this.saveHighScore();
        this.saveHighestLevel();
        this.scene = null;
    }

    // ------------------------------------------------------------------
    // PRIVATE HELPERS
    // ------------------------------------------------------------------

    /**
     * Load a numeric value from localStorage.
     * @private
     * @param {string} key      - Storage key.
     * @param {number} fallback - Default value if key is absent or invalid.
     * @returns {number}
     */
    _loadNumber(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (raw === null) return fallback;
            var num = parseInt(raw, 10);
            return isNaN(num) ? fallback : num;
        } catch (e) {
            return fallback;
        }
    }
};
