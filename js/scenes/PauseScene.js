/**
 * PauseScene - Pause overlay for Feeding Frenzy
 * Displays pause menu with resume, restart, and menu options
 */
class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  init(data) {
    this.gameData = {
      level: data?.level || 1,
      score: data?.score || 0
    };
  }

  create() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Semi-transparent dark backdrop
    this.add
      .rectangle(centerX, centerY, width, height, 0x000000, 0.6)
      .setOrigin(0.5, 0.5)
      .setDepth(1500)
      .setInteractive(); // Capture clicks to prevent game interaction behind

    // Title: "일시정지" (Paused)
    this.add
      .text(centerX, centerY - 150, '일시정지', {
        font: 'bold 64px Noto Sans KR, sans-serif',
        fill: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(1501);

    // Score and Level info
    this.add
      .text(centerX, centerY - 50, `레벨: ${this.gameData.level}`, {
        font: '32px Noto Sans KR, sans-serif',
        fill: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(1501);

    this.add
      .text(centerX, centerY + 10, `점수: ${this.gameData.score}`, {
        font: '32px Noto Sans KR, sans-serif',
        fill: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(1501);

    // Button dimensions
    const buttonWidth = 280;
    const buttonHeight = 60;
    const buttonRadius = 15;
    const buttonSpacing = 80;

    // Resume button - Green
    this.createButton(
      centerX,
      centerY + 100,
      buttonWidth,
      buttonHeight,
      buttonRadius,
      '계속하기',
      '#2ecc71',
      '#27ae60',
      () => this.resumeGame()
    );

    // Restart button - Orange
    this.createButton(
      centerX,
      centerY + 100 + buttonSpacing,
      buttonWidth,
      buttonHeight,
      buttonRadius,
      '다시 시작',
      '#e67e22',
      '#d35400',
      () => this.restartGame()
    );

    // Menu button - Gray
    this.createButton(
      centerX,
      centerY + 100 + buttonSpacing * 2,
      buttonWidth,
      buttonHeight,
      buttonRadius,
      '메뉴로',
      '#95a5a6',
      '#7f8c8d',
      () => this.goToMenu()
    );
  }

  /**
   * Create a styled button with hover and press effects
   */
  createButton(x, y, width, height, radius, text, color, hoverColor, callback) {
    const button = this.add.graphics().setDepth(1900);
    const textObj = this.add
      .text(x, y, text, {
        font: 'bold 28px Noto Sans KR, sans-serif',
        fill: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(1901);

    // Draw initial button
    const drawButton = (fillColor) => {
      button.clear();
      button.fillStyle(Phaser.Display.Color.HexStringToColor(fillColor).color, 1);
      button.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    };

    drawButton(color);

    // Make interactive zone
    const hitZone = this.add
      .zone(x, y, width, height)
      .setOrigin(0.5, 0.5)
      .setSize(width, height)
      .setInteractive({ useHandCursor: true })
      .setDepth(2000); // Top layer

    // Hover effects
    hitZone.on('pointerover', () => {
      drawButton(hoverColor);
      textObj.setScale(1.05);
      this.input.setDefaultCursor('pointer');
    });

    hitZone.on('pointerout', () => {
      drawButton(color);
      textObj.setScale(1);
      this.input.setDefaultCursor('default');
    });

    // Press effect
    hitZone.on('pointerdown', () => {
      textObj.setScale(0.95);
    });

    hitZone.on('pointerup', () => {
      textObj.setScale(1.05);
      callback();
    });

    return { button, textObj, hitZone };
  }

  /**
   * Resume the game
   */
  resumeGame() {
    this.scene.stop('PauseScene');
    this.scene.resume('GameScene');
  }

  /**
   * Restart the game from level 1
   */
  restartGame() {
    // Capture scene manager reference before stopping this scene
    const sceneManager = this.scene;
    window.setTimeout(() => {
      try {
        if (sceneManager.isActive('HUDScene')) sceneManager.stop('HUDScene');
      } catch (e) {}
      try {
        sceneManager.stop('PauseScene');
      } catch (e) {}
      try {
        sceneManager.stop('GameScene');
      } catch (e) {}
      sceneManager.start('GameScene', { level: 1, score: 0 });
    }, 10);
  }

  /**
   * Return to main menu
   */
  goToMenu() {
    const sceneManager = this.scene;
    window.setTimeout(() => {
      try {
        if (sceneManager.isActive('HUDScene')) sceneManager.stop('HUDScene');
      } catch (e) {}
      try {
        sceneManager.stop('PauseScene');
      } catch (e) {}
      try {
        sceneManager.stop('GameScene');
      } catch (e) {}
      sceneManager.start('MenuScene');
    }, 10);
  }
}

// Attach to window
window.PauseScene = PauseScene;
