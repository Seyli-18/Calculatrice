const canvas = document.getElementById("snake");
const ctx = canvas.getContext("2d");
const box = 20;
let direction;
let pseudo = prompt("Entrez votre pseudo :") || "Anonyme";
let score = 0;
let bestScore = parseInt(localStorage.getItem("bestScore_" + pseudo)) || 0;
let vies = 1;
let shield = false;
let snake = [{ x: 9 * box, y: 10 * box }];
let food = randomPosition();
let bonus = randomBonus();
let gameRunning = true;

document.getElementById("pseudo").innerText = pseudo;
document.getElementById("score").innerText = `Score : ${score}`;
document.getElementById("vies").innerText = `Vie : ${vies}`;
document.getElementById("best").innerText = `Best score : ${bestScore}`;

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
});

function randomPosition() {
  return {
    x: Math.floor(Math.random() * 20) * box,
    y: Math.floor(Math.random() * 20) * box
  };
}

function randomBonus() {
  const types = ["life", "shield", "growth"];
  return {
    x: Math.floor(Math.random() * 20) * box,
    y: Math.floor(Math.random() * 20) * box,
    type: types[Math.floor(Math.random() * types.length)]
  };
}

function draw() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Snake
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? (shield ? "blue" : "lime") : "white";
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  // Food
  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, box, box);

  // Bonus
  if (bonus.type === "life") ctx.fillStyle = "pink";
  else if (bonus.type === "shield") ctx.fillStyle = "cyan";
  else ctx.fillStyle = "violet";
  ctx.fillRect(bonus.x, bonus.y, box, box);

  // Move
  let head = { x: snake[0].x, y: snake[0].y };
  if (direction === "LEFT") head.x -= box;
  if (direction === "RIGHT") head.x += box;
  if (direction === "UP") head.y -= box;
  if (direction === "DOWN") head.y += box;

  // Collision
  if (
    head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height ||
    snake.slice(1).some(p => p.x === head.x && p.y === head.y)
  ) {
    if (shield) {
      shield = false;
    } else if (vies > 1) {
      vies--;
    } else {
      return endGame();
    }
  }

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    score++;
    food = randomPosition();
  } else {
    snake.pop();
  }

  // Eat bonus
  if (head.x === bonus.x && head.y === bonus.y) {
    if (bonus.type === "life") vies++;
    else if (bonus.type === "shield") shield = true;
    else if (bonus.type === "growth") {
      for (let i = 0; i < 2; i++) snake.push({ ...snake[snake.length - 1] });
    }
    bonus = randomBonus();
  }

  snake.unshift(head);

  // Update interface
  document.getElementById("score").innerText = `Score : ${score}`;
  document.getElementById("vies").innerText = `Vie : ${vies}`;
}

function endGame() {
  clearInterval(game);
  gameRunning = false;
  document.getElementById("final-score").innerText = `Score : ${score}`;
  document.getElementById("game-over").style.display = "block";

  if (score > bestScore) {
    localStorage.setItem("bestScore_" + pseudo, score);
  }

  // Classement
  const top = JSON.parse(localStorage.getItem("snakeTop10") || "[]");
  top.push({ pseudo, score });
  top.sort((a, b) => b.score - a.score);
  const top10 = top.slice(0, 10);
  localStorage.setItem("snakeTop10", JSON.stringify(top10));
  showTopScores(top10);
}

function showTopScores(top) {
  const list = document.getElementById("classement");
  list.innerHTML = "";
  top.forEach((entry, i) => {
    const li = document.createElement("li");
    li.textContent = `#${i + 1} - ${entry.pseudo} : ${entry.score}`;
    list.appendChild(li);
  });
}

showTopScores(JSON.parse(localStorage.getItem("snakeTop10") || "[]"));
const game = setInterval(draw, 150);
