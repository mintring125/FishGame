class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.score = data?.score || 0;
    this.level = data?.level || 1;
    this.highScore = data?.highScore || 0;
    this.gameComplete = data?.gameComplete || false;
    this.isNewRecord = this.score > this.highScore;
    this._nameSelected = false;
  }

  create() {
    const GAME_WIDTH = window.Constants.GAME_WIDTH;
    const GAME_HEIGHT = window.Constants.GAME_HEIGHT;

    // Ocean gradient background
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillGradientStyle(0x1a3a52, 0x1a3a52, 0x0d5a7a, 0x0d5a7a, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.generateTexture('gameOverBg', GAME_WIDTH, GAME_HEIGHT);
    graphics.destroy();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'gameOverBg');

    // Title based on game complete state
    const titleText = this.gameComplete ? '축하합니다!' : '게임 오버';
    const titleColor = this.gameComplete ? '#FFD700' : '#FF6B6B';
    const subtitleText = this.gameComplete ? '모든 레벨 클리어!' : '다시 도전해봐!';

    const title = this.add.text(GAME_WIDTH / 2, 80, titleText, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
      fill: titleColor,
      align: 'center',
    });
    title.setOrigin(0.5, 0.5);
    title.setAlpha(0);

    const subtitle = this.add.text(GAME_WIDTH / 2, 145, subtitleText, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '32px',
      fill: '#FFFFFF',
      align: 'center',
    });
    subtitle.setOrigin(0.5, 0.5);
    subtitle.setAlpha(0);

    // Fade in animations
    this.tweens.add({ targets: title, alpha: 1, duration: 600, ease: 'Power2.easeOut' });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 600, delay: 200, ease: 'Power2.easeOut' });

    // Score display section
    const scoreY = 240;

    const scoreLabel = this.add.text(GAME_WIDTH / 2, scoreY, '점수:', {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '28px',
      fill: '#FFFFFF',
      align: 'center',
    });
    scoreLabel.setOrigin(0.5, 0.5);
    scoreLabel.setAlpha(0);

    const scoreValue = this.add.text(GAME_WIDTH / 2, scoreY + 42, '0', {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '44px',
      fontStyle: 'bold',
      fill: '#FFD700',
      align: 'center',
    });
    scoreValue.setOrigin(0.5, 0.5);
    scoreValue.setAlpha(0);

    this.tweens.add({ targets: scoreLabel, alpha: 1, duration: 400, delay: 400, ease: 'Power2.easeOut' });
    this.tweens.add({ targets: scoreValue, alpha: 1, duration: 400, delay: 400, ease: 'Power2.easeOut' });

    // Count-up animation for score
    const counter = { value: 0 };
    this.tweens.add({
      targets: counter,
      value: this.score,
      duration: 1200,
      delay: 500,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        scoreValue.setText(Math.floor(counter.value).toLocaleString());
      },
    });

    // High score display
    const highScoreY = 345;
    const highScoreLabel = this.add.text(GAME_WIDTH / 2, highScoreY, '최고 점수:', {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '24px',
      fill: '#FFFFFF',
      align: 'center',
    });
    highScoreLabel.setOrigin(0.5, 0.5);
    highScoreLabel.setAlpha(0);

    const displayHighScore = this.isNewRecord ? this.score.toLocaleString() : this.highScore.toLocaleString();
    const highScoreValue = this.add.text(GAME_WIDTH / 2, highScoreY + 38, displayHighScore, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      fill: '#FFD700',
      align: 'center',
    });
    highScoreValue.setOrigin(0.5, 0.5);
    highScoreValue.setAlpha(0);

    this.tweens.add({ targets: highScoreLabel, alpha: 1, duration: 400, delay: 600, ease: 'Power2.easeOut' });
    this.tweens.add({ targets: highScoreValue, alpha: 1, duration: 400, delay: 600, ease: 'Power2.easeOut' });

    // Level reached display
    const levelY = 440;
    const levelText = this.add.text(GAME_WIDTH / 2, levelY, `도달 레벨: ${this.level}`, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '24px',
      fill: '#FFFFFF',
      align: 'center',
    });
    levelText.setOrigin(0.5, 0.5);
    levelText.setAlpha(0);

    this.tweens.add({ targets: levelText, alpha: 1, duration: 400, delay: 700, ease: 'Power2.easeOut' });

    // New record: name selection area
    if (this.isNewRecord) {
      this._createNameSelection(GAME_WIDTH, 500);
    }

    // Buttons
    const buttonY = this.isNewRecord ? 720 : 680;
    const buttonWidth = 200;
    const buttonHeight = 70;
    const buttonGap = 50;

    // Play Again button
    const playAgainBtn = this.createButton(
      GAME_WIDTH / 2 - (buttonWidth + buttonGap / 2),
      buttonY,
      buttonWidth,
      buttonHeight,
      '다시 하기',
      '#4CAF50'
    );
    playAgainBtn.setAlpha(0);
    this.tweens.add({ targets: playAgainBtn, alpha: 1, duration: 400, delay: 900, ease: 'Power2.easeOut' });

    playAgainBtn.setDepth(1000);
    playAgainBtn.setInteractive({ useHandCursor: true });
    playAgainBtn.on('pointerdown', () => {
      try { this.scene.stop('HUDScene'); } catch (e) {}
      this.scene.start('GameScene', { level: 1, score: 0 });
    });

    // Menu button
    const menuBtn = this.createButton(
      GAME_WIDTH / 2 + (buttonWidth + buttonGap / 2),
      buttonY,
      buttonWidth,
      buttonHeight,
      '메뉴로',
      '#2196F3'
    );
    menuBtn.setAlpha(0);
    this.tweens.add({ targets: menuBtn, alpha: 1, duration: 400, delay: 900, ease: 'Power2.easeOut' });

    menuBtn.setDepth(1000);
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      try { this.scene.stop('HUDScene'); } catch (e) {}
      this.scene.start('MenuScene');
    });

    // Button hover effects
    this.addButtonHover(playAgainBtn);
    this.addButtonHover(menuBtn);
  }

  _createNameSelection(gameWidth, y) {
    // "새 기록!" badge
    const badgeText = this.add.text(gameWidth / 2, y, '새 기록! 이름을 선택하세요', {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      fill: '#FFD700',
      align: 'center',
    });
    badgeText.setOrigin(0.5, 0.5);
    badgeText.setAlpha(0);
    badgeText.setDepth(1000);

    this.tweens.add({ targets: badgeText, alpha: 1, duration: 400, delay: 800, ease: 'Power2.easeOut' });

    // Pulse badge
    this.tweens.add({
      targets: badgeText,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 600,
      delay: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Load previously saved name to highlight
    let savedName = '';
    try { savedName = localStorage.getItem('ff_record_name') || ''; } catch (e) {}

    // Name buttons
    const btnY = y + 55;
    const btnWidth = 180;
    const btnHeight = 55;
    const gap = 40;

    const name1Btn = this._createNameButton(
      gameWidth / 2 - (btnWidth / 2 + gap / 2), btnY,
      btnWidth, btnHeight, '김나은', savedName === '김나은'
    );
    const name2Btn = this._createNameButton(
      gameWidth / 2 + (btnWidth / 2 + gap / 2), btnY,
      btnWidth, btnHeight, '김형석', savedName === '김형석'
    );

    // Selection logic
    const self = this;
    name1Btn.container.on('pointerdown', () => {
      self._selectName('김나은', name1Btn, name2Btn);
    });
    name2Btn.container.on('pointerdown', () => {
      self._selectName('김형석', name2Btn, name1Btn);
    });

    // Show saved record info
    const recordY = btnY + 50;
    this._recordInfoText = this.add.text(gameWidth / 2, recordY, '', {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '20px',
      fill: '#88DDFF',
      align: 'center',
    });
    this._recordInfoText.setOrigin(0.5, 0.5);
    this._recordInfoText.setDepth(1000);

    // Show existing record if name was already selected
    if (savedName) {
      this._recordInfoText.setText(`기록자: ${savedName}`);
    }
  }

  _createNameButton(x, y, width, height, name, isSelected) {
    const container = this.add.container(x, y);
    container.setDepth(1001);

    const bg = this.add.graphics();
    const borderGfx = this.add.graphics();

    const drawState = (selected) => {
      bg.clear();
      borderGfx.clear();

      if (selected) {
        bg.fillStyle(0xFFD700, 0.9);
        borderGfx.lineStyle(3, 0xFFFFFF, 1);
      } else {
        bg.fillStyle(0x3366AA, 0.8);
        borderGfx.lineStyle(2, 0xFFFFFF, 0.6);
      }
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
      borderGfx.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    };

    drawState(isSelected);
    container.add(bg);
    container.add(borderGfx);

    const txt = this.add.text(0, 0, name, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      fill: isSelected ? '#333333' : '#FFFFFF',
      align: 'center',
    });
    txt.setOrigin(0.5, 0.5);
    container.add(txt);

    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    // Fade in
    container.setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 400, delay: 900, ease: 'Power2.easeOut' });

    return { container, bg, borderGfx, txt, drawState, name };
  }

  _selectName(name, selectedBtn, otherBtn) {
    // Update visuals
    selectedBtn.drawState(true);
    selectedBtn.txt.setFill('#333333');
    otherBtn.drawState(false);
    otherBtn.txt.setFill('#FFFFFF');

    // Save to localStorage
    try {
      localStorage.setItem('ff_record_name', name);
      localStorage.setItem('ff_record_score', String(this.score));
    } catch (e) {}

    // Update info text
    if (this._recordInfoText) {
      this._recordInfoText.setText(`기록자: ${name}`);
    }

    // Brief scale feedback
    this.tweens.add({
      targets: selectedBtn.container,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    this._nameSelected = true;
  }

  createButton(x, y, width, height, text, color) {
    const button = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    button.add(bg);

    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(3, 0xFFFFFF, 0.8);
    borderGraphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    button.add(borderGraphics);

    const txt = this.add.text(0, 0, text, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      fill: '#FFFFFF',
      align: 'center',
    });
    txt.setOrigin(0.5, 0.5);
    button.add(txt);

    button.setSize(width, height);
    button.setData('width', width);
    button.setData('height', height);
    button.setData('baseColor', color);

    return button;
  }

  addButtonHover(button) {
    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        ease: 'Power2.easeOut',
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2.easeOut',
      });
    });
  }
}

window.GameOverScene = GameOverScene;
