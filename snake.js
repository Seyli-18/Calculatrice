// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCWSSYXHJNXcbFaJn6AapsEARKCTjhzqXs",
  authDomain: "monsitecalculatrice.firebaseapp.com",
  projectId: "monsitecalculatrice"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let utilisateur = null;
let expression = "";

let game, isPaused = false, gameRunning = true;

window.addEventListener("keydown", function (e) {
  const preventKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"];
  if (preventKeys.includes(e.code)) e.preventDefault();
}, { passive: false });

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
      if (!gameRunning) {
        restartGame();
      } else if (isPaused) {
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
    if (isPaused) return;
    const opposites = { LEFT: "RIGHT", RIGHT: "LEFT", UP: "DOWN", DOWN: "UP" };
    if (direction !== opposites[dir]) {
      direction = dir;
      canChangeDirection = false;
    }
  };

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
    score = 0; greenCount = 0; yellowCount = 0; redCount = 0;
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

  document.getElementById("rejouer-btn").addEventListener("click", restartGame);

  document.getElementById("pause-btn").addEventListener("click", () => {
    isPaused = !isPaused;
    document.getElementById("pause-btn").innerText = isPaused ? "▶️ Reprendre" : "⏸ Pause";
  });

  afficherTopScores();
  game = setInterval(draw, 150);
};

async function getBestScoreForPseudo(pseudo) {
  try {
    const snapshot = await db.collection("snake_scores")
      .where("pseudo", "==", pseudo)
      .orderBy("score", "desc")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      document.getElementById("best").innerText = `Best score : ${data.score}`;
      return data.score;
    } else {
      document.getElementById("best").innerText = `Best score : 0`;
      return 0;
    }
  } catch (e) {
    console.error("Erreur best score :", e.message);
    document.getElementById("best").innerText = `Best score : 0`;
    return 0;
  }
}

// Auth Google
document.getElementById("login-btn").addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (error) {
    alert("Erreur de connexion : " + error.message);
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await auth.signOut();
});

auth.onAuthStateChanged((user) => {
  utilisateur = user;
  document.getElementById("login-btn").style.display = user ? "none" : "inline-block";
  document.getElementById("logout-btn").style.display = user ? "inline-block" : "none";
  document.getElementById("utilisateur-connecte").innerText = user
    ? `Connecté en tant que : ${user.displayName || user.email}`
    : "";
});

// Envoyer un avis
document.getElementById("envoyer-btn").addEventListener("click", envoyerAvis);

async function envoyerAvis() {
  const msg = document.getElementById("attente-msg");
  msg.innerText = "";

  if (!utilisateur) {
    alert("Veuillez vous connecter pour publier un avis.");
    return;
  }

  const texte = document.getElementById("avis-text").value.trim();
  const note = parseInt(document.getElementById("etoiles").value);

  if (!texte || texte.length > 350) {
    alert("Votre avis doit faire entre 1 et 350 caractères.");
    return;
  }

 const now = new Date();

  // Vérifie délai 1h
  const ref = db.collection("avis")
    .where("userId", "==", utilisateur.uid)
    .orderBy("date", "desc")
    .limit(1);

  const snap = await ref.get();
  if (!snap.empty) {
    const dernier = snap.docs[0].data().date.toDate();
    const diffMs = now - dernier;
    if (diffMs < 3600000) {
      const minutesRestantes = Math.ceil((3600000 - diffMs) / 60000);
      msg.innerText = `⏳ Vous devez attendre ${minutesRestantes} minute(s) avant de poster un nouvel avis.`;
      return;
    }
  }

  const user = auth.currentUser;
  await db.collection("avis").add({
    texte,
    note,
    likes: 0,
    date: now,
    userId: user.uid,
    userName: user.displayName || user.email,
    userEmail: user.email,
    userPhoto: user.photoURL || ""
  });

  document.getElementById("avis-text").value = "";
  msg.innerText = "✅ Avis posté avec succès.";
}

// Afficher les avis
function afficherAvis() {
  const container = document.getElementById("liste-avis");

  db.collection("avis").orderBy("likes", "desc").onSnapshot((snapshot) => {
    container.innerHTML = "<h2>📣 Avis des utilisateurs</h2>";
    snapshot.forEach((docSnap) => {
      const avis = docSnap.data();
      const date = avis.date.toDate();
      const dateStr = date.toLocaleDateString();
      const heureStr = date.toLocaleTimeString();

      const nom = avis.userName || avis.userEmail || "Utilisateur inconnu";
      const photo = avis.userPhoto || "";

      const div = document.createElement("div");
      div.className = "avis";
      div.innerHTML = `
        <div class="avis-header">
          ${photo ? `<img src="${photo}" alt="profil">` : ""}
          <strong>${nom}</strong>
        </div>
        <div>${"⭐".repeat(avis.note)}</div>
        <p>${avis.texte}</p>
        <p><small>Posté le ${dateStr} à ${heureStr}</small></p>
        <button class="like-btn" onclick="likerAvis('${docSnap.id}')">❤️ ${avis.likes || 0}</button>
      `;
      container.appendChild(div);
    });
  });
}

// Like
async function likerAvis(id) {
  if (!utilisateur) {
    alert("Veuillez vous connecter pour liker un avis.");
    return;
  }

  const likeRef = db.collection("avis").doc(id).collection("likes").doc(utilisateur.uid);
  const snapshot = await likeRef.get();

  if (snapshot.exists) {
    alert("Vous avez déjà liké cet avis.");
    return;
  }

  await likeRef.set({ liked: true });
  await db.collection("avis").doc(id).update({
    likes: firebase.firestore.FieldValue.increment(1)
  });
}

// Rendre global
window.ajouterChiffre = ajouterChiffre;
window.ajouterOperateur = ajouterOperateur;
window.calculer = calculer;
window.effacer = effacer;
window.afficherAvis = afficherAvis;
window.likerAvis = likerAvis;

// Démarrer
window.onload = afficherAvis;



