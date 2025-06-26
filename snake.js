const firebaseConfig = {
  apiKey: "AIzaSyCWSSYXHJNXcbFaJn6AapsEARKCTjhzqXs",
  authDomain: "monsitecalculatrice.firebaseapp.com",
  projectId: "monsitecalculatrice"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let utilisateur = null;
let game, isPaused = false, gameRunning = true;

window.addEventListener("keydown", function (e) {
  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"];
  if (keys.includes(e.code)) e.preventDefault();
}, { passive: false });

auth.onAuthStateChanged((user) => {
  utilisateur = user;
  document.getElementById("login-btn").style.display = user ? "none" : "inline-block";
  document.getElementById("logout-btn").style.display = user ? "inline-block" : "none";
  document.getElementById("utilisateur-connecte").innerText =
    user ? `Connecté en tant que : ${user.displayName || user.email}` : "";
});

document.getElementById("login-btn").addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (error) {
    alert("Erreur de connexion Google.");
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  auth.signOut();
});

window.onload = async function () {
  const canvas = document.getElementById("snake");
  const ctx = canvas.getContext("2d");
  const box = 20;

  const audio = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
  audio.loop = true;
  audio.volume = 0.2;
  audio.play();

  if (window.innerWidth > 768) {
    const controls = document.querySelector(".touch-controls");
    if (controls) controls.style.display = "none";
  }

  let pseudo;
  do {
    pseudo = prompt("Entrez votre pseudo :")?.trim();
  } while (!pseudo);
  document.getElementById("pseudo").innerText = pseudo;

  let bestScore = await getBestScoreForPseudo(pseudo);
  let score = 0, direction = null;
  let canChangeDirection = true;
  let snake = [{ x: 9 * box, y: 10 * box }];
  let greenCount = 0, yellowCount = 0, redCount = 0;

  let food = randomPosition();
  let bonus = randomBonus();

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

  function randomBonus() {
    const types = ["life", "grow", "double"];
    const pos = randomPosition();
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

  function draw() {
    if (!gameRunning || isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "green";
    for (let part of snake) ctx.fillRect(part.x, part.y, box, box);

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

    const collision =
      head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height ||
      snake.slice(1).some(p => p.x === head.x && p.y === head.y);

    if (collision) return endGame();

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      greenCount++;
      food = randomPosition();
    } else {
      snake.pop();
    }

    if (head.x === bonus.x && head.y === bonus.y) {
      if (bonus.type === "life") {
        score += 3; redCount++;
      } else if (bonus.type === "grow") {
        score += 2; yellowCount++;
        snake.push({ ...snake[snake.length - 1] });
      } else if (bonus.type === "double") {
        score += 2; yellowCount++;
        for (let i = 0; i < 2; i++) snake.push({ ...snake[snake.length - 1] });
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
    document.getElementById("game-over").style.display = "block";
    document.getElementById("final-score").innerText = `Score : ${score}`;

    await db.collection("snake_scores").add({ pseudo, score, date: new Date() });

    if (score > bestScore) {
      bestScore = score;
      document.getElementById("best").innerText = `Best score : ${bestScore}`;
    }

    afficherTopScores();
  }

  function restartGame() {
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
    isPaused = false;
    updateScoreDisplay();
    afficherTopScores();
    clearInterval(game);
    game = setInterval(draw, 150);
  }

  async function afficherTopScores() {
    const list = document.getElementById("classement");
    list.innerHTML = "";

    const snapshot = await db.collection("snake_scores").get();
    const scores = {};
    snapshot.forEach(doc => {
      const d = doc.data();
      if (!scores[d.pseudo] || d.score > scores[d.pseudo]) scores[d.pseudo] = d.score;
    });

    Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([pseudo, score], i) => {
        const li = document.createElement("li");
        li.textContent = `#${i + 1} - ${pseudo} : ${score}`;
        list.appendChild(li);
      });
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (gameRunning) {
        isPaused = !isPaused;
        document.getElementById("pause-btn").innerText = isPaused ? "▶️ Reprendre" : "⏸ Pause";
      }
      return;
    }

    if (e.code === "Enter") {
      if (!gameRunning) restartGame();
      else if (isPaused) {
        isPaused = false;
        document.getElementById("pause-btn").innerText = "⏸ Pause";
      }
      return;
    }

    if (!canChangeDirection || isPaused) return;
    canChangeDirection = false;

    if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    else if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
    else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  });

  window.mobileMove = function (dir) {
    if (!gameRunning || isPaused) return;
    const opposites = { LEFT: "RIGHT", RIGHT: "LEFT", UP: "DOWN", DOWN: "UP" };
    if (direction !== opposites[dir]) {
      direction = dir;
      canChangeDirection = false;
    }
  };

  document.getElementById("rejouer-btn").addEventListener("click", restartGame);
  document.getElementById("pause-btn").addEventListener("click", () => {
    isPaused = !isPaused;
    document.getElementById("pause-btn").innerText = isPaused ? "▶️ Reprendre" : "⏸ Pause";
  });

  afficherTopScores();
  afficherAvis();
  game = setInterval(draw, 150);
};

async function getBestScoreForPseudo(pseudo) {
  const snap = await db.collection("snake_scores")
    .where("pseudo", "==", pseudo)
    .orderBy("score", "desc")
    .limit(1)
    .get();

  if (!snap.empty) return snap.docs[0].data().score;
  return 0;
}

// === AVIS ===
async function envoyerAvis() {
  const msg = document.getElementById("attente-msg");
  msg.innerText = "";

  if (!utilisateur) return alert("Connectez-vous pour publier un avis.");

  const texte = document.getElementById("avis-text").value.trim();
  const note = parseInt(document.getElementById("etoiles").value);

  if (!texte || texte.length > 500) return alert("Max 500 caractères.");

  const lastSnap = await db.collection("snake_avis")
    .where("uid", "==", utilisateur.uid)
    .orderBy("date", "desc")
    .limit(1)
    .get();

  if (!lastSnap.empty) {
    const lastDate = lastSnap.docs[0].data().date.toDate();
    const diff = new Date() - lastDate;
    if (diff < 3600000) {
      const mins = Math.ceil((3600000 - diff) / 60000);
      msg.innerText = `⏳ Attendez ${mins} min avant un nouvel avis.`;
      return;
    }
  }

  await db.collection("snake_avis").add({
    uid: utilisateur.uid,
    pseudo: utilisateur.displayName || utilisateur.email,
    photo: utilisateur.photoURL,
    texte,
    note,
    likes: 0,
    date: new Date()
  });

  document.getElementById("avis-text").value = "";
  afficherAvis();
}

async function afficherAvis() {
  const container = document.getElementById("liste-avis");
  container.innerHTML = "";

  const snapshot = await db.collection("snake_avis")
    .orderBy("likes", "desc").get();

  snapshot.forEach(doc => {
    const avis = doc.data();
    const date = avis.date?.toDate?.() || new Date();

    const div = document.createElement("div");
    div.className = "avis";

    div.innerHTML = `
      <div class="avis-header">
        ${avis.photo ? `<img src="${avis.photo}" alt="profil">` : ""}
        <strong>${avis.pseudo}</strong>
      </div>
      <div>${"⭐".repeat(avis.note)}</div>
      <p>${avis.texte}</p>
      <p><small>Posté le ${date.toLocaleDateString()} à ${date.toLocaleTimeString()}</small></p>
      <button class="like-btn" onclick="likerAvis('${doc.id}')">❤️ ${avis.likes || 0}</button>
    `;
    container.appendChild(div);
  });
}

async function likerAvis(id) {
  if (!utilisateur) return alert("Connectez-vous pour liker.");

  const likeRef = db.collection("snake_avis").doc(id).collection("likes").doc(utilisateur.uid);
  const snap = await likeRef.get();
  if (snap.exists) return alert("Déjà liké !");

  await likeRef.set({ liked: true });
  await db.collection("snake_avis").doc(id).update({
    likes: firebase.firestore.FieldValue.increment(1)
  });
}

document.getElementById("envoyer-btn").addEventListener("click", envoyerAvis);
