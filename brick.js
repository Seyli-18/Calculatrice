const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 75;
const paddleHeight = 10;
let paddleX = (canvas.width - paddleWidth) / 2;

let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

const ballRadius = 8;
let score = 0;

const music = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
music.loop = true;
music.volume = 0.2;
music.play();

const brickSound = new Audio("https://freesound.org/data/previews/26/26892_512123-lq.mp3");

let rightPressed = false;
let leftPressed = false;

let brickRowCount = 3;
const brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let bricks = [];
function generateBricks(rows = brickRowCount) {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < rows; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }
}
generateBricks();

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}

// Contrôle tactile
let isDragging = false;
canvas.addEventListener("touchstart", (e) => {
  isDragging = true;
});
canvas.addEventListener("touchmove", (e) => {
  if (isDragging) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    if (relativeX > 0 && relativeX < canvas.width) {
      paddleX = relativeX - paddleWidth / 2;
    }
  }
});
canvas.addEventListener("touchend", () => isDragging = false);

function collisionDetection() {
  let bricksLeft = 0;
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        bricksLeft++;
        if (
          x > b.x && x < b.x + brickWidth &&
          y > b.y && y < b.y + brickHeight
        ) {
          dy = -dy;
          b.status = 0;
          score++;
          document.getElementById("score").textContent = `Score : ${score}`;
          brickSound.currentTime = 0;
          brickSound.play();
        }
      }
    }
  }

  // Tous les bricks détruits ? Crée un niveau supplémentaire
  if (bricksLeft === 0) {
    brickRowCount++;
    generateBricks(brickRowCount);
    y = canvas.height - 30;
    x = canvas.width / 2;
    dx = 2;
    dy = -2;
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#f39c12";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#3498db";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;

        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = "#e74c3c";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
  if (y + dy < ballRadius) dy = -dy;
  else if (y + dy > canvas.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      document.getElementById("game-over").style.display = "block";
      return;
    }
  }

  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 5;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= 5;
  }

  x += dx;
  y += dy;
  requestAnimationFrame(draw);
}

draw();
