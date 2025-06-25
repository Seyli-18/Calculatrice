window.addEventListener("keydown", function (e) {
  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (keys.includes(e.key)) {
    e.preventDefault();
  }
}, { passive: false });

window.onload = function () {
  const canvas = document.getElementById("snake");
  const ctx = canvas.getContext("2d");
  const box = 20;

  let score = 0;
  let direction = null;
  let canChangeDirection = true;
  let gameRunning = true;

  let snake = [{ x: 9 * box, y: 10 * box }];

  let food = randomPosition();
  let bonus = randomBonus();

  function randomPosition() {
    return {
      x: Math.floor(Math.random() * 20) * box,
      y: Math.floor(Math.random() * 20) * box
    };
  }

  function randomBonus() {
    const types = ["grow", "double"]; // on ne garde que les utiles
    return {
      x: Math.floor(Math.random() * 20) * box,
      y: Math.floor(Math.random() * 20) * box,
      type: types[Math.floor(Math.random() * types.length)]
    };
  }

  function updateScoreDisplay() {
    document.getElementById("score").innerText = `Score : ${score}`;
  }

  document.addEventListener("keydown", (e) => {
    if (!canChangeDirection || !gameRunning) return;
    canChangeDirection = false;
    if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    else if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
    else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  });

  window.mobileMove = function (dir) {
    if (!canChangeDirection || !gameRunning) return;
    if (
      (dir === "LEFT" && direction !== "RIGHT") ||
      (dir === "RIGHT" && direction !== "LEFT") ||
      (dir === "UP" && direction !== "DOWN") ||
      (dir === "DOWN" && direction !== "UP")
    ) {
      direction = dir;
    }
  };

  function draw() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    for (let part of snake) {
      ctx.fillRect(part.x, part.y, box, box);
    }

    ctx.fillStyle = "green";
    ctx.fillRect(food.x, food.y, box, box);

    ctx.fillStyle = bonus.type === "double" ? "yellow" : "red";
    ctx.fillRect(bonus.x, bonus.y, box, box);

    let head = { x: snake[0].x, y: snake[0].y };
    if (direction === "LEFT") head.x -= box;
    if (direction === "RIGHT") head.x += box;
    if (direction === "UP") head.y -= box;
    if (direction === "DOWN") head.y += box;

    // 💥 Collision = Game Over direct
    if (
      head.x < 0 || head.x >= canvas.width ||
      head.y < 0 || head.y >= canvas.height ||
      snake.slice(1).some(p => p.x === head.x && p.y === head.y)
    ) {
      clearInterval(game);
      gameRunning = false;
      document.getElementById("final-score").innerText = `Score : ${score}`;
      document.getElementById("game-over").style.display = "block";
      return;
    }

    // 🍏 Fruit vert
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      food = randomPosition();
    } else {
      snake.pop();
    }

    // 🍒 Bonus rouge ou jaune
    if (head.x === bonus.x && head.y === bonus.y) {
      score += 2;
      if (bonus.type === "grow") {
        snake.push({ ...snake[snake.length - 1] });
      } else if (bonus.type === "double") {
        for (let i = 0; i < 2; i++) {
          snake.push({ ...snake[snake.length - 1] });
        }
      }
      bonus = randomBonus();
    }

    snake.unshift(head);
    updateScoreDisplay();
    canChangeDirection = true;
  }

  updateScoreDisplay();
  const game = setInterval(draw, 150);
};
