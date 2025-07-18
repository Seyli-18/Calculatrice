// 🔧 Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCWSSYXHJNXcbFaJn6AapsEARKCTjhzqXs",
  authDomain: "monsitecalculatrice.firebaseapp.com",
  projectId: "monsitecalculatrice"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let utilisateur = null;
let pseudo = "";
let bestScore = 0;
let score = 0;
let bricksColor = "#e74c3c";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 75;
const paddleHeight = 10;
let paddleX = (canvas.width - paddleWidth) / 2;

let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 1.8;
let dy = -1.8;
const ballRadius = 8;

let rightPressed = false;
let leftPressed = false;

let brickRowCount = 3;
const brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

const colors = ["#e74c3c", "#f39c12", "#2ecc71", "#9b59b6", "#1abc9c"];
const sound = new Audio("https://cdn.pixabay.com/audio/2021/08/04/audio_36ebfa9108.mp3");

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

// 🎮 Contrôles clavier
document.addEventListener("keydown", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
});

// 📱 Contrôles mobiles améliorés
let mobileInterval = null;

function startMove(direction) {
  if (mobileInterval) return;
  if (direction === "left") leftPressed = true;
  if (direction === "right") rightPressed = true;
  mobileInterval = setInterval(() => {
    if (direction === "left") leftPressed = true;
    if (direction === "right") rightPressed = true;
  }, 100);
}

function stopMove() {
  clearInterval(mobileInterval);
  leftPressed = false;
  rightPressed = false;
  mobileInterval = null;
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#f1c40f";
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
        ctx.fillStyle = bricksColor;
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function collisionDetection() {
  let bricksLeft = 0;
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        bricksLeft++;
        if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
          dy = -dy;
          b.status = 0;
          score++;
          document.getElementById("score").textContent = `Score : ${score}`;
          sound.currentTime = 0;
          sound.play();
        }
      }
    }
  }

  if (bricksLeft === 0 || y < 10) {
    bricksColor = colors[Math.floor(Math.random() * colors.length)];
    brickRowCount++;
    generateBricks(brickRowCount);
    y = canvas.height - 30;
    x = canvas.width / 2;
    dx = 1.8;
    dy = -1.8;
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
      endGame();
      return;
    }
  }

  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 4;
  else if (leftPressed && paddleX > 0) paddleX -= 4;

  x += dx;
  y += dy;
  requestAnimationFrame(draw);
}

async function endGame() {
  document.getElementById("final-score").textContent = `Score : ${score}`;
  document.getElementById("game-over").style.display = "block";

  await db.collection("brick_scores").add({ pseudo, score, date: new Date() });

  if (score > bestScore) {
    bestScore = score;
    document.getElementById("best").textContent = `Best score : ${bestScore}`;
    localStorage.setItem(`brick_best_${pseudo}`, bestScore);
  }

  afficherTopScores();
}

async function getBestScore() {
  const local = parseInt(localStorage.getItem(`brick_best_${pseudo}`));
  if (!isNaN(local)) {
    bestScore = local;
    document.getElementById("best").textContent = `Best score : ${bestScore}`;
  }

  const snap = await db.collection("brick_scores")
    .where("pseudo", "==", pseudo)
    .orderBy("score", "desc")
    .limit(1)
    .get();

  if (!snap.empty) {
    const scoreDB = snap.docs[0].data().score;
    if (scoreDB > bestScore) {
      bestScore = scoreDB;
      document.getElementById("best").textContent = `Best score : ${bestScore}`;
      localStorage.setItem(`brick_best_${pseudo}`, bestScore);
    }
  }
}

async function afficherTopScores() {
  const list = document.getElementById("classement");
  list.innerHTML = "";

  const snap = await db.collection("brick_scores").get();
  const meilleurs = new Map();

  snap.forEach(doc => {
    const d = doc.data();
    if (!meilleurs.has(d.pseudo) || d.score > meilleurs.get(d.pseudo)) {
      meilleurs.set(d.pseudo, d.score);
    }
  });

  Array.from(meilleurs.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([p, s], i) => {
      const li = document.createElement("li");
      li.textContent = `#${i + 1} - ${p} : ${s}`;
      list.appendChild(li);
    });
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

// Avis
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

  if (!texte || texte.length > 500) {
    alert("Votre avis doit faire entre 1 et 500 caractères.");
    return;
  }

  const now = new Date();
  const ref = db.collection("brick_avis")
    .where("userId", "==", utilisateur.uid)
    .orderBy("date", "desc")
    .limit(1);
  const snap = await ref.get();
  if (!snap.empty) {
    const dernier = snap.docs[0].data().date.toDate();
    const diffMs = now - dernier;
    if (diffMs < 3600000) {
      const m = Math.ceil((3600000 - diffMs) / 60000);
      msg.innerText = `⏳ Attendez ${m} minute(s) avant de poster un nouvel avis.`;
      return;
    }
  }

  await db.collection("brick_avis").add({
    texte, note, likes: 0, date: now,
    userId: utilisateur.uid,
    userName: utilisateur.displayName || utilisateur.email,
    userEmail: utilisateur.email,
    userPhoto: utilisateur.photoURL || ""
  });

  document.getElementById("avis-text").value = "";
  msg.innerText = "✅ Avis posté avec succès.";
}

function afficherAvis() {
  const container = document.getElementById("liste-avis");
  db.collection("brick_avis").orderBy("likes", "desc").onSnapshot((snapshot) => {
    container.innerHTML = "<h2>📣 Avis des joueurs</h2>";
    snapshot.forEach((docSnap) => {
      const avis = docSnap.data();
      const date = avis.date.toDate();
      const div = document.createElement("div");
      div.className = "avis";
      div.innerHTML = `
        <div class="avis-header">
          ${avis.userPhoto ? `<img src="${avis.userPhoto}" alt="profil">` : ""}
          <strong>${avis.userName || avis.userEmail}</strong>
        </div>
        <div>${"⭐".repeat(avis.note)}</div>
        <p>${avis.texte}</p>
        <p><small>Posté le ${date.toLocaleDateString()} à ${date.toLocaleTimeString()}</small></p>
        <button class="like-btn" onclick="likerAvis('${docSnap.id}')">❤️ ${avis.likes || 0}</button>
      `;
      container.appendChild(div);
    });
  });
}

async function likerAvis(id) {
  if (!utilisateur) {
    alert("Veuillez vous connecter pour liker un avis.");
    return;
  }

  const likeRef = db.collection("brick_avis").doc(id).collection("likes").doc(utilisateur.uid);
  const snapshot = await likeRef.get();

  if (snapshot.exists) {
    alert("Vous avez déjà liké cet avis.");
    return;
  }

  await likeRef.set({ liked: true });
  await db.collection("brick_avis").doc(id).update({
    likes: firebase.firestore.FieldValue.increment(1)
  });
}

window.likerAvis = likerAvis;

// ▶️ Démarrage
window.onload = () => {
  do {
    pseudo = prompt("Entrez votre pseudo :")?.trim();
  } while (!pseudo);

  document.getElementById("pseudo").textContent = `Joueur : ${pseudo}`;
  generateBricks();
  getBestScore();
  afficherTopScores();
  afficherAvis();

  // Masquer les boutons tactiles sur PC
  if (window.innerWidth > 768) {
    const controls = document.getElementById("touch-controls");
    if (controls) controls.style.display = "none";
  }

  draw();
};

document.getElementById("rejouer-btn").addEventListener("click", () => {
  resetGame(); // fonction déjà présente à la fin de ton script
});

function resetGame() {
  score = 0;
  brickRowCount = 3;
  generateBricks();
  x = canvas.width / 2;
  y = canvas.height - 30;
  dx = 1.8;
  dy = -1.8;
  paddleX = (canvas.width - paddleWidth) / 2;
  document.getElementById("score").textContent = "Score : 0";
  document.getElementById("game-over").style.display = "none";
  draw();
}

