// ==========================
// Space Shooter Game Script
// Author: Abolfazl Shadrouh
// ==========================

document.addEventListener('DOMContentLoaded', () => {
  // ====== Canvas Setup ======
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // ====== UI Elements ======
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const scoreDisplay = document.getElementById('score-display');
  const startButton = document.getElementById('startButton');
  const restartButton = document.getElementById('restartButton');
  const scoreEl = document.getElementById('score');
  const finalScoreEl = document.getElementById('finalScore');

  // ====== Game Variables ======
  let score = 0;
  let gameRunning = false;
  let animationFrameId;

  // ====== Assets (Images) ======
  const assets = {};
  const assetUrls = {
    player: 'assets/player.png',
    enemy: 'assets/enemy.png',
    bullet: 'assets/bullet.png',
    background: 'assets/background.png',
  };

  let assetsLoaded = 0;
  const assetCount = Object.keys(assetUrls).length;

  // Load all images
  Object.entries(assetUrls).forEach(([name, url]) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      assets[name] = img;
      assetsLoaded++;
    };
  });

  // ====== Audio Setup ======
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const sounds = {};
  const soundUrls = {
    shoot: 'mp3/shoot.mp3',
    explosion: 'mp3/explosion.mp3',
    gameOver: 'mp3/gameover.mp3',
    backgroundMusic: 'mp3/background_music.mp3',
  };

  // Load sound files
  function loadSound(name, url) {
    window.fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        sounds[name] = audioBuffer;
        if (name === 'backgroundMusic') {
          playMusic();
        }
      });
  }

  Object.entries(soundUrls).forEach(([name, url]) => loadSound(name, url));

  let musicSource;
  function playMusic() {
    if (sounds.backgroundMusic) {
      if (musicSource) musicSource.stop();
      musicSource = audioContext.createBufferSource();
      musicSource.buffer = sounds.backgroundMusic;
      musicSource.loop = true;
      musicSource.connect(audioContext.destination);
      musicSource.start(0);
    }
  }

  function playSound(name) {
    if (sounds[name] && audioContext.state === 'running') {
      const source = audioContext.createBufferSource();
      source.buffer = sounds[name];
      source.connect(audioContext.destination);
      source.start(0);
    }
  }

  // ====== Game Entities ======
  let player, bullets, enemies, enemySpawnTimer;

  function init() {
    player = { x: canvas.width / 2 - 25, y: canvas.height - 60, width: 50, height: 50, speed: 5, dx: 0 };
    bullets = [];
    enemies = [];
    score = 0;
    scoreEl.innerText = 0;
    finalScoreEl.innerText = 0;
    enemySpawnTimer = 0;
  }

  function movePlayer() {
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  }

  function moveBullets() {
    bullets.forEach((bullet, index) => {
      bullet.y -= bullet.speed;
      if (bullet.y + bullet.height < 0) bullets.splice(index, 1);
    });
  }

  function spawnEnemy() {
    const size = Math.random() * (60 - 30) + 30;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = Math.random() * (3 - 1) + 1;
    enemies.push({ x, y, width: size, height: size, speed });
  }

  function moveEnemies() {
    enemies.forEach((enemy, index) => {
      enemy.y += enemy.speed;
      if (enemy.y > canvas.height) enemies.splice(index, 1);
    });
  }

  function detectCollisions() {
    bullets.forEach((bullet, bIndex) => {
      enemies.forEach((enemy, eIndex) => {
        if (bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y) {
          playSound('explosion');
          bullets.splice(bIndex, 1);
          enemies.splice(eIndex, 1);
          score += 10;
          scoreEl.innerText = score;
        }
      });
    });

    enemies.forEach(enemy => {
      if (player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y) {
        endGame();
      }
    });
  }

  function draw() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (assets.background) ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
    if (assets.player) ctx.drawImage(assets.player, player.x, player.y, player.width, player.height);
    bullets.forEach(b => { if (assets.bullet) ctx.drawImage(assets.bullet, b.x, b.y, b.width, b.height); });
    enemies.forEach(e => { if (assets.enemy) ctx.drawImage(assets.enemy, e.x, e.y, e.width, e.height); });
  }

  function update() {
    if (!gameRunning) return;
    movePlayer();
    moveBullets();
    enemySpawnTimer++;
    if (enemySpawnTimer > 100) { spawnEnemy(); enemySpawnTimer = 0; }
    moveEnemies();
    detectCollisions();
  }

  function gameLoop() {
    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    if (audioContext.state === 'suspended') audioContext.resume();
    playMusic();
    init();
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    gameLoop();
  }

  function endGame() {
    playSound('gameOver');
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    finalScoreEl.innerText = score;
    gameOverScreen.classList.remove('hidden');
    scoreDisplay.classList.add('hidden');
  }

  function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'd') player.dx = player.speed;
    else if (e.key === 'ArrowLeft' || e.key === 'a') player.dx = -player.speed;
    else if (e.key === ' ' && gameRunning) {
      bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 10, speed: 7 });
      playSound('shoot');
    }
  }

  function keyUp(e) {
    if (['ArrowRight','d','ArrowLeft','a'].includes(e.key)) player.dx = 0;
  }

  // ====== Event Listeners ======
  startButton.addEventListener('click', startGame);
  restartButton.addEventListener('click', startGame);
  document.addEventListener('keydown', keyDown);
  document.addEventListener('keyup', keyUp);
});
