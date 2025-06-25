const firebaseConfig = {
  apiKey: "AIzaSyCWSSYXHJNXcbFaJn6AapsEARKCTjhzqXs",
  authDomain: "monsitecalculatrice.firebaseapp.com",
  projectId: "monsitecalculatrice"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let game, isPaused = false;

window.addEventListener("keydown", function (e) {
  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (keys.includes(e.key)) e.preventDefault();
}, { passive: false });

window.onload = function () {
  const canvas = document.getElementById("snake");
  const ctx = canvas.getContext("2d");
  const box = 20;

  const audio = new Audio("https://cdn.pixabay.com/download/audio/2023/06/10/audio_0ef8e7bfb7.mp3?filename=arcade-loop-146245.mp3");
  audio.loop = true;
  audio.volume = 0.2;
  audio.play();

  let pseudo;
  do {
    pseudo = prompt("Entrez votre pseudo :")?.trim();
  } while (!pseudo);
  document.getElementById("pseudo").innerText = pseudo;

  let score = 0;
  let bestScore = 0;
  let direction = null;
  let canChangeDirection = true;
  let gameRunning = true;
  let snake = [{ x: 9 * box, y: 10 * box }];
  let greenCount = 0, yellowCount = 0, redCount = 0;

  function randomPosition() {
    const max = Math.floor(canvas.width / box);
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * max) * box,
        y: Math.floor(Math.random() * max) * box
      };
    } while (snake.some(part => part.x === pos.x && part.y === pos.y));
    return pos;
  }

  let food = randomPosition();
  let bonus = randomBonus();

  function randomBonus() {
    const types = ["life", "grow", "double"];
    let pos = randomPosition();
    return {
      x: pos.x,
      y: pos.y,
      type: types[Math.floor(Math.random() * types.length)]
    };
  }

  function updateScoreDisplay() {
    document.getElementById("score").innerText = `Score : ${score}`;
    document.getElementById("best").innerText = `Best score : ${bestScore}`;
    document.getElementById("green-count").innerText = greenCount;
    document.getElementById("yellow-count").innerText = yellowCount;
    document.getElementById("red-count").innerText = redCount;
  }

  document.addEventListener("keydown", (e) => {
    if (!canChangeDirection || isPaused) return;

    // Pause avec Espace
    if (e.code === "Space") {
      isPaused = !isPaused;
      document.getElementById("pause-btn").innerText = isPaused ? "▶️ Reprendre" : "⏸ Pause";
      return;
    }

    // Reprise avec Entrée
    if (e.code === "Enter" && isPaused) {
      isPaused = false;
      document.getElementById("pause-btn").innerText = "⏸ Pause";
      return;
    }

    canChangeDirection = false;
    if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    else if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
    else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  });

  window.mobileMove = function (dir) {
    if (!canChangeDirection || isPaused) return;
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
    if (!gameRunning || isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    for (let part of snake) {
      ctx.fillRect(part.x, part.y, box, box);
    }

    ctx.fillStyle = "green";
    ctx.fillRect(food.x, food.y, box, box);

    ctx.fillStyle =
      bonus.type === "life" ? "red" : bonus.type === "double" ? "yellow" : "green";
    ctx.fillRect(bonus.x, bonus.y, box, box);

    let head = { x: snake[0].x, y: snake[0].y };
    if (direction === "LEFT") head.x -= box;
    if (direction === "RIGHT") head.x += box;
    if (direction === "UP") head.y -= box;
    if (direction === "DOWN") head.y += box;

    const hasCollision =
      head.x < 0 || head.x >= canvas.width ||
      head.y < 0 || head.y >= canvas.height ||
      snake.slice(1).some(p => p.x === head.x && p.y === head.y);

    if (hasCollision) {
      return endGame();
    }

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      greenCount++;
      food = randomPosition();
    } else {
      snake.pop();
    }

    if (head.x === bonus.x && head.y === bonus.y) {
      if (bonus.type === "life") {
        score += 3;
        redCount++;
      } else if (bonus.type === "grow") {
        score += 2;
        yellowCount++;
        snake.push({ ...snake[snake.length - 1] });
      } else if (bonus.type === "double") {
        score += 2;
        yellowCount++;
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

  async function endGame() {
    clearInterval(game);
    gameRunning = false;
    document.getElementById("final-score").innerText = `Score : ${score}`;
    document.getElementById("game-over").style.display = "block";

    await db.collection("snake_scores").add({
      pseudo,
      score,
      date: new Date()
    });

    afficherTopScores();
  }

  async function afficherTopScores() {
    const list = document.getElementById("classement");
    list.innerHTML = "";

    const snapshot = await db.collection("snake_scores").get();

    const scoresByPseudo = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!scoresByPseudo[data.pseudo] || data.score > scoresByPseudo[data.pseudo]) {
        scoresByPseudo[data.pseudo] = data.score;
      }
    });

    const topScores = Object.entries(scoresByPseudo)
      .map(([pseudo, score]) => ({ pseudo, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    topScores.forEach((entry, i) => {
      const li = document.createElement("li");
      li.textContent = `#${i + 1} - ${entry.pseudo} : ${entry.score}`;
      list.appendChild(li);
    });
  }

  document.getElementById("rejouer-btn").addEventListener("click", () => {
    document.getElementById("game-over").style.display = "none";
    snake = [{ x: 9 * box, y: 10 * box }];
    food = randomPosition();
    bonus = randomBonus();
    score = 0;
    greenCount = 0;
    yellowCount = 0;
    redCount = 0;
    direction = null;
    gameRunning = true;
    updateScoreDisplay();
    afficherTopScores();
    clearInterval(game);
    game = setInterval(draw, 150);
  });

  document.getElementById("pause-btn").addEventListener("click", () => {
    isPaused = !isPaused;
    document.getElementById("pause-btn").innerText = isPaused ? "▶️ Reprendre" : "⏸ Pause";
  });

  afficherTopScores();
  game = setInterval(draw, 150);
};
