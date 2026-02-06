/**
 * GameScene.js - Core Gameplay Scene
 * Feeding Frenzy - Fish Feeding Game
 *
 * The heart of the game. Manages the underwater environment, player fish,
 * enemy spawning, collision handling, power-ups, hazards, scoring, frenzy
 * combos, level progression, and game-over logic. All gameplay happens here.
 *
 * Attached to window for Phaser scene registration via main.js getSceneClass().
 */

window.GameScene = class GameScene extends Phaser.Scene {

    constructor() {
        super({ key: 'GameScene' });
    }

    // ==================================================================
    // LIFECYCLE: INIT
    // Receives data from menu/level-clear scene for level continuity.
    // ==================================================================

    init(data) {
        data = data || {};

        this._initLevel = data.level || 1;
        this._initScore = data.score || 0;
        this._initLives = data.lives || window.Constants.MAX_LIVES;

        // Ensure physics system is running
        if (this.physics) {
            this.physics.resume();
        }
    }

    // ==================================================================
    // LIFECYCLE: CREATE
    // Build the entire gameplay scene from scratch.
    // ==================================================================

    create() {
        var C = window.Constants;
        this._cleanedUp = false;

        // ---- Safety: Ensure HUD is stopped from previous run ----
        if (this.scene.isActive(C.SCENES.HUD)) {
            this.scene.stop(C.SCENES.HUD);
        }

        // ---- Safety: Resume audio context if suspended ----
        if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume();
        }

        // ----------------------------------------------------------
        // 1. BACKGROUND: Ocean gradient
        // ----------------------------------------------------------
        this._createOceanBackground();

        // ----------------------------------------------------------
        // 2. PARALLAX LAYERS (tileSprites for continuous scrolling)
        // ----------------------------------------------------------
        this._createParallaxLayers();

        // ----------------------------------------------------------
        // 3. GOD RAYS (light shafts from the surface)
        // ----------------------------------------------------------
        this._createLightRays();

        // ----------------------------------------------------------
        // 4. AMBIENT BUBBLES
        // ----------------------------------------------------------
        this._createBubbles();

        // ----------------------------------------------------------
        // 5. SYSTEMS
        // ----------------------------------------------------------
        this.spawnSystem = new window.SpawnSystem(this);
        this.frenzySystem = new window.FrenzySystem(this);
        this.scoreSystem = this._createScoreSystem();
        this.particleSystem = this._createParticleSystem();
        this.soundSystem = this._getOrCreateSoundSystem();

        // Apply initial state from init data
        this.spawnSystem.setLevel(this._initLevel);

        if (this.scoreSystem.setScore) {
            this.scoreSystem.setScore(this._initScore);
        } else if (typeof this.scoreSystem.score !== 'undefined') {
            this.scoreSystem.score = this._initScore;
        }

        if (this.scoreSystem.setLevel) {
            this.scoreSystem.setLevel(this._initLevel);
        } else if (typeof this.scoreSystem.currentLevel !== 'undefined') {
            this.scoreSystem.currentLevel = this._initLevel;
        }

        // ----------------------------------------------------------
        // 6. PLAYER
        // ----------------------------------------------------------
        this.player = new window.PlayerFish(
            this,
            C.GAME_WIDTH * 0.25,
            C.GAME_HEIGHT * 0.5
        );
        this.player.setDepth(C.DEPTH.PLAYER);

        // ----------------------------------------------------------
        // 6.5 VIRTUAL JOYSTICK
        // ----------------------------------------------------------
        this.joystick = new window.VirtualJoystick(this, C.GAME_WIDTH - 120, C.GAME_HEIGHT - 120, {
            baseRadius: 50,
            thumbRadius: 25,
            baseAlpha: 0.3,
            thumbAlpha: 0.5
        });

        // ----------------------------------------------------------
        // 7. GAME STATE
        // ----------------------------------------------------------
        this.lives = this._initLives;
        this.currentLevel = this._initLevel;
        this.isGameOver = false;
        this.isLevelClearing = false;
        this.isStunned = false;
        this.stunTimer = 0;
        this._levelScoreAtStart = this._initScore;

        // ----------------------------------------------------------
        // 8. COLLISIONS (Arcade physics overlap checks)
        // ----------------------------------------------------------
        this._setupCollisions();

        // ----------------------------------------------------------
        // 9. LAUNCH HUD SCENE (runs in parallel as overlay)
        // ----------------------------------------------------------
        this.scene.launch(C.SCENES.HUD, {
            lives: this.lives,
            level: this.currentLevel,
            score: this._initScore
        });

        // ----------------------------------------------------------
        // 10. EVENT LISTENERS
        // ----------------------------------------------------------
        this._setupEventListeners();

        // ----------------------------------------------------------
        // 11. BACKGROUND MUSIC
        // ----------------------------------------------------------
        if (this.soundSystem && this.soundSystem.playBGM) {
            this.soundSystem.playBGM(C.AUDIO_KEYS.BGM_GAME);
        } else if (this.soundSystem && this.soundSystem.play) {
            this.soundSystem.play(C.AUDIO_KEYS.BGM_GAME);
        }

        // ----------------------------------------------------------
        // 12. CAMERA SETUP
        // ----------------------------------------------------------
        this.cameras.main.setBackgroundColor(C.OCEAN_COLORS.MID);
        // We will call camera shake on damage events (see handleFishCollision)
    }

    // ==================================================================
    // LIFECYCLE: UPDATE (called every frame)
    // ==================================================================

    update(time, delta) {
        if (this.isGameOver || this.isLevelClearing) {
            return;
        }

        var C = window.Constants;

        // ---- Stun check ----
        if (this.isStunned) {
            this.stunTimer -= delta;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
                this.stunTimer = 0;
                this.player.clearTint();
                this.player.setAlpha(1);
            }
            // While stunned: still update environment but player cannot move
            this._updateEnvironment(time, delta);
            return;
        }

        // ---- Player ----
        this.player.update(time, delta);

        // ---- Systems ----
        this.spawnSystem.update(time, delta);
        this.frenzySystem.update(time, delta);

        // ---- Update active enemies ----
        var playerSize = this.player.currentSize;
        var activeEnemies = this.spawnSystem.getActiveEnemies();
        for (var i = 0; i < activeEnemies.length; i++) {
            var enemy = activeEnemies[i];
            if (enemy.update && typeof enemy.update === 'function') {
                enemy.update(time, delta);
            }
            // setEdibleIndicator may not exist on pool sprites - use tint directly
            if (enemy.setEdibleIndicator) {
                enemy.setEdibleIndicator(playerSize);
            } else if (enemy.active) {
                var eSize = enemy.getData('sizeIndex');
                if (typeof eSize === 'number') {
                    if (eSize < playerSize) {
                        enemy.setTint(0x88FF88);
                    } else if (eSize > playerSize) {
                        enemy.setTint(0xFF8888);
                    } else {
                        enemy.clearTint();
                    }
                }
            }
        }

        // ---- Update active power-ups ----
        var activePowerUps = this.spawnSystem.getActivePowerUps();
        for (var p = 0; p < activePowerUps.length; p++) {
            if (activePowerUps[p].update) {
                activePowerUps[p].update(time, delta);
            }
        }

        // ---- Update active hazards ----
        var activeHazards = this.spawnSystem.getActiveHazards();
        for (var h = 0; h < activeHazards.length; h++) {
            if (activeHazards[h].update) {
                activeHazards[h].update(time, delta);
            }
        }

        // ---- Environment updates ----
        this._updateEnvironment(time, delta);

        // ---- Magnet power-up: attract edible fish ----
        this._updateMagnetAttraction(delta);

        // ---- Level clear check ----
        this._checkLevelClear();
    }

    // ==================================================================
    // COLLISION HANDLERS
    // ==================================================================

    /**
     * Player overlaps an enemy fish.
     * Eat it if small enough, take damage if too big.
     */
    handleFishCollision(playerSprite, enemySprite) {
        if (!playerSprite.active || !enemySprite.active) return;
        if (!enemySprite.body || !enemySprite.body.enable) return;

        var C = window.Constants;
        var scene = playerSprite.scene;
        var player = scene.player;

        // Retrieve size from the enemy object or its data store
        var enemySize = (typeof enemySprite.sizeIndex !== 'undefined')
            ? enemySprite.sizeIndex
            : enemySprite.getData('sizeIndex');

        if (typeof enemySize === 'undefined' || enemySize === null) {
            return; // Safety: no size info
        }

        var playerMaxEat = player.getEatableMaxSize();

        // ---- CAN EAT: enemy is same size or smaller ----
        if (enemySize <= playerMaxEat) {
            // Determine sound
            var eatSound = (enemySize === player.currentSize)
                ? C.AUDIO_KEYS.SFX_EAT_BIG
                : C.AUDIO_KEYS.SFX_EAT;
            scene._playSound(eatSound);

            // Eat particles
            var enemyColor = enemySprite.getData('colorIndex');
            var colorData = (typeof enemyColor === 'number' && C.FISH_COLORS[enemyColor])
                ? C.FISH_COLORS[enemyColor].body
                : 0xFFFFFF;
            if (scene.particleSystem && scene.particleSystem.emitEatParticles) {
                scene.particleSystem.emitEatParticles(enemySprite.x, enemySprite.y, colorData);
            }

            // Player eats (may trigger growth)
            var didGrow = player.eat();

            // Frenzy combo
            scene.frenzySystem.onFishEaten();

            // Score
            var multiplier = scene.frenzySystem.getMultiplier();
            if (scene.scoreSystem && scene.scoreSystem.addScore) {
                scene.scoreSystem.addScore(enemySize, multiplier);
            } else if (scene.scoreSystem) {
                var baseScore = C.SCORE_PER_FISH[enemySize] || 10;
                scene.scoreSystem.score = (scene.scoreSystem.score || 0) + (baseScore * multiplier);
            }

            // Kill the enemy
            if (enemySprite.onEaten) {
                enemySprite.onEaten();
            } else {
                enemySprite.setActive(false).setVisible(false);
                if (enemySprite.body) enemySprite.body.enable = false;
            }

            // Emit event for HUD
            scene.events.emit('fishEaten', {
                score: scene.scoreSystem.score || scene.scoreSystem.getScore(),
                combo: scene.frenzySystem.combo,
                multiplier: multiplier,
                enemySize: enemySize
            });

            // Growth effects
            if (didGrow) {
                if (scene.particleSystem && scene.particleSystem.emitGrowParticles) {
                    scene.particleSystem.emitGrowParticles(player.x, player.y);
                }
                scene._playSound(C.AUDIO_KEYS.SFX_GROW);
            }

            return;
        }

        // ---- CANNOT EAT: enemy is bigger -> take damage ----
        // Respect invincibility
        if (player.isInvincible) {
            return;
        }

        // Shield absorbs the hit
        if (player.activePowerUps.has(C.POWER_UP_TYPES.SHIELD)) {
            player.removePowerUp(C.POWER_UP_TYPES.SHIELD);
            player.setInvincible(C.INVINCIBILITY_TIME / 2);
            // Visual feedback
            scene.cameras.main.flash(100, 118, 255, 3); // green flash
            return;
        }

        // Take real damage
        scene.lives--;
        scene._playSound(C.AUDIO_KEYS.SFX_HIT);

        // Player invincibility + blink
        player.takeDamage();

        // Death particles at player position
        if (scene.particleSystem && scene.particleSystem.emitDeathParticles) {
            scene.particleSystem.emitDeathParticles(player.x, player.y);
        }

        // Camera shake
        scene.cameras.main.shake(200, 0.01);

        // Emit for HUD
        scene.events.emit('playerHit', { lives: scene.lives });

        // Frenzy resets on hit
        scene.frenzySystem.reset();
        scene.events.emit('frenzyReset', { wasFrenzy: false });

        // Check game over
        if (scene.lives <= 0) {
            scene.triggerGameOver();
        }
    }

    /**
     * Player overlaps a power-up item.
     */
    handlePowerUpCollision(playerSprite, powerUpSprite) {
        if (!playerSprite.active || !powerUpSprite.active) return;
        if (!powerUpSprite.body || !powerUpSprite.body.enable) return;

        var C = window.Constants;
        var scene = playerSprite.scene;

        // Determine the power-up type
        var puType = powerUpSprite.powerUpType || powerUpSprite.getData('powerUpType');
        if (!puType) return;

        // Apply to player
        scene.player.applyPowerUp(puType);

        // Sound
        scene._playSound(C.AUDIO_KEYS.SFX_POWER_UP);

        // Score bonus
        if (scene.scoreSystem && scene.scoreSystem.addPowerUpBonus) {
            scene.scoreSystem.addPowerUpBonus();
        } else if (scene.scoreSystem) {
            scene.scoreSystem.score = (scene.scoreSystem.score || 0) + C.SCORE_POWER_UP_BONUS;
        }

        // Particles
        var puColor = C.POWER_UP_COLORS[puType] || 0xFFFFFF;
        if (scene.particleSystem && scene.particleSystem.emitPowerUpParticles) {
            scene.particleSystem.emitPowerUpParticles(powerUpSprite.x, powerUpSprite.y, puColor);
        }

        // Collect animation + deactivate
        if (powerUpSprite.collect) {
            powerUpSprite.collect();
        } else {
            powerUpSprite.setActive(false).setVisible(false);
            if (powerUpSprite.body) powerUpSprite.body.enable = false;
        }

        // Emit for HUD
        scene.events.emit('powerUpCollected', {
            type: puType,
            score: scene.scoreSystem.score || (scene.scoreSystem.getScore ? scene.scoreSystem.getScore() : 0)
        });
    }

    /**
     * Player overlaps a hazard (jellyfish or pufferfish).
     */
    handleHazardCollision(playerSprite, hazardSprite) {
        if (!playerSprite.active || !hazardSprite.active) return;
        if (!hazardSprite.body || !hazardSprite.body.enable) return;

        var C = window.Constants;
        var scene = playerSprite.scene;

        // Respect invincibility
        if (scene.player.isInvincible) {
            return;
        }

        // Shield absorbs
        if (scene.player.activePowerUps.has(C.POWER_UP_TYPES.SHIELD)) {
            scene.player.removePowerUp(C.POWER_UP_TYPES.SHIELD);
            scene.player.setInvincible(C.INVINCIBILITY_TIME / 2);
            // Disable hazard temporarily so it doesn't re-trigger
            hazardSprite.body.enable = false;
            scene.time.delayedCall(500, function () {
                if (hazardSprite.active && hazardSprite.body) {
                    hazardSprite.body.enable = true;
                }
            });
            return;
        }

        var hazardType = hazardSprite.hazardType || hazardSprite.getData('hazardType');

        if (hazardType === C.HAZARD_TYPES.JELLYFISH) {
            // ---- JELLYFISH: Stun the player ----
            scene.isStunned = true;
            scene.stunTimer = C.HAZARD_JELLYFISH_STUN_TIME;
            scene._playSound(C.AUDIO_KEYS.SFX_HIT);

            // Visual: tint player electric blue and shake
            scene.player.setTint(0x00FFFF);
            scene.cameras.main.shake(150, 0.008);

            // Frenzy breaks on stun
            scene.frenzySystem.reset();
            scene.events.emit('frenzyReset', { wasFrenzy: false });

            // Disable hazard body briefly to prevent re-triggering
            hazardSprite.body.enable = false;
            scene.time.delayedCall(800, function () {
                if (hazardSprite.active && hazardSprite.body) {
                    hazardSprite.body.enable = true;
                }
            });

            // Emit for HUD
            scene.events.emit('playerStunned', { duration: C.HAZARD_JELLYFISH_STUN_TIME });

        } else if (hazardType === C.HAZARD_TYPES.PUFFERFISH) {
            // ---- PUFFERFISH: Direct damage like a big fish ----
            scene.lives--;
            scene._playSound(C.AUDIO_KEYS.SFX_HIT);

            scene.player.takeDamage();

            if (scene.particleSystem && scene.particleSystem.emitDeathParticles) {
                scene.particleSystem.emitDeathParticles(scene.player.x, scene.player.y);
            }

            scene.cameras.main.shake(250, 0.012);

            scene.frenzySystem.reset();
            scene.events.emit('playerHit', { lives: scene.lives });

            // Disable hazard after hit
            hazardSprite.body.enable = false;
            scene.time.delayedCall(1000, function () {
                if (hazardSprite.active && hazardSprite.body) {
                    hazardSprite.body.enable = true;
                }
            });

            if (scene.lives <= 0) {
                scene.triggerGameOver();
            }
        }
    }

    // ==================================================================
    // LEVEL PROGRESSION
    // ==================================================================

    /**
     * Called when the score threshold for the current level is met.
     */
    triggerLevelClear() {
        if (this.isLevelClearing || this.isGameOver) return;

        var C = window.Constants;
        this.isLevelClearing = true;

        this._playSound(C.AUDIO_KEYS.SFX_LEVEL_UP);

        // Level clear particle burst
        if (this.particleSystem && this.particleSystem.emitLevelClearParticles) {
            this.particleSystem.emitLevelClearParticles();
        }

        // Bonus score for clearing the level
        if (this.scoreSystem && this.scoreSystem.addLevelClearBonus) {
            this.scoreSystem.addLevelClearBonus();
        } else if (this.scoreSystem) {
            this.scoreSystem.score = (this.scoreSystem.score || 0) + C.SCORE_LEVEL_CLEAR_BONUS;
        }

        // Emit for HUD
        var currentScore = (this.scoreSystem && this.scoreSystem.getScore)
            ? this.scoreSystem.getScore()
            : (this.scoreSystem ? this.scoreSystem.score : 0);

        this.events.emit('levelCleared', {
            level: this.currentLevel,
            score: currentScore
        });

        // Flash the screen gold
        this.cameras.main.flash(400, 255, 215, 0);

        // Delay before transitioning
        var self = this;
        this.time.delayedCall(C.LEVEL_TRANSITION_DELAY, function () {
            if (self.currentLevel >= C.LEVEL_COUNT) {
                // ---- GAME COMPLETE! ----
                self._triggerGameComplete();
            } else {
                // ---- Next level ----
                var nextLevel = self.currentLevel + 1;
                var score = (self.scoreSystem && self.scoreSystem.getScore)
                    ? self.scoreSystem.getScore()
                    : (self.scoreSystem ? self.scoreSystem.score : 0);

                self._cleanupScene();

                self.scene.start(C.SCENES.LEVEL_CLEAR, {
                    level: self.currentLevel,
                    score: score,
                    nextLevel: nextLevel,
                    lives: self.lives
                });
            }
        });
    }

    // ==================================================================
    // GAME OVER
    // ==================================================================

    /**
     * Triggered when player loses all lives.
     */
    triggerGameOver() {
        if (this.isGameOver) return;

        var C = window.Constants;
        this.isGameOver = true;

        // Stop music
        if (this.soundSystem) {
            if (this.soundSystem.stopBGM) {
                this.soundSystem.stopBGM();
            } else if (this.soundSystem.stopAll) {
                this.soundSystem.stopAll();
            }
        }

        this._playSound(C.AUDIO_KEYS.SFX_DEATH);

        // Player death animation: spin, shrink, fade
        var self = this;
        this.tweens.add({
            targets: this.player,
            scaleX: 0,
            scaleY: 0,
            angle: 720,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: function () {
                // Slight delay before game over screen
                self.time.delayedCall(500, function () {
                    var finalScore = (self.scoreSystem && self.scoreSystem.getScore)
                        ? self.scoreSystem.getScore()
                        : (self.scoreSystem ? self.scoreSystem.score : 0);

                    // Retrieve or compute high score
                    var savedHigh = 0;
                    try {
                        savedHigh = parseInt(localStorage.getItem(C.STORAGE.HIGH_SCORE), 10) || 0;
                    } catch (e) {
                        savedHigh = 0;
                    }
                    var highScore = Math.max(finalScore, savedHigh);

                    // Save new high score
                    try {
                        localStorage.setItem(C.STORAGE.HIGH_SCORE, String(highScore));
                        var savedLevel = parseInt(localStorage.getItem(C.STORAGE.HIGHEST_LEVEL), 10) || 0;
                        if (self.currentLevel > savedLevel) {
                            localStorage.setItem(C.STORAGE.HIGHEST_LEVEL, String(self.currentLevel));
                        }
                    } catch (e) {
                        // localStorage unavailable
                    }

                    self._cleanupScene();

                    self.scene.start(C.SCENES.GAME_OVER, {
                        score: finalScore,
                        level: self.currentLevel,
                        highScore: highScore
                    });
                });
            }
        });

        // Camera effects
        this.cameras.main.shake(300, 0.015);
        this.cameras.main.fade(1200, 0, 0, 0);

        // Death particles
        if (this.particleSystem && this.particleSystem.emitDeathParticles) {
            this.particleSystem.emitDeathParticles(this.player.x, this.player.y);
        }
    }

    // ==================================================================
    // GAME COMPLETE (all levels cleared)
    // ==================================================================

    /**
     * Player cleared all levels - special victory ending.
     */
    _triggerGameComplete() {
        var C = window.Constants;

        var finalScore = (this.scoreSystem && this.scoreSystem.getScore)
            ? this.scoreSystem.getScore()
            : (this.scoreSystem ? this.scoreSystem.score : 0);

        // Save high score
        var savedHigh = 0;
        try {
            savedHigh = parseInt(localStorage.getItem(C.STORAGE.HIGH_SCORE), 10) || 0;
        } catch (e) {
            savedHigh = 0;
        }
        var highScore = Math.max(finalScore, savedHigh);
        try {
            localStorage.setItem(C.STORAGE.HIGH_SCORE, String(highScore));
            localStorage.setItem(C.STORAGE.HIGHEST_LEVEL, String(C.LEVEL_COUNT));
        } catch (e) {
            // localStorage unavailable
        }

        this._cleanupScene();

        this.scene.start(C.SCENES.GAME_OVER, {
            score: finalScore,
            level: C.LEVEL_COUNT,
            highScore: highScore,
            gameComplete: true
        });
    }

    // ==================================================================
    // PRIVATE: SCENE CREATION HELPERS
    // ==================================================================

    /**
     * Create the ocean gradient background using a Graphics object.
     */
    _createOceanBackground() {
        var C = window.Constants;
        var gfx = this.add.graphics();
        gfx.setDepth(C.DEPTH.BACKGROUND);

        // Draw vertical gradient from SURFACE (top) to DEEP (bottom)
        var steps = 32;
        var stepHeight = Math.ceil(C.GAME_HEIGHT / steps);
        var topColor = Phaser.Display.Color.IntegerToColor(C.OCEAN_COLORS.SURFACE);
        var botColor = Phaser.Display.Color.IntegerToColor(C.OCEAN_COLORS.DEEP);

        for (var i = 0; i < steps; i++) {
            var t = i / (steps - 1);
            var r = Math.round(Phaser.Math.Linear(topColor.red, botColor.red, t));
            var g = Math.round(Phaser.Math.Linear(topColor.green, botColor.green, t));
            var b = Math.round(Phaser.Math.Linear(topColor.blue, botColor.blue, t));
            var color = Phaser.Display.Color.GetColor(r, g, b);

            gfx.fillStyle(color, 1);
            gfx.fillRect(0, i * stepHeight, C.GAME_WIDTH, stepHeight + 1);
        }

        this._bgGradient = gfx;
    }

    /**
     * Create parallax background tile sprites for depth effect.
     */
    _createParallaxLayers() {
        var C = window.Constants;

        this._parallaxLayers = [];

        // Three layers with increasing scroll speed (back to front)
        var layerConfigs = [
            { key: 'bg_layer_0', speed: 0.1, alpha: 0.3, depth: C.DEPTH.BACKGROUND + 0.1 },
            { key: 'bg_layer_1', speed: 0.2, alpha: 0.2, depth: C.DEPTH.BACKGROUND + 0.2 },
            { key: 'bg_layer_2', speed: 0.4, alpha: 0.15, depth: C.DEPTH.BACKGROUND + 0.3 }
        ];

        for (var i = 0; i < layerConfigs.length; i++) {
            var cfg = layerConfigs[i];

            // Only create if texture exists
            if (this.textures.exists(cfg.key)) {
                var layer = this.add.tileSprite(0, 0, C.GAME_WIDTH, C.GAME_HEIGHT, cfg.key);
                layer.setOrigin(0, 0);
                layer.setAlpha(cfg.alpha);
                layer.setDepth(cfg.depth);
                layer.scrollSpeed = cfg.speed;
                this._parallaxLayers.push(layer);
            }
        }
    }

    /**
     * Create light ray sprites at the top of the screen pointing downward.
     */
    _createLightRays() {
        var C = window.Constants;
        this._lightRays = [];

        for (var i = 0; i < C.LIGHT_RAY_COUNT; i++) {
            var x = (C.GAME_WIDTH / (C.LIGHT_RAY_COUNT + 1)) * (i + 1);
            x += Phaser.Math.FloatBetween(-80, 80); // spread variance

            var ray;

            if (this.textures.exists('light_ray')) {
                ray = this.add.image(x, 0, 'light_ray');
                ray.setOrigin(0.5, 0);
            } else {
                // Fallback: procedural light ray using graphics
                ray = this.add.graphics();
                ray.fillStyle(0xFFFFFF, 1);
                ray.beginPath();
                ray.moveTo(-20, 0);
                ray.lineTo(20, 0);
                ray.lineTo(40, C.GAME_HEIGHT * 0.7);
                ray.lineTo(-40, C.GAME_HEIGHT * 0.7);
                ray.closePath();
                ray.fill();
                ray.setPosition(x, 0);
            }

            ray.setAlpha(C.LIGHT_RAY_ALPHA);
            ray.setDepth(C.DEPTH.LIGHT_RAYS);

            // Slight rotation variance
            var baseAngle = Phaser.Math.FloatBetween(-8, 8);
            ray.setAngle(baseAngle);

            // Store animation data
            ray._baseX = x;
            ray._baseAngle = baseAngle;
            ray._driftPhase = Math.random() * Math.PI * 2;
            ray._driftSpeed = 0.3 + Math.random() * 0.3;
            ray._driftAmplitudeX = 30 + Math.random() * 40;
            ray._driftAmplitudeAngle = 3 + Math.random() * 4;

            this._lightRays.push(ray);
        }
    }

    /**
     * Create ambient bubble objects scattered across the screen.
     */
    _createBubbles() {
        var C = window.Constants;
        this._bubbles = [];

        for (var i = 0; i < C.BUBBLE_COUNT; i++) {
            var bx = Phaser.Math.Between(0, C.GAME_WIDTH);
            var by = Phaser.Math.Between(0, C.GAME_HEIGHT);

            if (window.Bubble) {
                var bubble = new window.Bubble(this, bx, by);
                bubble.setDepth(C.DEPTH.BUBBLES);
                this._bubbles.push(bubble);
            } else {
                // Fallback: simple circle graphics bubble
                var size = Phaser.Math.Between(C.BUBBLE_MIN_SIZE, C.BUBBLE_MAX_SIZE);
                var speed = Phaser.Math.FloatBetween(C.BUBBLE_MIN_SPEED, C.BUBBLE_MAX_SPEED);

                var gfx = this.add.graphics();
                gfx.fillStyle(0xFFFFFF, C.BUBBLE_ALPHA);
                gfx.fillCircle(0, 0, size);
                gfx.lineStyle(1, 0xFFFFFF, C.BUBBLE_ALPHA * 0.7);
                gfx.strokeCircle(0, 0, size);
                gfx.setPosition(bx, by);
                gfx.setDepth(C.DEPTH.BUBBLES);

                gfx._speed = speed;
                gfx._wobbleTime = Math.random() * Math.PI * 2;
                gfx._size = size;

                this._bubbles.push(gfx);
            }
        }
    }

    /**
     * Create or retrieve the ScoreSystem.
     */
    _createScoreSystem() {
        if (window.ScoreSystem) {
            return new window.ScoreSystem(this);
        }
        // Minimal fallback if ScoreSystem not loaded yet
        return {
            score: 0,
            currentLevel: 1,
            setScore: function (s) { this.score = s; },
            setLevel: function (l) { this.currentLevel = l; },
            getScore: function () { return this.score; },
            addScore: function (sizeIndex, multiplier) {
                var C = window.Constants;
                var base = C.SCORE_PER_FISH[sizeIndex] || 10;
                this.score += base * (multiplier || 1);
            },
            addPowerUpBonus: function () {
                this.score += window.Constants.SCORE_POWER_UP_BONUS;
            },
            addLevelClearBonus: function () {
                this.score += window.Constants.SCORE_LEVEL_CLEAR_BONUS;
            },
            isLevelCleared: function () {
                var C = window.Constants;
                var target = C.DIFFICULTY.levelClearScore(this.currentLevel);
                return this.score >= target;
            },
            reset: function () { this.score = 0; this.currentLevel = 1; },
            destroy: function () { }
        };
    }

    /**
     * Create or retrieve the ParticleSystem.
     */
    _createParticleSystem() {
        if (window.ParticleSystem) {
            return new window.ParticleSystem(this);
        }
        // Minimal fallback - no-op particle system
        return {
            emitEatParticles: function () { },
            emitGrowParticles: function () { },
            emitDeathParticles: function () { },
            emitPowerUpParticles: function () { },
            emitLevelClearParticles: function () { },
            destroy: function () { }
        };
    }

    /**
     * Get the shared SoundSystem from registry or create a new one.
     */
    _getOrCreateSoundSystem() {
        var existing = this.game.registry.get('soundSystem');
        if (existing) {
            return existing;
        }
        if (window.SoundSystem) {
            var ss = new window.SoundSystem(this);
            this.game.registry.set('soundSystem', ss);
            return ss;
        }
        // Minimal fallback - no-op sound system
        return {
            play: function () { },
            playBGM: function () { },
            stopBGM: function () { },
            stopAll: function () { },
            destroy: function () { }
        };
    }

    // ==================================================================
    // PRIVATE: COLLISION SETUP
    // ==================================================================

    _setupCollisions() {
        var C = window.Constants;
        var pools = this.spawnSystem.pools;

        // Player vs Enemy fish
        this.physics.add.overlap(
            this.player,
            pools.enemy,
            this.handleFishCollision,
            this._collisionProcessCallback,
            this
        );

        // Player vs Power-ups
        this.physics.add.overlap(
            this.player,
            pools.powerUp,
            this.handlePowerUpCollision,
            this._collisionProcessCallback,
            this
        );

        // Player vs Hazards
        this.physics.add.overlap(
            this.player,
            pools.hazard,
            this.handleHazardCollision,
            this._collisionProcessCallback,
            this
        );
    }

    /**
     * Process callback for overlap checks.
     * Only process if both objects are active with enabled bodies.
     */
    _collisionProcessCallback(playerSprite, otherSprite) {
        return playerSprite.active && otherSprite.active &&
            playerSprite.body && playerSprite.body.enable &&
            otherSprite.body && otherSprite.body.enable;
    }

    // ==================================================================
    // PRIVATE: EVENT LISTENERS
    // ==================================================================

    _setupEventListeners() {
        var C = window.Constants;
        var self = this;

        // ---- Pause request from HUD ----
        this.events.on('requestPause', function () {
            self.scene.pause();
            self.scene.launch(C.SCENES.PAUSE, {
                level: self.currentLevel,
                score: (self.scoreSystem && self.scoreSystem.getScore)
                    ? self.scoreSystem.getScore()
                    : (self.scoreSystem ? self.scoreSystem.score : 0)
            });
        });

        // ---- Resume from PauseScene ----
        this.events.on('resume', function () {
            // Scene has been resumed - nothing extra needed
        });

        // ---- Keyboard pause (ESC key) ----
        if (this.input.keyboard) {
            this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
            this._escKey.on('down', function () {
                if (!self.isGameOver && !self.isLevelClearing) {
                    self.events.emit('requestPause');
                }
            });
        }

        // ---- Player growth event (from PlayerFish) ----
        this.events.on('playerGrew', function (newSize) {
            self.events.emit('playerSizeChanged', {
                size: newSize,
                score: (self.scoreSystem && self.scoreSystem.getScore)
                    ? self.scoreSystem.getScore()
                    : (self.scoreSystem ? self.scoreSystem.score : 0)
            });
        });

        // ---- Frenzy tier up sound ----
        this.events.on('frenzyTierUp', function (data) {
            self._playSound(C.AUDIO_KEYS.SFX_FRENZY);
        });

        // ---- Scene shutdown cleanup ----
        this.events.on('shutdown', function () {
            self._cleanupScene();
        });

        this.events.on('sleep', function () {
            self._cleanupScene();
        });
    }

    // ==================================================================
    // PRIVATE: PER-FRAME ENVIRONMENT UPDATES
    // ==================================================================

    /**
     * Update non-gameplay visual elements (bubbles, rays, parallax).
     */
    _updateEnvironment(time, delta) {
        var C = window.Constants;
        var deltaSeconds = delta / 1000;
        var timeSeconds = time / 1000;

        // ---- Parallax scrolling ----
        for (var i = 0; i < this._parallaxLayers.length; i++) {
            var layer = this._parallaxLayers[i];
            layer.tilePositionX += layer.scrollSpeed * deltaSeconds * 30;
        }

        // ---- Light ray drift animation ----
        for (var r = 0; r < this._lightRays.length; r++) {
            var ray = this._lightRays[r];
            var phase = timeSeconds * ray._driftSpeed + ray._driftPhase;
            ray.x = ray._baseX + Math.sin(phase) * ray._driftAmplitudeX;
            ray.setAngle(ray._baseAngle + Math.sin(phase * 0.7) * ray._driftAmplitudeAngle);
        }

        // ---- Bubbles ----
        for (var b = 0; b < this._bubbles.length; b++) {
            var bubble = this._bubbles[b];

            if (bubble.update && typeof bubble.update === 'function' && window.Bubble) {
                // Bubble class has its own update
                bubble.update(time, delta);
            } else {
                // Fallback manual bubble update
                bubble.y -= (bubble._speed || 30) * deltaSeconds;
                bubble._wobbleTime = (bubble._wobbleTime || 0) + deltaSeconds * 2;
                bubble.x += Math.sin(bubble._wobbleTime) * 0.5;

                // Reset when off top
                if (bubble.y < -(bubble._size || 10)) {
                    bubble.y = C.GAME_HEIGHT + (bubble._size || 10);
                    bubble.x = Phaser.Math.Between(0, C.GAME_WIDTH);
                }
            }
        }
    }

    /**
     * If the magnet power-up is active, attract nearby edible fish toward the player.
     */
    _updateMagnetAttraction(delta) {
        var magnetRange = this.player.getMagnetRange();
        if (magnetRange <= 0) return;

        var deltaSeconds = delta / 1000;
        var playerX = this.player.x;
        var playerY = this.player.y;
        var playerSize = this.player.currentSize;
        var attractForce = 300; // px/sec pull strength

        var activeEnemies = this.spawnSystem.getActiveEnemies();
        for (var i = 0; i < activeEnemies.length; i++) {
            var enemy = activeEnemies[i];
            if (!enemy.active) continue;

            // Only attract edible fish
            var enemySize = (typeof enemy.sizeIndex !== 'undefined')
                ? enemy.sizeIndex
                : enemy.getData('sizeIndex');
            if (typeof enemySize === 'undefined' || enemySize > playerSize) continue;

            // Distance check
            var dx = playerX - enemy.x;
            var dy = playerY - enemy.y;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < magnetRange && dist > 5) {
                // Pull strength increases as fish gets closer
                var strength = (1 - dist / magnetRange) * attractForce * deltaSeconds;
                var nx = dx / dist;
                var ny = dy / dist;
                enemy.x += nx * strength;
                enemy.y += ny * strength;
            }
        }
    }

    /**
     * Check if the score threshold for the current level has been reached.
     */
    _checkLevelClear() {
        if (this.isLevelClearing || this.isGameOver) return;

        var cleared = false;
        if (this.scoreSystem && this.scoreSystem.isLevelCleared) {
            cleared = this.scoreSystem.isLevelCleared();
        } else if (this.scoreSystem) {
            var C = window.Constants;
            var target = C.DIFFICULTY.levelClearScore(this.currentLevel);
            var currentScore = (this.scoreSystem.getScore)
                ? this.scoreSystem.getScore()
                : this.scoreSystem.score;
            cleared = currentScore >= target;
        }

        if (cleared) {
            this.triggerLevelClear();
        }
    }

    // ==================================================================
    // PRIVATE: UTILITY
    // ==================================================================

    /**
     * Safe sound playback helper.
     */
    _playSound(key) {
        if (!this.soundSystem) return;
        if (this.soundSystem.play) {
            this.soundSystem.play(key);
        }
    }

    /**
     * Clean up all systems, event listeners, and scene references
     * before transitioning to another scene.
     */
    _cleanupScene() {
        // Prevent double cleanup
        if (this._cleanedUp) return;
        this._cleanedUp = true;

        // Remove event listeners first to prevent re-entry
        this.events.off('requestPause');
        this.events.off('resume');
        this.events.off('playerGrew');
        this.events.off('frenzyTierUp');
        this.events.off('shutdown');
        this.events.off('sleep');

        // Stop HUD scene
        var C = window.Constants;
        try {
            if (this.scene.isActive(C.SCENES.HUD)) {
                this.scene.stop(C.SCENES.HUD);
            }
        } catch (e) {
            // Scene may already be stopped
        }

        // Remove keyboard listeners
        if (this._escKey) {
            this._escKey.removeAllListeners();
            this._escKey = null;
        }

        // Clean up joystick
        if (this.joystick) {
            this.joystick.destroy();
            this.joystick = null;
        }

        // Clean up systems
        if (this.spawnSystem) {
            this.spawnSystem.reset();
        }
        if (this.frenzySystem) {
            this.frenzySystem.reset();
        }
    }

    /**
     * Full teardown when the scene is destroyed entirely.
     */
    shutdown() {
        this._cleanupScene();

        if (this.spawnSystem && this.spawnSystem.destroy) {
            this.spawnSystem.destroy();
            this.spawnSystem = null;
        }
        if (this.frenzySystem && this.frenzySystem.destroy) {
            this.frenzySystem.destroy();
            this.frenzySystem = null;
        }
        if (this.scoreSystem && this.scoreSystem.destroy) {
            this.scoreSystem.destroy();
            this.scoreSystem = null;
        }
        if (this.particleSystem && this.particleSystem.destroy) {
            this.particleSystem.destroy();
            this.particleSystem = null;
        }

        // Light rays, bubbles, parallax layers are scene children and will be
        // destroyed automatically by Phaser's scene lifecycle.
        this._lightRays = [];
        this._bubbles = [];
        this._parallaxLayers = [];
    }
};
