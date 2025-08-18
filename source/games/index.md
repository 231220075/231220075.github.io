---
title: 🎮 小游戏合集
date: 2025-08-12
comments: false
description: 休闲小游戏，放松一下吧！
---

# 🎮 小游戏合集

## 🎯 游戏列表

<div class="games-grid">
  <div class="game-card" onclick="showGame('game2048')">
    <div class="game-icon">🔢</div>
    <h3>2048</h3>
    <p>经典数字合成游戏</p>
  </div>
  
  <div class="game-card" onclick="showGame('jumpGame')">
    <div class="game-icon">🦘</div>
    <h3>跳跃小球</h3>
    <p>简单的跳跃积分游戏</p>
  </div>
  
  <div class="game-card" onclick="showGame('snakeGame')">
    <div class="game-icon">🐍</div>
    <h3>贪吃蛇</h3>
    <p>经典贪吃蛇游戏</p>
  </div>
  
  <div class="game-card" onclick="showGame('tetris')">
    <div class="game-icon">🧩</div>
    <h3>俄罗斯方块</h3>
    <p>经典消除游戏</p>
  </div>
</div>

## 🎲 游戏区域

<div id="game-container" style="display: none;">
  <div id="game-header">
    <button onclick="hideGame()" class="back-btn">← 返回游戏列表</button>
    <h2 id="game-title"></h2>
  </div>
  <div id="game-area"></div>
</div>

<script>
// 显示游戏
function showGame(gameType) {
  document.getElementById('game-container').style.display = 'block';
  document.querySelector('.games-grid').style.display = 'none';
  
  // 阻止方向键默认行为（防止页面滚动）
  document.addEventListener('keydown', preventArrowKeyDefault);
  
  switch(gameType) {
    case 'game2048':
      show2048Game();
      break;
    case 'jumpGame':
      showJumpGame();
      break;
    case 'snakeGame':
      showSnakeGame();
      break;
    case 'tetris':
      showTetrisGame();
      break;
  }
}

// 隐藏游戏
function hideGame() {
  document.getElementById('game-container').style.display = 'none';
  document.querySelector('.games-grid').style.display = 'grid';
  document.getElementById('game-area').innerHTML = '';
  
  // 移除方向键阻止事件
  document.removeEventListener('keydown', preventArrowKeyDefault);
}

// 阻止方向键默认行为的函数
function preventArrowKeyDefault(e) {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
}

// 2048游戏
function show2048Game() {
  document.getElementById('game-title').textContent = '2048';
  document.getElementById('game-area').innerHTML = `
    <div class="game2048">
      <div class="score-container">
        <div class="score-box">
          <div class="score-label">分数</div>
          <div id="score">0</div>
        </div>
        <div class="score-box">
          <div class="score-label">最高</div>
          <div id="best">0</div>
        </div>
      </div>
      <button onclick="restart2048()" class="restart-btn">重新开始</button>
      <div id="grid-container" class="grid-container"></div>
      <div class="game-instructions">
        <p><strong>如何游戏:</strong> 使用方向键移动瓷砖。当两个相同数字的瓷砖碰撞时，它们会合并成一个！</p>
      </div>
    </div>
  `;
  init2048();
}

// 跳跃游戏
function showJumpGame() {
  document.getElementById('game-title').textContent = '跳跃小球';
  document.getElementById('game-area').innerHTML = `
    <div class="jump-game">
      <canvas id="jumpCanvas" width="800" height="400"></canvas>
      <div class="jump-controls">
        <div class="jump-score">分数: <span id="jumpScore">0</span></div>
        <button onclick="startJumpGame()" class="start-btn">开始游戏</button>
        <div class="jump-instructions">
          <strong>操作说明：</strong><br>
          • 点按空格键 = 小跳<br>
          • 长按空格键 = 大跳<br>
          • 点击屏幕 = 快速小跳
        </div>
      </div>
    </div>
  `;
  initJumpGame();
}

// 贪吃蛇游戏
function showSnakeGame() {
  document.getElementById('game-title').textContent = '贪吃蛇';
  document.getElementById('game-area').innerHTML = `
    <div class="snake-game">
      <canvas id="snakeCanvas" width="400" height="400"></canvas>
      <div class="snake-controls">
        <div class="snake-score">分数: <span id="snakeScore">0</span></div>
        <button onclick="startSnakeGame()" class="start-btn">开始游戏</button>
        <div class="snake-instructions">使用方向键控制蛇的移动</div>
      </div>
    </div>
  `;
  initSnakeGame();
}

// 俄罗斯方块游戏
function showTetrisGame() {
  document.getElementById('game-title').textContent = '俄罗斯方块';
  document.getElementById('game-area').innerHTML = `
    <div class="tetris-game">
      <canvas id="tetrisCanvas" width="300" height="600"></canvas>
      <div class="tetris-controls">
        <div class="tetris-score">分数: <span id="tetrisScore">0</span></div>
        <div class="tetris-level">等级: <span id="tetrisLevel">1</span></div>
        <button onclick="startTetrisGame()" class="start-btn">开始游戏</button>
        <div class="tetris-instructions">
          A/D: 左右移动<br>
          S: 快速下降<br>
          W: 旋转
        </div>
      </div>
    </div>
  `;
  initTetrisGame();
}

// 2048游戏逻辑
let board2048 = [];
let score2048 = 0;
let best2048 = parseInt(localStorage.getItem('best2048')) || 0;

function init2048() {
  board2048 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];
  score2048 = 0;
  updateScore2048();
  createGrid2048();
  addRandomTile2048();
  addRandomTile2048();
  updateDisplay2048();
  
  document.addEventListener('keydown', handleKeyPress2048);
}

function createGrid2048() {
  const container = document.getElementById('grid-container');
  container.innerHTML = '';
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const tile = document.createElement('div');
      tile.className = 'grid-cell';
      tile.id = 'cell-' + i + '-' + j;
      container.appendChild(tile);
    }
  }
}

function addRandomTile2048() {
  const emptyCells = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board2048[i][j] === 0) {
        emptyCells.push({x: i, y: j});
      }
    }
  }
  
  if (emptyCells.length > 0) {
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board2048[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
  }
}

function updateDisplay2048() {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const cell = document.getElementById('cell-' + i + '-' + j);
      const value = board2048[i][j];
      cell.textContent = value === 0 ? '' : value;
      cell.className = 'grid-cell tile-' + value;
    }
  }
}

function handleKeyPress2048(e) {
  let moved = false;
  const oldBoard = JSON.parse(JSON.stringify(board2048));
  
  switch(e.key) {
    case 'ArrowLeft':
      moved = moveLeft2048();
      break;
    case 'ArrowRight':
      moved = moveRight2048();
      break;
    case 'ArrowUp':
      moved = moveUp2048();
      break;
    case 'ArrowDown':
      moved = moveDown2048();
      break;
  }
  
  if (moved) {
    addRandomTile2048();
    updateDisplay2048();
    updateScore2048();
    
    if (isGameOver2048()) {
      alert('游戏结束！最终分数: ' + score2048);
    }
  }
}

function moveLeft2048() {
  let moved = false;
  for (let i = 0; i < 4; i++) {
    const row = board2048[i].filter(val => val !== 0);
    for (let j = 0; j < row.length - 1; j++) {
      if (row[j] === row[j + 1]) {
        row[j] *= 2;
        score2048 += row[j];
        row[j + 1] = 0;
      }
    }
    const newRow = row.filter(val => val !== 0);
    while (newRow.length < 4) {
      newRow.push(0);
    }
    
    for (let j = 0; j < 4; j++) {
      if (board2048[i][j] !== newRow[j]) {
        moved = true;
      }
      board2048[i][j] = newRow[j];
    }
  }
  return moved;
}

function moveRight2048() {
  let moved = false;
  for (let i = 0; i < 4; i++) {
    const row = board2048[i].filter(val => val !== 0);
    for (let j = row.length - 1; j > 0; j--) {
      if (row[j] === row[j - 1]) {
        row[j] *= 2;
        score2048 += row[j];
        row[j - 1] = 0;
      }
    }
    const newRow = row.filter(val => val !== 0);
    while (newRow.length < 4) {
      newRow.unshift(0);
    }
    
    for (let j = 0; j < 4; j++) {
      if (board2048[i][j] !== newRow[j]) {
        moved = true;
      }
      board2048[i][j] = newRow[j];
    }
  }
  return moved;
}

function moveUp2048() {
  let moved = false;
  for (let j = 0; j < 4; j++) {
    const column = [];
    for (let i = 0; i < 4; i++) {
      if (board2048[i][j] !== 0) {
        column.push(board2048[i][j]);
      }
    }
    
    for (let i = 0; i < column.length - 1; i++) {
      if (column[i] === column[i + 1]) {
        column[i] *= 2;
        score2048 += column[i];
        column[i + 1] = 0;
      }
    }
    
    const newColumn = column.filter(val => val !== 0);
    while (newColumn.length < 4) {
      newColumn.push(0);
    }
    
    for (let i = 0; i < 4; i++) {
      if (board2048[i][j] !== newColumn[i]) {
        moved = true;
      }
      board2048[i][j] = newColumn[i];
    }
  }
  return moved;
}

function moveDown2048() {
  let moved = false;
  for (let j = 0; j < 4; j++) {
    const column = [];
    for (let i = 0; i < 4; i++) {
      if (board2048[i][j] !== 0) {
        column.push(board2048[i][j]);
      }
    }
    
    for (let i = column.length - 1; i > 0; i--) {
      if (column[i] === column[i - 1]) {
        column[i] *= 2;
        score2048 += column[i];
        column[i - 1] = 0;
      }
    }
    
    const newColumn = column.filter(val => val !== 0);
    while (newColumn.length < 4) {
      newColumn.unshift(0);
    }
    
    for (let i = 0; i < 4; i++) {
      if (board2048[i][j] !== newColumn[i]) {
        moved = true;
      }
      board2048[i][j] = newColumn[i];
    }
  }
  return moved;
}

function updateScore2048() {
  document.getElementById('score').textContent = score2048;
  if (score2048 > best2048) {
    best2048 = score2048;
    localStorage.setItem('best2048', best2048);
  }
  document.getElementById('best').textContent = best2048;
}

function isGameOver2048() {
  // 检查是否还有空格
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board2048[i][j] === 0) return false;
    }
  }
  
  // 检查是否还能合并
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      if (board2048[i][j] === board2048[i][j + 1]) return false;
    }
  }
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      if (board2048[i][j] === board2048[i + 1][j]) return false;
    }
  }
  
  return true;
}

function restart2048() {
  document.removeEventListener('keydown', handleKeyPress2048);
  init2048();
}

// 跳跃游戏逻辑
let jumpGame = {
  canvas: null,
  ctx: null,
  player: {x: 50, y: 300, width: 30, height: 30, velY: 0, jumping: false},
  obstacles: [],
  score: 0,
  gameRunning: false,
  animationId: null,
  spacePressed: false,
  pressStartTime: 0,
  maxPressTime: 500 // 最大长按时间(毫秒)
};

function initJumpGame() {
  jumpGame.canvas = document.getElementById('jumpCanvas');
  jumpGame.ctx = jumpGame.canvas.getContext('2d');
  
  document.addEventListener('keydown', jumpGameKeyDown);
  document.addEventListener('keyup', jumpGameKeyUp);
  jumpGame.canvas.addEventListener('click', quickJump);
}

function startJumpGame() {
  jumpGame.player = {x: 50, y: 300, width: 30, height: 30, velY: 0, jumping: false};
  jumpGame.obstacles = [];
  jumpGame.score = 0;
  jumpGame.gameRunning = true;
  jumpGame.spacePressed = false;
  jumpGame.pressStartTime = 0;
  
  if (jumpGame.animationId) {
    cancelAnimationFrame(jumpGame.animationId);
  }
  
  gameLoopJump();
}

function jumpGameKeyDown(e) {
  if (e.code === 'Space' && jumpGame.gameRunning && !jumpGame.spacePressed) {
    e.preventDefault();
    jumpGame.spacePressed = true;
    jumpGame.pressStartTime = Date.now();
  }
}

function jumpGameKeyUp(e) {
  if (e.code === 'Space' && jumpGame.gameRunning && jumpGame.spacePressed) {
    e.preventDefault();
    performJump();
  }
}

function performJump() {
  if (!jumpGame.player.jumping && jumpGame.gameRunning && jumpGame.spacePressed) {
    const pressDuration = Date.now() - jumpGame.pressStartTime;
    const jumpPower = calculateJumpPower(pressDuration);
    
    jumpGame.player.velY = -jumpPower;
    jumpGame.player.jumping = true;
    jumpGame.spacePressed = false;
  }
}

function calculateJumpPower(pressDuration) {
  // 计算跳跃力度：200ms以下为小跳，200ms以上为大跳
  const minJump = 12; // 最小跳跃力度
  const maxJump = 20; // 最大跳跃力度
  
  if (pressDuration < 200) {
    // 小跳：根据按压时间在minJump到中等力度之间插值
    const ratio = pressDuration / 200;
    return minJump + (maxJump - minJump) * 0.4 * ratio;
  } else {
    // 大跳：根据按压时间在中等力度到maxJump之间插值
    const effectiveDuration = Math.min(pressDuration, jumpGame.maxPressTime);
    const ratio = (effectiveDuration - 200) / (jumpGame.maxPressTime - 200);
    return minJump + (maxJump - minJump) * (0.4 + 0.6 * ratio);
  }
}

function quickJump() {
  // 点击鼠标进行快速小跳
  if (!jumpGame.player.jumping && jumpGame.gameRunning) {
    jumpGame.player.velY = -12; // 固定小跳力度
    jumpGame.player.jumping = true;
  }
}

function gameLoopJump() {
  if (!jumpGame.gameRunning) return;
  
  updateJumpGame();
  drawJumpGame();
  
  jumpGame.animationId = requestAnimationFrame(gameLoopJump);
}

function updateJumpGame() {
  // 更新玩家
  jumpGame.player.y += jumpGame.player.velY;
  jumpGame.player.velY += 0.8; // 重力
  
  // 地面碰撞
  if (jumpGame.player.y > 300) {
    jumpGame.player.y = 300;
    jumpGame.player.jumping = false;
  }
  
  // 生成障碍物
  if (Math.random() < 0.01) {
    jumpGame.obstacles.push({
      x: jumpGame.canvas.width,
      y: 320,
      width: 20,
      height: 50
    });
  }
  
  // 更新障碍物
  for (let i = jumpGame.obstacles.length - 1; i >= 0; i--) {
    jumpGame.obstacles[i].x -= 5;
    
    // 移除屏幕外的障碍物
    if (jumpGame.obstacles[i].x + jumpGame.obstacles[i].width < 0) {
      jumpGame.obstacles.splice(i, 1);
      jumpGame.score += 10;
      document.getElementById('jumpScore').textContent = jumpGame.score;
    }
  }
  
  // 碰撞检测
  for (let obstacle of jumpGame.obstacles) {
    if (jumpGame.player.x < obstacle.x + obstacle.width &&
        jumpGame.player.x + jumpGame.player.width > obstacle.x &&
        jumpGame.player.y < obstacle.y + obstacle.height &&
        jumpGame.player.y + jumpGame.player.height > obstacle.y) {
      jumpGame.gameRunning = false;
      alert('游戏结束！分数: ' + jumpGame.score);
    }
  }
}

function drawJumpGame() {
  const ctx = jumpGame.ctx;
  
  // 清空画布
  ctx.clearRect(0, 0, jumpGame.canvas.width, jumpGame.canvas.height);
  
  // 绘制地面
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 330, jumpGame.canvas.width, 70);
  
  // 绘制玩家
  ctx.fillStyle = '#FF6B6B';
  ctx.fillRect(jumpGame.player.x, jumpGame.player.y, jumpGame.player.width, jumpGame.player.height);
  
  // 绘制障碍物
  ctx.fillStyle = '#4ECDC4';
  for (let obstacle of jumpGame.obstacles) {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }
}

// 贪吃蛇游戏逻辑
let snakeGame = {
  canvas: null,
  ctx: null,
  snake: [{x: 200, y: 200}],
  direction: {x: 20, y: 0},
  food: {x: 0, y: 0},
  score: 0,
  gameRunning: false,
  intervalId: null
};

function initSnakeGame() {
  snakeGame.canvas = document.getElementById('snakeCanvas');
  snakeGame.ctx = snakeGame.canvas.getContext('2d');
  
  document.addEventListener('keydown', snakeGameKeyPress);
}

function startSnakeGame() {
  snakeGame.snake = [{x: 200, y: 200}];
  snakeGame.direction = {x: 20, y: 0};
  snakeGame.score = 0;
  snakeGame.gameRunning = true;
  
  generateFood();
  
  if (snakeGame.intervalId) {
    clearInterval(snakeGame.intervalId);
  }
  
  snakeGame.intervalId = setInterval(gameLoopSnake, 100);
}

function snakeGameKeyPress(e) {
  if (!snakeGame.gameRunning) return;
  
  switch(e.key) {
    case 'ArrowUp':
      if (snakeGame.direction.y === 0) {
        snakeGame.direction = {x: 0, y: -20};
      }
      break;
    case 'ArrowDown':
      if (snakeGame.direction.y === 0) {
        snakeGame.direction = {x: 0, y: 20};
      }
      break;
    case 'ArrowLeft':
      if (snakeGame.direction.x === 0) {
        snakeGame.direction = {x: -20, y: 0};
      }
      break;
    case 'ArrowRight':
      if (snakeGame.direction.x === 0) {
        snakeGame.direction = {x: 20, y: 0};
      }
      break;
  }
}

function gameLoopSnake() {
  if (!snakeGame.gameRunning) return;
  
  updateSnakeGame();
  drawSnakeGame();
}

function updateSnakeGame() {
  const head = {
    x: snakeGame.snake[0].x + snakeGame.direction.x,
    y: snakeGame.snake[0].y + snakeGame.direction.y
  };
  
  // 边界碰撞检测
  if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400) {
    gameOverSnake();
    return;
  }
  
  // 自身碰撞检测
  for (let segment of snakeGame.snake) {
    if (head.x === segment.x && head.y === segment.y) {
      gameOverSnake();
      return;
    }
  }
  
  snakeGame.snake.unshift(head);
  
  // 检查是否吃到食物
  if (head.x === snakeGame.food.x && head.y === snakeGame.food.y) {
    snakeGame.score += 10;
    document.getElementById('snakeScore').textContent = snakeGame.score;
    generateFood();
  } else {
    snakeGame.snake.pop();
  }
}

function drawSnakeGame() {
  const ctx = snakeGame.ctx;
  
  // 清空画布
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 400, 400);
  
  // 绘制蛇
  ctx.fillStyle = '#0F0';
  for (let segment of snakeGame.snake) {
    ctx.fillRect(segment.x, segment.y, 18, 18);
  }
  
  // 绘制食物
  ctx.fillStyle = '#F00';
  ctx.fillRect(snakeGame.food.x, snakeGame.food.y, 18, 18);
}

function generateFood() {
  snakeGame.food = {
    x: Math.floor(Math.random() * 20) * 20,
    y: Math.floor(Math.random() * 20) * 20
  };
  
  // 确保食物不生成在蛇身上
  for (let segment of snakeGame.snake) {
    if (segment.x === snakeGame.food.x && segment.y === snakeGame.food.y) {
      generateFood();
      return;
    }
  }
}

function gameOverSnake() {
  snakeGame.gameRunning = false;
  clearInterval(snakeGame.intervalId);
  alert('游戏结束！分数: ' + snakeGame.score);
}

// 俄罗斯方块游戏逻辑
let tetrisGame = {
  canvas: null,
  ctx: null,
  board: [],
  currentPiece: null,
  score: 0,
  level: 1,
  gameRunning: false,
  intervalId: null,
  pieces: [
    [[[1,1],[1,1]]], // O
    [[[1,1,1,1]]], // I
    [[[1,1,1],[0,1,0]]], // T
    [[[1,1,1],[1,0,0]]], // L
    [[[1,1,1],[0,0,1]]], // J
    [[[1,1,0],[0,1,1]]], // S
    [[[0,1,1],[1,1,0]]]  // Z
  ]
};

function initTetrisGame() {
  tetrisGame.canvas = document.getElementById('tetrisCanvas');
  tetrisGame.ctx = tetrisGame.canvas.getContext('2d');
  
  document.addEventListener('keydown', tetrisGameKeyPress);
}

function startTetrisGame() {
  // 初始化游戏板
  tetrisGame.board = [];
  for (let y = 0; y < 20; y++) {
    tetrisGame.board[y] = [];
    for (let x = 0; x < 10; x++) {
      tetrisGame.board[y][x] = 0;
    }
  }
  
  tetrisGame.score = 0;
  tetrisGame.level = 1;
  tetrisGame.gameRunning = true;
  
  spawnPiece();
  
  if (tetrisGame.intervalId) {
    clearInterval(tetrisGame.intervalId);
  }
  
  tetrisGame.intervalId = setInterval(gameLoopTetris, 500);
}

function tetrisGameKeyPress(e) {
  if (!tetrisGame.gameRunning) return;
  
  switch(e.key) {
    case 'a':
    case 'A':
      movePiece(-1, 0);
      break;
    case 'd':
    case 'D':
      movePiece(1, 0);
      break;
    case 's':
    case 'S':
      movePiece(0, 1);
      break;
    case 'w':
    case 'W':
      rotatePiece();
      break;
  }
}

function spawnPiece() {
  const pieceType = Math.floor(Math.random() * tetrisGame.pieces.length);
  tetrisGame.currentPiece = {
    x: 4,
    y: 0,
    shape: tetrisGame.pieces[pieceType][0],
    color: pieceType + 1
  };
  
  if (checkCollision()) {
    gameOverTetris();
  }
}

function gameLoopTetris() {
  if (!tetrisGame.gameRunning) return;
  
  if (!movePiece(0, 1)) {
    placePiece();
    clearLines();
    spawnPiece();
  }
  
  drawTetrisGame();
}

function movePiece(dx, dy) {
  tetrisGame.currentPiece.x += dx;
  tetrisGame.currentPiece.y += dy;
  
  if (checkCollision()) {
    tetrisGame.currentPiece.x -= dx;
    tetrisGame.currentPiece.y -= dy;
    return false;
  }
  
  return true;
}

function rotatePiece() {
  const originalShape = tetrisGame.currentPiece.shape;
  const rotated = [];
  
  // 旋转矩阵
  for (let x = 0; x < originalShape[0].length; x++) {
    rotated[x] = [];
    for (let y = originalShape.length - 1; y >= 0; y--) {
      rotated[x][originalShape.length - 1 - y] = originalShape[y][x];
    }
  }
  
  tetrisGame.currentPiece.shape = rotated;
  
  if (checkCollision()) {
    tetrisGame.currentPiece.shape = originalShape;
  }
}

function checkCollision() {
  for (let y = 0; y < tetrisGame.currentPiece.shape.length; y++) {
    for (let x = 0; x < tetrisGame.currentPiece.shape[y].length; x++) {
      if (tetrisGame.currentPiece.shape[y][x]) {
        const newX = tetrisGame.currentPiece.x + x;
        const newY = tetrisGame.currentPiece.y + y;
        
        if (newX < 0 || newX >= 10 || newY >= 20) {
          return true;
        }
        
        if (newY >= 0 && tetrisGame.board[newY][newX]) {
          return true;
        }
      }
    }
  }
  
  return false;
}

function placePiece() {
  for (let y = 0; y < tetrisGame.currentPiece.shape.length; y++) {
    for (let x = 0; x < tetrisGame.currentPiece.shape[y].length; x++) {
      if (tetrisGame.currentPiece.shape[y][x]) {
        const boardX = tetrisGame.currentPiece.x + x;
        const boardY = tetrisGame.currentPiece.y + y;
        
        if (boardY >= 0) {
          tetrisGame.board[boardY][boardX] = tetrisGame.currentPiece.color;
        }
      }
    }
  }
}

function clearLines() {
  let linesCleared = 0;
  
  for (let y = tetrisGame.board.length - 1; y >= 0; y--) {
    if (tetrisGame.board[y].every(cell => cell !== 0)) {
      tetrisGame.board.splice(y, 1);
      tetrisGame.board.unshift(new Array(10).fill(0));
      linesCleared++;
      y++; // 检查同一行
    }
  }
  
  if (linesCleared > 0) {
    tetrisGame.score += linesCleared * 100 * tetrisGame.level;
    tetrisGame.level = Math.floor(tetrisGame.score / 1000) + 1;
    
    document.getElementById('tetrisScore').textContent = tetrisGame.score;
    document.getElementById('tetrisLevel').textContent = tetrisGame.level;
  }
}

function drawTetrisGame() {
  const ctx = tetrisGame.ctx;
  const blockSize = 30;
  
  // 清空画布
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 300, 600);
  
  // 绘制游戏板
  for (let y = 0; y < tetrisGame.board.length; y++) {
    for (let x = 0; x < tetrisGame.board[y].length; x++) {
      if (tetrisGame.board[y][x]) {
        ctx.fillStyle = 'hsl(' + (tetrisGame.board[y][x] * 40) + ', 70%, 50%)';
        ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
      }
    }
  }
  
  // 绘制当前方块
  if (tetrisGame.currentPiece) {
    ctx.fillStyle = 'hsl(' + (tetrisGame.currentPiece.color * 40) + ', 70%, 50%)';
    for (let y = 0; y < tetrisGame.currentPiece.shape.length; y++) {
      for (let x = 0; x < tetrisGame.currentPiece.shape[y].length; x++) {
        if (tetrisGame.currentPiece.shape[y][x]) {
          const drawX = (tetrisGame.currentPiece.x + x) * blockSize;
          const drawY = (tetrisGame.currentPiece.y + y) * blockSize;
          ctx.fillRect(drawX, drawY, blockSize - 1, blockSize - 1);
        }
      }
    }
  }
}

function gameOverTetris() {
  tetrisGame.gameRunning = false;
  clearInterval(tetrisGame.intervalId);
  alert('游戏结束！分数: ' + tetrisGame.score);
}
</script>

<style>
/* 游戏页面样式 */
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

/* 确保Live2D在游戏页面透明 */
#live2dcanvas {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.live2d-widget {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* 移除Live2D容器的所有边框和阴影 */
.live2d-widget-container {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

#live2d-widget {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.game-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.game-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.game-icon {
  font-size: 3em;
  margin-block-end: 15px;
}

.game-card h3 {
  margin: 10px 0;
  font-size: 1.5em;
}

.game-card p {
  margin: 0;
  opacity: 0.9;
}

#game-container {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
  margin: 20px 0;
}

#game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 20px;
  padding-block-end: 15px;
  border-block-end: 2px solid #dee2e6;
}

.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.back-btn:hover {
  background: #5a6268;
}

/* 2048游戏样式 */
.game2048 {
  max-inline-size: 500px;
  margin: 0 auto;
  text-align: center;
}

.score-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-block-end: 20px;
}

.score-box {
  background: #bbada0;
  padding: 10px 20px;
  border-radius: 8px;
  color: white;
  min-inline-size: 80px;
}

.score-label {
  font-size: 12px;
  text-transform: uppercase;
  margin-block-end: 5px;
}

.restart-btn, .start-btn {
  background: #8f7a66;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  margin-block-end: 20px;
  transition: background 0.3s;
}

.restart-btn:hover, .start-btn:hover {
  background: #9f8976;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 10px;
  background: #bbada0;
  padding: 10px;
  border-radius: 8px;
  max-inline-size: 320px;
  margin: 0 auto;
}

.grid-cell {
  inline-size: 70px;
  block-size: 70px;
  background: #cdc1b4;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  color: #776e65;
}

.tile-2 { background: #eee4da; color: #776e65; }
.tile-4 { background: #ede0c8; color: #776e65; }
.tile-8 { background: #f2b179; color: #f9f6f2; }
.tile-16 { background: #f59563; color: #f9f6f2; }
.tile-32 { background: #f67c5f; color: #f9f6f2; }
.tile-64 { background: #f65e3b; color: #f9f6f2; }
.tile-128 { background: #edcf72; color: #f9f6f2; font-size: 28px; }
.tile-256 { background: #edcc61; color: #f9f6f2; font-size: 28px; }
.tile-512 { background: #edc850; color: #f9f6f2; font-size: 28px; }
.tile-1024 { background: #edc53f; color: #f9f6f2; font-size: 24px; }
.tile-2048 { background: #edc22e; color: #f9f6f2; font-size: 24px; }

.game-instructions {
  margin-block-start: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
}

/* 跳跃游戏样式 */
.jump-game, .snake-game, .tetris-game {
  text-align: center;
}

canvas {
  border: 2px solid #333;
  background: #87CEEB;
  margin: 20px 0;
}

#snakeCanvas, #tetrisCanvas {
  background: #000;
}

.jump-controls, .snake-controls, .tetris-controls {
  margin-block-start: 20px;
}

.jump-score, .snake-score, .tetris-score, .tetris-level {
  font-size: 18px;
  font-weight: bold;
  margin: 10px;
  display: inline-block;
}

.jump-instructions, .snake-instructions, .tetris-instructions {
  margin-block-start: 15px;
  padding: 10px;
  background: #e9ecef;
  border-radius: 8px;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .games-grid {
    grid-template-columns: 1fr;
  }
  
  .game-card {
    padding: 20px;
  }
  
  .grid-cell {
    inline-size: 60px;
    block-size: 60px;
    font-size: 24px;
  }
  
  canvas {
    max-inline-size: 100%;
    block-size: auto;
  }
  
  #game-header {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
