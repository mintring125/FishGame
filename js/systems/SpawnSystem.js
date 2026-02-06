/**
 * SpawnSystem.js - Enemy Fish, Power-Up & Hazard Spawning
 * Feeding Frenzy - Fish Feeding Game
 *
 * Manages object pools and timed spawning of all non-player entities.
 * Difficulty scales with the current level via Constants.DIFFICULTY functions.
 */

window.SpawnSystem = class SpawnSystem {

    /**
     * @param {Phaser.Scene} scene - The game scene that owns this system.
     */
    constructor(scene) {
        var C = window.Constants;

        this.scene = scene;

        // ---- Object pools (Phaser groups with recycling) ----
        this.pools = {
            enemy:   scene.physics.add.group({ classType: Phaser.GameObjects.Sprite, maxSize: C.MAX_FISH_ON_SCREEN, runChildUpdate: false }),
            powerUp: scene.physics.add.group({ classType: Phaser.GameObjects.Sprite, maxSize: 10, runChildUpdate: false }),
            hazard:  scene.physics.add.group({ classType: Phaser.GameObjects.Sprite, maxSize: C.HAZARD_MAX_ON_SCREEN + 2, runChildUpdate: false })
        };

        // ---- Timing ----
        this.spawnTimer      = 0;
        this.powerUpTimer    = 0;
        this.hazardTimer     = 0;

        // ---- Level / difficulty cache ----
        this.currentLevel    = 1;
        this.speedScale      = 1;
        this.spawnRateScale  = 1;
        this.largeFishChance = 0.05;
        this.hazardChance    = C.HAZARD_SPAWN_CHANCE;

        // Pre-compute the spawn interval for level 1
        this._recalcSpawnInterval();
    }

    // ------------------------------------------------------------------
    // PUBLIC API
    // ------------------------------------------------------------------

    /**
     * Update difficulty parameters for the given level.
     * @param {number} level - 1-based level number.
     */
    setLevel(level) {
        var C  = window.Constants;
        var D  = C.DIFFICULTY;

        this.currentLevel    = level;
        this.speedScale      = D.speedScale(level);
        this.spawnRateScale  = D.spawnRateScale(level);
        this.largeFishChance = D.largeFishChance(level);
        this.hazardChance    = D.hazardChance(level);

        this._recalcSpawnInterval();
    }

    /**
     * Called every frame by the owning scene.
     * @param {number} time  - Current game time in ms.
     * @param {number} delta - ms elapsed since last frame.
     */
    update(time, delta) {
        // ---- Fish spawning ----
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer -= this.spawnInterval;
            this.spawnFish();
        }

        // ---- Power-up spawning (checked every ~1.5 s) ----
        this.powerUpTimer += delta;
        if (this.powerUpTimer >= 1500) {
            this.powerUpTimer -= 1500;
            this.spawnPowerUp();
        }

        // ---- Hazard spawning (checked every ~2 s) ----
        this.hazardTimer += delta;
        if (this.hazardTimer >= 2000) {
            this.hazardTimer -= 2000;
            this.spawnHazard();
        }

        // ---- Cull off-screen objects ----
        this.despawnOffscreen();
    }

    // ------------------------------------------------------------------
    // SPAWNING
    // ------------------------------------------------------------------

    /**
     * Spawn a single enemy fish from the left or right edge.
     */
    spawnFish() {
        var C = window.Constants;

        // Respect max-on-screen cap
        if (this.getActiveEnemies().length >= C.MAX_FISH_ON_SCREEN) {
            return null;
        }

        // ---- Determine fish size ----
        var sizeIndex = this._pickFishSize();

        // ---- Random colour ----
        var colorIndex = Phaser.Math.Between(0, C.FISH_COLORS.length - 1);

        // ---- Spawn side (0 = left, 1 = right) ----
        var fromLeft = Math.random() < 0.5;

        // Position
        var margin = C.SPAWN_MARGIN;
        var x = fromLeft ? -margin : C.GAME_WIDTH + margin;
        var yMin = Math.floor(C.GAME_HEIGHT * 0.10);
        var yMax = Math.floor(C.GAME_HEIGHT * 0.90);
        var y = Phaser.Math.Between(yMin, yMax);

        // ---- Speed based on size + difficulty ----
        // Smaller fish are faster, larger fish slower
        var baseSpeeds = [160, 130, 100, 75, 55];
        var speed = baseSpeeds[sizeIndex] * this.speedScale;
        // Add a little randomness (+-15%)
        speed *= Phaser.Math.FloatBetween(0.85, 1.15);

        var velocityX = fromLeft ? speed : -speed;

        // ---- Texture key ----
        var textureKey = 'fish_' + colorIndex + '_' + sizeIndex;

        // ---- Get or create sprite from pool ----
        var fish = this.pools.enemy.get(x, y, textureKey);
        if (!fish) {
            return null; // pool exhausted
        }

        fish.setActive(true).setVisible(true);
        fish.setPosition(x, y);
        fish.setTexture(textureKey);
        fish.setDepth(C.DEPTH.ENEMY_FISH);

        // Scale by size tier
        var scale = C.FISH_SIZE_SCALES[sizeIndex];
        fish.setScale(fromLeft ? scale : -scale, scale); // flip if going left

        // Physics body
        fish.body.enable = true;
        fish.body.setVelocityX(velocityX);
        fish.body.setVelocityY(Phaser.Math.FloatBetween(-15, 15)); // slight vertical drift

        // Custom data
        fish.setData('sizeIndex', sizeIndex);
        fish.setData('colorIndex', colorIndex);
        fish.setData('type', 'enemy');
        fish.setData('fromLeft', fromLeft);

        return fish;
    }

    /**
     * Possibly spawn a power-up.  Chance is Constants.POWER_UP_SPAWN_CHANCE
     * adjusted upward slightly at higher levels.
     */
    spawnPowerUp() {
        var C = window.Constants;

        var chance = C.POWER_UP_SPAWN_CHANCE * (1 + (this.currentLevel - 1) * 0.05);
        if (Math.random() > chance) {
            return null;
        }

        // Already enough on screen?
        if (this.getActivePowerUps().length >= 4) {
            return null;
        }

        // Random type
        var types = Object.values(C.POWER_UP_TYPES);
        var type  = Phaser.Utils.Array.GetRandom(types);

        // Spawn from edge
        var fromLeft = Math.random() < 0.5;
        var margin   = C.SPAWN_MARGIN;
        var x = fromLeft ? -margin : C.GAME_WIDTH + margin;
        var yMin = Math.floor(C.GAME_HEIGHT * 0.15);
        var yMax = Math.floor(C.GAME_HEIGHT * 0.85);
        var y = Phaser.Math.Between(yMin, yMax);

        var textureKey = 'powerup_' + type;
        var speed = 60 * this.speedScale;
        var velocityX = fromLeft ? speed : -speed;

        var pu = this.pools.powerUp.get(x, y, textureKey);
        if (!pu) {
            return null;
        }

        pu.setActive(true).setVisible(true);
        pu.setPosition(x, y);
        pu.setTexture(textureKey);
        pu.setDepth(C.DEPTH.POWER_UPS);
        pu.setScale(0.5);

        pu.body.enable = true;
        pu.body.setVelocityX(velocityX);
        pu.body.setVelocityY(0);

        pu.setData('type', 'powerUp');
        pu.setData('powerUpType', type);
        pu.setData('bobPhase', Math.random() * Math.PI * 2);

        // Gentle bob tween
        this.scene.tweens.add({
            targets: pu,
            y: y + C.POWER_UP_BOB_AMOUNT,
            duration: 600 / C.POWER_UP_BOB_SPEED,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return pu;
    }

    /**
     * Possibly spawn a hazard (jellyfish or pufferfish).
     */
    spawnHazard() {
        var C = window.Constants;

        if (Math.random() > this.hazardChance) {
            return null;
        }

        if (this.getActiveHazards().length >= C.HAZARD_MAX_ON_SCREEN) {
            return null;
        }

        // Random type
        var types = Object.values(C.HAZARD_TYPES);
        var type  = Phaser.Utils.Array.GetRandom(types);

        var fromLeft = Math.random() < 0.5;
        var margin   = C.SPAWN_MARGIN;
        var x = fromLeft ? -margin : C.GAME_WIDTH + margin;
        var yMin = Math.floor(C.GAME_HEIGHT * 0.10);
        var yMax = Math.floor(C.GAME_HEIGHT * 0.90);
        var y = Phaser.Math.Between(yMin, yMax);

        var speed;
        if (type === C.HAZARD_TYPES.JELLYFISH) {
            speed = C.HAZARD_JELLYFISH_SPEED * this.speedScale;
        } else {
            speed = C.HAZARD_PUFFERFISH_SPEED * this.speedScale;
        }

        var velocityX = fromLeft ? speed : -speed;
        var textureKey = 'hazard_' + type;

        var hz = this.pools.hazard.get(x, y, textureKey);
        if (!hz) {
            return null;
        }

        hz.setActive(true).setVisible(true);
        hz.setPosition(x, y);
        hz.setTexture(textureKey);
        hz.setDepth(C.DEPTH.HAZARDS);
        hz.setScale(fromLeft ? 0.6 : -0.6, 0.6);

        hz.body.enable = true;
        hz.body.setVelocityX(velocityX);
        // Jellyfish drift slightly vertically
        if (type === C.HAZARD_TYPES.JELLYFISH) {
            hz.body.setVelocityY(Phaser.Math.FloatBetween(-20, 20));
        } else {
            hz.body.setVelocityY(0);
        }

        hz.setData('type', 'hazard');
        hz.setData('hazardType', type);
        hz.setData('fromLeft', fromLeft);

        return hz;
    }

    // ------------------------------------------------------------------
    // CULLING
    // ------------------------------------------------------------------

    /**
     * Deactivate any active objects that have moved past the despawn margin.
     */
    despawnOffscreen() {
        var C = window.Constants;
        var margin = C.FISH_DESPAWN_MARGIN;
        var left   = -margin;
        var right  = C.GAME_WIDTH + margin;

        var deactivate = function (obj) {
            if (!obj.active) return;

            var x = obj.x;
            var goingRight = obj.body && obj.body.velocity.x > 0;
            var goingLeft  = obj.body && obj.body.velocity.x < 0;

            // Only despawn if it has fully crossed the opposite edge
            if (goingRight && x > right + 40) {
                obj.setActive(false).setVisible(false);
                if (obj.body) obj.body.enable = false;
            } else if (goingLeft && x < left - 40) {
                obj.setActive(false).setVisible(false);
                if (obj.body) obj.body.enable = false;
            }
        };

        this.pools.enemy.getChildren().forEach(deactivate);
        this.pools.powerUp.getChildren().forEach(deactivate);
        this.pools.hazard.getChildren().forEach(deactivate);
    }

    // ------------------------------------------------------------------
    // ACCESSORS
    // ------------------------------------------------------------------

    /**
     * @returns {Phaser.GameObjects.Sprite[]} All currently active enemy fish.
     */
    getActiveEnemies() {
        return this.pools.enemy.getChildren().filter(function (e) { return e.active; });
    }

    /**
     * @returns {Phaser.GameObjects.Sprite[]} All currently active power-ups.
     */
    getActivePowerUps() {
        return this.pools.powerUp.getChildren().filter(function (p) { return p.active; });
    }

    /**
     * @returns {Phaser.GameObjects.Sprite[]} All currently active hazards.
     */
    getActiveHazards() {
        return this.pools.hazard.getChildren().filter(function (h) { return h.active; });
    }

    // ------------------------------------------------------------------
    // RESET / DESTROY
    // ------------------------------------------------------------------

    /**
     * Deactivate every pooled object and reset timers.
     */
    reset() {
        var deactivateAll = function (group) {
            if (!group || !group.getChildren) return;
            var children;
            try {
                children = group.getChildren();
            } catch (e) {
                return;
            }
            if (!children) return;
            children.forEach(function (obj) {
                if (obj && obj.active !== undefined) {
                    obj.setActive(false).setVisible(false);
                    if (obj.body) obj.body.enable = false;
                }
            });
        };

        if (this.pools) {
            deactivateAll(this.pools.enemy);
            deactivateAll(this.pools.powerUp);
            deactivateAll(this.pools.hazard);
        }

        this.spawnTimer   = 0;
        this.powerUpTimer = 0;
        this.hazardTimer  = 0;
    }

    /**
     * Clean up all pools entirely.
     */
    destroy() {
        this.pools.enemy.destroy(true);
        this.pools.powerUp.destroy(true);
        this.pools.hazard.destroy(true);

        this.scene = null;
    }

    // ------------------------------------------------------------------
    // PRIVATE HELPERS
    // ------------------------------------------------------------------

    /**
     * Re-compute the current spawn interval from difficulty scaling.
     * @private
     */
    _recalcSpawnInterval() {
        var C = window.Constants;
        var interval = C.SPAWN_INTERVAL_BASE / this.spawnRateScale;
        this.spawnInterval = Math.max(interval, C.SPAWN_INTERVAL_MIN);
    }

    /**
     * Pick a fish size index weighted by the current level.
     * Early levels are mostly TINY/SMALL.  Later levels add more LARGE/MEGA.
     * @private
     * @returns {number} Size index (0-4).
     */
    _pickFishSize() {
        var C = window.Constants;
        var largeChance = this.largeFishChance; // 0.05 - 0.50

        // Build a weighted distribution
        // Base weights: TINY 35, SMALL 30, MEDIUM 20, LARGE 10, MEGA 5
        var weights = [35, 30, 20, 10, 5];

        // Shift weight toward larger fish as largeFishChance increases
        // largeFishChance goes from 0.05 (lvl1) to 0.50 (lvl ~12+)
        var shift = largeChance * 60; // 0 - 30
        weights[0] = Math.max(5, weights[0] - shift * 0.8);
        weights[1] = Math.max(5, weights[1] - shift * 0.5);
        weights[2] += shift * 0.3;
        weights[3] += shift * 0.6;
        weights[4] += shift * 0.4;

        // Normalise and pick
        var total = 0;
        var i;
        for (i = 0; i < weights.length; i++) {
            total += weights[i];
        }

        var roll = Math.random() * total;
        var cumulative = 0;
        for (i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (roll <= cumulative) {
                return i;
            }
        }

        return C.FISH_SIZE.TINY; // fallback
    }
};
