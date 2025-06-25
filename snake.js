const firebaseConfig = {
  apiKey: "AIzaSyCWSSYXHJNXcbFaJn6AapsEARKCTjhzqXs",
  authDomain: "monsitecalculatrice.firebaseapp.com",
  projectId: "monsitecalculatrice"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let game, isPaused = false, isTeleporting = false;

// ✅ Bloque le scroll de page avec les flèches, même si la page est focus
window.addEventListener("keydown", function (e) {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
  }
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
  let vies = 1;
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
    const types = ["life", "grow", "double"];
    return {
      x: Math.floor(Math.random() * 20) * box,
      y: Math.floor(Math.random() * 20) * box,
      type: types[Math.floor(Math.random() * types.length)]
    };
  }

  function updateScoreDisplay() {
    document.getElementById("score").innerText = `Score : ${score}`;
    document.getElementById("vies").innerText = `Vie : ${vies}`;
    document.getElementById("best").innerText = `Best score : ${bestScore}`;
  }

  // ✅ Bloque défilement de page au clavier
  window.addEventListener("keydown", function (e) {
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (keys.includes(e.key)) e.preventDefault();
  }, { passive: false });

  document.addEventListener("keydown", (e) => {
    if (!canChangeDirection || isPaused) return;
    canChangeDirection = false;
    if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    else if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
    else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  });

  window.mobileMove = function (dir) {
    if (!canChangeDirection || isPaused) return;
    canChangeDirection = false;
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
    if (!gameRunning || isPaused || isTeleporting) return;

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

    if (!isTeleporting && hasCollision) {
      if (vies > 1) {
        vies--;
        direction = null;
        isTeleporting = true;
        clearInterval(game);

        const dx = 9 * box - snake[0].x;
        const dy = 10 * box - snake[0].y;
        snake = snake.map(part => ({
          x: part.x + dx,
          y: part.y + dy
        }));

        food = randomPosition();
        bonus = randomBonus();
        updateScoreDisplay();

        setTimeout(() => {
          isTeleporting = false;
          game = setInterval(draw, 150);
        }, 300);

        return;
      } else {
        return endGame();
      }
    }

    if (head.x === food.x && head.y === food.y) {
      score++;
      food = randomPosition();
    } else {
      snake.pop();
    }

    if (head.x === bonus.x && head.y === bonus.y) {
      if (bonus.type === "life") {
        vies++;
      } else if (bonus.type === "grow") {
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

    const snapshot = await db.collection("snake_scores")
      .orderBy("score", "desc")
      .limit(10)
      .get();

    snapshot.forEach((doc, i) => {
      const data = doc.data();
      const li = document.createElement("li");
      li.textContent = `#${i + 1} - ${data.pseudo} : ${data.score}`;
      list.appendChild(li);
    });
  }

  document.getElementById("rejouer-btn").addEventListener("click", () => {
    document.getElementById("game-over").style.display = "none";
    snake = [{ x: 9 * box, y: 10 * box }];
    food = randomPosition();
    bonus = randomBonus();
    score = 0;
    vies = 1;
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
