/**
 * Constants.js - Game Configuration & Constants
 * Feeding Frenzy - Fish Feeding Game
 * All game-wide constants, enums, and configuration values.
 */

window.Constants = {

    // ========================================
    // GAME DIMENSIONS (Logical Resolution)
    // Scaled by Phaser to fit device screen
    // ========================================
    GAME_WIDTH: 1400,
    GAME_HEIGHT: 876,

    // ========================================
    // FISH SIZE SYSTEM
    // ========================================
    FISH_SIZE: {
        TINY:   0,
        SMALL:  1,
        MEDIUM: 2,
        LARGE:  3,
        MEGA:   4
    },

    // Visual scale multipliers per size tier
    FISH_SIZE_SCALES: [0.4, 0.6, 0.85, 1.2, 1.6],

    // Player movement speed per size tier (px/sec)
    PLAYER_SPEEDS: [350, 320, 280, 250, 220],

    // Number of fish eaten required to reach next size
    // Index = current size, value = total fish needed to grow to next
    GROWTH_THRESHOLDS: [5, 12, 22, 35, 50],

    // ========================================
    // PLAYER & LIVES
    // ========================================
    MAX_LIVES: 3,
    INVINCIBILITY_TIME: 1500,       // ms of invincibility after taking a hit
    GROWTH_INVINCIBILITY: 500,      // ms of invincibility after growing
    PLAYER_START_SIZE: 0,           // Start as TINY
    PLAYER_HITBOX_SCALE: 0.7,       // Hitbox is 70% of visual size (forgiving)

    // ========================================
    // FRENZY / COMBO SYSTEM
    // ========================================
    // Consecutive fish eaten thresholds for multiplier tiers
    // [3 fish -> 2x, 6 fish -> 3x, 10 fish -> 4x, 15 fish -> 5x]
    FRENZY_THRESHOLDS: [3, 6, 10, 15],
    FRENZY_MULTIPLIERS: [1, 2, 3, 4, 5],   // Index 0 = no frenzy (1x)
    FRENZY_DECAY_TIME: 2000,                // ms before combo resets
    FRENZY_COLORS: [
        '#FFFFFF',  // 1x - white (normal)
        '#FFD700',  // 2x - gold
        '#FF8C00',  // 3x - dark orange
        '#FF4500',  // 4x - orange red
        '#FF0000'   // 5x - red (max frenzy)
    ],

    // ========================================
    // SPAWNING
    // ========================================
    MAX_FISH_ON_SCREEN: 35,
    SPAWN_INTERVAL_BASE: 800,       // ms base interval between spawns
    SPAWN_INTERVAL_MIN: 300,        // ms minimum spawn interval (at high levels)
    SPAWN_MARGIN: 80,               // px offscreen margin for spawning
    FISH_DESPAWN_MARGIN: 120,       // px offscreen before despawning

    // ========================================
    // LEVELS
    // ========================================
    LEVEL_COUNT: 15,
    LEVEL_CLEAR_SCORE_BASE: 500,    // Base score to clear level 1
    LEVEL_CLEAR_MULTIPLIER: 1.6,    // Each level needs 1.6x more score
    LEVEL_TRANSITION_DELAY: 2000,   // ms before showing level clear screen

    // ========================================
    // FISH COLOR PALETTE
    // 8 distinct vibrant color sets for fish types
    // Each set: [body, belly, fin, outline]
    // ========================================
    FISH_COLORS: [
        // Type 0: Tropical Orange
        {
            body:    0xFF6B35,
            belly:   0xFFE0B2,
            fin:     0xE65100,
            outline: 0xBF360C,
            name: 'Tropical Orange'
        },
        // Type 1: Ocean Blue
        {
            body:    0x2196F3,
            belly:   0xBBDEFB,
            fin:     0x1565C0,
            outline: 0x0D47A1,
            name: 'Ocean Blue'
        },
        // Type 2: Coral Pink
        {
            body:    0xE91E63,
            belly:   0xF8BBD0,
            fin:     0xC2185B,
            outline: 0x880E4F,
            name: 'Coral Pink'
        },
        // Type 3: Emerald Green
        {
            body:    0x4CAF50,
            belly:   0xC8E6C9,
            fin:     0x2E7D32,
            outline: 0x1B5E20,
            name: 'Emerald Green'
        },
        // Type 4: Royal Purple
        {
            body:    0x9C27B0,
            belly:   0xE1BEE7,
            fin:     0x7B1FA2,
            outline: 0x4A148C,
            name: 'Royal Purple'
        },
        // Type 5: Sunshine Yellow
        {
            body:    0xFFC107,
            belly:   0xFFF9C4,
            fin:     0xFFA000,
            outline: 0xFF6F00,
            name: 'Sunshine Yellow'
        },
        // Type 6: Deep Red
        {
            body:    0xF44336,
            belly:   0xFFCDD2,
            fin:     0xD32F2F,
            outline: 0xB71C1C,
            name: 'Deep Red'
        },
        // Type 7: Cyan Teal
        {
            body:    0x00BCD4,
            belly:   0xB2EBF2,
            fin:     0x00838F,
            outline: 0x006064,
            name: 'Cyan Teal'
        }
    ],

    // ========================================
    // POWER-UP SYSTEM
    // ========================================
    POWER_UP_TYPES: {
        SPEED:  'SPEED',
        SHIELD: 'SHIELD',
        MAGNET: 'MAGNET',
        GROW:   'GROW'
    },

    POWER_UP_DURATIONS: {
        SPEED:  5000,   // ms
        SHIELD: 5000,
        MAGNET: 5000,
        GROW:   5000
    },

    POWER_UP_COLORS: {
        SPEED:  0x00E5FF,   // Cyan flash
        SHIELD: 0x76FF03,   // Green glow
        MAGNET: 0xFFD740,   // Golden pull
        GROW:   0xE040FB    // Purple surge
    },

    POWER_UP_SPEED_BOOST: 1.5,     // 50% speed increase
    POWER_UP_MAGNET_RANGE: 200,    // px attraction radius
    POWER_UP_SPAWN_CHANCE: 0.03,   // 3% chance per spawn cycle
    POWER_UP_BOB_SPEED: 1.5,       // Floating bob animation speed
    POWER_UP_BOB_AMOUNT: 8,        // px bob amplitude

    // ========================================
    // HAZARD SYSTEM
    // ========================================
    HAZARD_TYPES: {
        JELLYFISH:  'JELLYFISH',
        PUFFERFISH: 'PUFFERFISH'
    },

    HAZARD_JELLYFISH_SPEED: 40,         // Slow drifting speed
    HAZARD_JELLYFISH_STUN_TIME: 1500,   // ms stun duration
    HAZARD_PUFFERFISH_SPEED: 80,        // Moderate speed
    HAZARD_PUFFERFISH_INFLATE_RANGE: 150, // px range to trigger inflate
    HAZARD_SPAWN_CHANCE: 0.02,          // 2% chance per spawn cycle
    HAZARD_MAX_ON_SCREEN: 3,

    // ========================================
    // VISUAL & EFFECTS
    // ========================================
    OCEAN_COLORS: {
        SURFACE:   0x33CCFF,    // Light blue at top
        MID:       0x1A9FD4,    // Mid ocean blue
        DEEP:      0x0D5F8A,    // Deep blue at bottom
        ABYSS:     0x0A3D5C     // Darkest depths
    },

    BUBBLE_COUNT: 20,               // Background bubble count
    BUBBLE_MIN_SIZE: 2,
    BUBBLE_MAX_SIZE: 8,
    BUBBLE_MIN_SPEED: 20,
    BUBBLE_MAX_SPEED: 60,
    BUBBLE_ALPHA: 0.4,

    // Light rays from surface
    LIGHT_RAY_COUNT: 7,
    LIGHT_RAY_ALPHA: 0.14,

    // ========================================
    // ANIMATION
    // ========================================
    FISH_TAIL_SPEED: 8,             // Tail wag speed
    FISH_TAIL_AMOUNT: 0.15,         // Tail wag amplitude (radians)
    EAT_ANIMATION_DURATION: 200,    // ms for eat chomp animation
    DEATH_ANIMATION_DURATION: 500,  // ms for death effect
    GROW_ANIMATION_DURATION: 600,   // ms for size-up animation

    // ========================================
    // SCORING
    // ========================================
    SCORE_PER_FISH: {
        0: 10,   // TINY fish
        1: 25,   // SMALL fish
        2: 50,   // MEDIUM fish
        3: 100,  // LARGE fish
        4: 200   // MEGA fish
    },

    SCORE_POWER_UP_BONUS: 50,       // Bonus for collecting power-up
    SCORE_LEVEL_CLEAR_BONUS: 1000,  // Bonus for clearing a level

    // ========================================
    // UI / HUD
    // ========================================
    HUD_PADDING: 20,
    HUD_FONT_SIZE: 28,
    HUD_SCORE_COLOR: '#FFFFFF',
    HUD_COMBO_FONT_SIZE: 36,
    HUD_LIFE_ICON_SIZE: 24,
    HUD_LIFE_ICON_SPACING: 8,

    // ========================================
    // DIFFICULTY SCALING PER LEVEL
    // Each level adjusts these multipliers
    // ========================================
    DIFFICULTY: {
        // Enemy speed multiplier per level (level 1 = 1.0)
        speedScale: function(level) {
            return 1.0 + (level - 1) * 0.08;
        },
        // Spawn rate multiplier per level
        spawnRateScale: function(level) {
            return 1.0 + (level - 1) * 0.12;
        },
        // Proportion of larger fish per level
        largeFishChance: function(level) {
            return Math.min(0.05 + (level - 1) * 0.04, 0.5);
        },
        // Hazard spawn chance per level
        hazardChance: function(level) {
            return 0.02 + (level - 1) * 0.008;
        },
        // Score needed to clear a level
        levelClearScore: function(level) {
            return Math.floor(500 * Math.pow(1.6, level - 1));
        }
    },

    // ========================================
    // AUDIO (placeholder keys for SoundSystem)
    // ========================================
    AUDIO_KEYS: {
        BGM_MENU:       'bgm_menu',
        BGM_GAME:       'bgm_game',
        SFX_EAT:        'sfx_eat',
        SFX_EAT_BIG:    'sfx_eat_big',
        SFX_GROW:       'sfx_grow',
        SFX_HIT:        'sfx_hit',
        SFX_DEATH:      'sfx_death',
        SFX_POWER_UP:   'sfx_power_up',
        SFX_FRENZY:     'sfx_frenzy',
        SFX_LEVEL_UP:   'sfx_level_up',
        SFX_CLICK:      'sfx_click'
    },

    // ========================================
    // SCENE KEYS
    // ========================================
    SCENES: {
        BOOT:        'BootScene',
        MENU:        'MenuScene',
        TUTORIAL:    'TutorialScene',
        GAME:        'GameScene',
        HUD:         'HUDScene',
        PAUSE:       'PauseScene',
        LEVEL_CLEAR: 'LevelClearScene',
        GAME_OVER:   'GameOverScene'
    },

    // ========================================
    // STORAGE KEYS (localStorage)
    // ========================================
    STORAGE: {
        HIGH_SCORE:     'ff_high_score',
        HIGHEST_LEVEL:  'ff_highest_level',
        SOUND_ENABLED:  'ff_sound_enabled',
        MUSIC_ENABLED:  'ff_music_enabled',
        TUTORIAL_SEEN:  'ff_tutorial_seen'
    },

    // ========================================
    // DEPTH SORTING (z-index layers)
    // ========================================
    DEPTH: {
        BACKGROUND:     0,
        LIGHT_RAYS:     1,
        BUBBLES:        2,
        SEAWEED:        3,
        ENEMY_FISH:     10,
        POWER_UPS:      15,
        HAZARDS:        18,
        PLAYER:         20,
        PARTICLES:      25,
        HUD:            100,
        OVERLAY:        200
    }
};
