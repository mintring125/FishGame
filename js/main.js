/**
 * main.js - Game Entry Point
 * Feeding Frenzy - Fish Feeding Game
 * Initializes Phaser 3 with full configuration for Galaxy Tab S9+
 */

(function () {
    'use strict';

    // ========================================
    // DEVICE & DISPLAY HELPERS
    // ========================================

    /**
     * Get the device pixel ratio, clamped for performance.
     * High-DPI devices (like Galaxy Tab S9+ at ~2.25x) benefit
     * from rendering at a lower effective ratio to maintain 60fps.
     */
    function getDevicePixelRatio() {
        var dpr = window.devicePixelRatio || 1;
        // Clamp to 2 to avoid excessive GPU load on ultra-high DPI screens
        return Math.min(dpr, 2);
    }

    /**
     * Try to lock the screen orientation to landscape.
     * Uses the Screen Orientation API with fallback.
     */
    function tryLockOrientation() {
        var lockTarget = 'landscape';

        try {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock(lockTarget).catch(function () {
                    // Orientation lock not supported or denied - this is expected on desktop
                });
            } else if (screen.lockOrientation) {
                screen.lockOrientation(lockTarget);
            } else if (screen.mozLockOrientation) {
                screen.mozLockOrientation(lockTarget);
            } else if (screen.msLockOrientation) {
                screen.msLockOrientation(lockTarget);
            }
        } catch (e) {
            // Silently ignore - orientation lock is a nice-to-have
        }
    }

    // ========================================
    // SCENE REFERENCES
    // Scenes are loaded via script tags and attached to window.
    // We collect them here, with fallback empty classes so the
    // game boots even if some scene files haven't been created yet.
    // ========================================

    function getSceneClass(name) {
        return window[name] || class extends Phaser.Scene {
            constructor() {
                super({ key: name });
            }
            create() {
                // Placeholder: scene not yet implemented
                var text = this.add.text(
                    Constants.GAME_WIDTH / 2,
                    Constants.GAME_HEIGHT / 2,
                    name + '\n(Not Implemented)',
                    {
                        fontFamily: 'Noto Sans KR, sans-serif',
                        fontSize: '32px',
                        color: '#ffffff',
                        align: 'center'
                    }
                );
                text.setOrigin(0.5, 0.5);
            }
        };
    }

    // ========================================
    // PHASER GAME CONFIGURATION
    // ========================================

    var C = window.Constants;

    var config = {
        type: Phaser.AUTO, // WebGL preferred, Canvas fallback

        // Parent DOM element
        parent: 'game-container',

        // Logical game resolution (scaled by Phaser to fit device)
        width: C.GAME_WIDTH,
        height: C.GAME_HEIGHT,

        // ---- Scale Manager ----
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: 'game-container',
            width: C.GAME_WIDTH,
            height: C.GAME_HEIGHT,
            min: {
                width: 700,
                height: 438
            },
            max: {
                width: 2800,
                height: 1752
            }
        },

        // ---- Physics ----
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 0 },
                debug: false
            }
        },

        // ---- Scenes ----
        // Loaded in order: first scene in the array is started automatically
        scene: [
            getSceneClass('BootScene'),
            getSceneClass('MenuScene'),
            getSceneClass('TutorialScene'),
            getSceneClass('GameScene'),
            getSceneClass('HUDScene'),
            getSceneClass('PauseScene'),
            getSceneClass('LevelClearScene'),
            getSceneClass('GameOverScene')
        ],

        // ---- Input ----
        input: {
            touch: true,
            activePointers: 2,
            smoothFactor: 0
        },

        // ---- Rendering ----
        render: {
            antialias: true,
            pixelArt: false,
            roundPixels: false,
            transparent: false,
            clearBeforeRender: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false,
            powerPreference: 'high-performance'
        },

        // ---- Background Color ----
        backgroundColor: '#006994', // Deep ocean blue

        // ---- FPS ----
        fps: {
            target: 60,
            forceSetTimeOut: false,
            smoothStep: true
        },

        // ---- Banner ----
        banner: {
            hidePhaser: true
        },

        // ---- Audio ----
        audio: {
            disableWebAudio: false,
            context: null,
            noAudio: false
        },

        // ---- DOM ----
        dom: {
            createContainer: false
        },

        // ---- Callbacks ----
        callbacks: {
            preBoot: function (game) {
                // Store device info in registry (canvas doesn't exist yet in preBoot)
                var dpr = getDevicePixelRatio();
                game.registry.set('devicePixelRatio', dpr);
                game.registry.set('isMobile', /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
                game.registry.set('isTablet', /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent));
            },
            postBoot: function (game) {
                // Apply canvas styling after canvas is created
                if (game.canvas) {
                    game.canvas.style.imageRendering = 'auto';
                }
                // Try to lock orientation after game boots
                tryLockOrientation();
            }
        }
    };

    // ========================================
    // CREATE GAME INSTANCE
    // ========================================

    var game = new Phaser.Game(config);

    // Store globally for debugging and external access
    window.game = game;

    // ========================================
    // VISIBILITY CHANGE HANDLER
    // Auto-pause when tab/app loses focus
    // ========================================

    function handleVisibilityChange() {
        if (!game || !game.scene) return;

        if (document.hidden) {
            // Page is hidden - pause the game
            game.scene.scenes.forEach(function (scene) {
                if (scene.scene.isActive() && scene.scene.key === C.SCENES.GAME) {
                    // Only auto-pause if we're in the game scene
                    if (!game.scene.isActive(C.SCENES.PAUSE)) {
                        game.registry.set('autoPaused', true);
                        game.scene.pause(C.SCENES.GAME);
                        // Launch pause scene if it exists and game scene is active
                        if (game.scene.getScene(C.SCENES.PAUSE)) {
                            game.scene.launch(C.SCENES.PAUSE);
                        }
                    }
                }
            });

            // Pause audio context
            if (game.sound && game.sound.context && game.sound.context.state === 'running') {
                game.sound.context.suspend();
            }
        } else {
            // Page is visible again - resume audio context
            if (game.sound && game.sound.context && game.sound.context.state === 'suspended') {
                game.sound.context.resume();
            }
        }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, false);

    // ========================================
    // ORIENTATION CHANGE HANDLER
    // ========================================

    function handleOrientationChange() {
        if (!game || !game.scale) return;

        // Give the browser a moment to update dimensions
        setTimeout(function () {
            game.scale.refresh();

            // Re-check and adjust bounds
            var w = window.innerWidth;
            var h = window.innerHeight;

            // If in portrait mode, we could show an overlay or auto-rotate hint
            if (h > w) {
                // Portrait detected - game still works but may have black bars
                game.registry.set('isPortrait', true);
            } else {
                game.registry.set('isPortrait', false);
            }

            // Emit a custom event that scenes can listen to
            game.events.emit('orientationchange', { width: w, height: h, isPortrait: h > w });
        }, 100);
    }

    window.addEventListener('orientationchange', handleOrientationChange, false);
    window.addEventListener('resize', handleOrientationChange, false);

    // Screen orientation API event
    if (screen.orientation) {
        screen.orientation.addEventListener('change', handleOrientationChange, false);
    }

    // ========================================
    // PREVENT DEFAULT TOUCH BEHAVIORS
    // ========================================

    // Prevent pull-to-refresh and overscroll
    document.addEventListener('touchmove', function (e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent double-tap zoom
    var lastTouchEnd = 0;
    document.addEventListener('touchend', function (e) {
        var now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Prevent context menu on long press
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        return false;
    }, false);

    // ========================================
    // FULLSCREEN SUPPORT (optional, user-triggered)
    // ========================================

    window.requestGameFullscreen = function () {
        var elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    };

    // ========================================
    // ERROR HANDLING
    // ========================================

    window.addEventListener('error', function (e) {
        console.error('[FeedingFrenzy] Runtime error:', e.message, 'at', e.filename, ':', e.lineno);
    });

    window.addEventListener('unhandledrejection', function (e) {
        console.error('[FeedingFrenzy] Unhandled promise rejection:', e.reason);
    });

    // ========================================
    // WAKE LOCK (keep screen on during gameplay)
    // ========================================

    var wakeLock = null;

    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', function () {
                    wakeLock = null;
                });
            }
        } catch (e) {
            // Wake lock not supported or denied
        }
    }

    // Request wake lock when page becomes visible
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden && !wakeLock) {
            requestWakeLock();
        }
    });

    // Initial wake lock request
    requestWakeLock();

})();
