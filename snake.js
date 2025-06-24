window.addEventListener("keydown", function (e) {
  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (keys.includes(e.key)) e.preventDefault();
}, { passive: false });

window.onload = function () {
  const canvas = document.getElementById("snake");
  const ctx = canvas.getContext("2d");
  const box = 20;
  let score = 0;

  let snake = [{ x: 9 * box, y: 10 * box }];
  let direction = null;

  let food = {
    x: Math.floor(Math.random() * 20) * box,
    y: Math.floor(Math.random() * 20) * box
  };

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    for (let part of snake) {
      ctx.fillRect(part.x, part.y, box, box);
    }

    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, box, box);

    let head = { x: snake[0].x, y: snake[0].y };
    if (direction === "LEFT") head.x -= box;
    if (direction === "RIGHT") head.x += box;
    if (direction === "UP") head.y -= box;
    if (direction === "DOWN") head.y += box;

    if (
      head.x < 0 || head.x >= canvas.width ||
      head.y < 0 || head.y >= canvas.height ||
      snake.some((s, i) => i !== 0 && s.x === head.x && s.y === head.y)
    ) {
      clearInterval(game);
      document.getElementById("final-score").innerText = `Score : ${score}`;
      document.getElementById("game-over").style.display = "block";
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score++;
      document.getElementById("score").innerText = `Score : ${score}`;
      food = {
        x: Math.floor(Math.random() * 20) * box,
        y: Math.floor(Math.random() * 20) * box
      };
    } else {
      snake.pop();
    }
  }

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
    if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  });

  window.mobileMove = function (dir) {
    if (
      (dir === "LEFT" && direction !== "RIGHT") ||
      (dir === "RIGHT" && direction !== "LEFT") ||
      (dir === "UP" && direction !== "DOWN") ||
      (dir === "DOWN" && direction !== "UP")
    ) {
      direction = dir;
    }
  };

  let game = setInterval(draw, 150);
};
