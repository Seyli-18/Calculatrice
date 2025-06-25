const firebaseConfig = {
  apiKey: "AIzaSyCWSSYXHJNXcbFaJn6AapsEARKCTjhzqXs",
  authDomain: "monsitecalculatrice.firebaseapp.com",
  projectId: "monsitecalculatrice"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUser = null;

document.getElementById("connect-google").addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    currentUser = result.user;
    document.getElementById("user-status").innerText = `Connecté en tant que : ${currentUser.displayName || currentUser.email}`;
    afficherAvis();
  } catch {
    alert("Échec de connexion");
  }
});

async function envoyerAvis() {
  const texte = document.getElementById("avis-text").value.trim();
  const note = parseInt(document.getElementById("avis-note").value);

  if (!currentUser) return alert("Connectez-vous avec Google pour poster un avis.");
  if (!texte || texte.length > 500) return alert("Avis vide ou trop long.");

  await db.collection("snake_avis").add({
    pseudo: currentUser.displayName || currentUser.email,
    uid: currentUser.uid,
    texte,
    note,
    date: new Date(),
    likes: 0
  });

  document.getElementById("avis-text").value = "";
  afficherAvis();
}

async function afficherAvis() {
  const container = document.getElementById("liste-avis");
  container.innerHTML = "";
  const snapshot = await db.collection("snake_avis").orderBy("likes", "desc").get();

  snapshot.forEach(doc => {
    const avis = doc.data();
    const div = document.createElement("div");
    div.className = "avis";
    div.innerHTML = `
      <p><strong>${avis.pseudo}</strong> - ${"⭐".repeat(avis.note)}</p>
      <p>${avis.texte}</p>
      <p><small>${new Date(avis.date.toDate()).toLocaleString()}</small></p>
      <p>❤️ ${avis.likes}</p>
    `;
    container.appendChild(div);
  });
}

window.addEventListener("keydown", e => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
    e.preventDefault();
  }
}, { passive: false });

window.onload = function () {
  const canvas = document.getElementById("snake");
  const ctx = canvas.getContext("2d");
  const box = 20;

  let pseudo = prompt("Entrez votre pseudo :")?.trim() || "Anonyme";
  document.getElementById("pseudo").innerText = pseudo;

  let score = 0, bestScore = 0, direction = null, canChangeDirection = true;
  let snake = [{ x: 9 * box, y: 10 * box }];
  let food = randomPosition(), bonus = randomBonus();
  let gameRunning = true, isPaused = false;

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
    document.getElementById("best").innerText = `Best score : ${bestScore}`;
  }

  function draw() {
    if (!gameRunning || isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "green";
    snake.forEach(part => ctx.fillRect(part.x, part.y, box, box));
    ctx.fillStyle = "green";
    ctx.fillRect(food.x, food.y, box, box);
    ctx.fillStyle = bonus.type === "life" ? "red" : bonus.type === "double" ? "yellow" : "green";
    ctx.fillRect(bonus.x, bonus.y, box, box);

    let head = { ...snake[0] };
    if (direction === "LEFT") head.x -= box;
    else if (direction === "RIGHT") head.x += box;
    else if (direction === "UP") head.y -= box;
    else if (direction === "DOWN") head.y += box;

    const collision = head.x < 0 || head.y < 0 || head.x >= canvas.width || head.y >= canvas.height || snake.slice(1).some(p => p.x === head.x && p.y === head.y);
    if (collision) return endGame();

    if (head.x === food.x && head.y === food.y) {
      score++;
      food = randomPosition();
    } else {
      snake.pop();
    }

    if (head.x === bonus.x && head.y === bonus.y) {
      if (bonus.type === "grow") {
        snake.push({ ...snake[snake.length - 1] });
      } else if (bonus.type === "double") {
        for (let i = 0; i < 2; i++) snake.push({ ...snake[snake.length - 1] });
      }
      score += bonus.type === "life" ? 3 : 2;
      bonus = randomBonus();
    }

    snake.unshift(head);
    updateScoreDisplay();
    canChangeDirection = true;
  }

  async function endGame() {
    clearInterval(game);
    gameRunning = false;
    document.getElementById("game-over").style.display = "block";
    document.getElementById("final-score").innerText = `Score : ${score}`;

    await db.collection("snake_scores").add({ pseudo, score, date: new Date() });
    if (score > bestScore) bestScore = score;
    updateScoreDisplay();
    afficherTopScores();
  }

  function restartGame() {
    document.getElementById("game-over").style.display = "none";
    score = 0;
    direction = null;
    snake = [{ x: 9 * box, y: 10 * box }];
    food = randomPosition();
    bonus = randomBonus();
    gameRunning = true;
    isPaused = false;
    updateScoreDisplay();
    clearInterval(game);
    game = setInterval(draw, 150);
  }

  async function afficherTopScores() {
    const list = document.getElementById("classement");
    list.innerHTML = "";
    const snapshot = await db.collection("snake_scores").orderBy("score", "desc").limit(10).get();
    snapshot.forEach((doc, i) => {
      const d = doc.data();
      const li = document.createElement("li");
      li.textContent = `#${i + 1} - ${d.pseudo} : ${d.score}`;
      list.appendChild(li);
    });
  }

  document.getElementById("rejouer-btn").onclick = restartGame;
  document.getElementById("pause-btn").onclick = () => {
    isPaused = !isPaused;
    document.getElementById("pause-btn").innerText = isPaused ? "▶️ Reprendre" : "⏸ Pause";
  };

  afficherAvis();
  afficherTopScores();
  const game = setInterval(draw, 150);
};
