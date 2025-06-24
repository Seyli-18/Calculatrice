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

// Calculatrice
function ajouterChiffre(chiffre) {
  expression += chiffre;
  document.getElementById("affichage").value = expression;
}

function ajouterOperateur(op) {
  if (expression !== "" && !/[+\-*/]$/.test(expression)) {
    expression += op;
    document.getElementById("affichage").value = expression;
  }
}

function calculer() {
  try {
    expression = eval(expression).toString();
    document.getElementById("affichage").value = expression;
  } catch {
    document.getElementById("affichage").value = "Erreur";
    expression = "";
  }
}

function effacer() {
  expression = "";
  document.getElementById("affichage").value = "";
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

document.getElementById("envoyer-btn").addEventListener("click", envoyerAvis);

// Poster un avis
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

  // Vérifie le délai de 1h depuis le dernier avis
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
      msg.innerText = `⏳ Vous devez attendre ${minutesRestantes} minute(s) avant de pouvoir poster un nouvel avis.`;
      return;
    }
  }

  // Publie l'avis avec les infos utilisateur complètes
  await db.collection("avis").add({
    texte,
    note,
    likes: 0,
    date: now,
    userId: utilisateur.uid,
    userName: utilisateur.displayName || utilisateur.email,
    userEmail: utilisateur.email,
    userPhoto: utilisateur.photoURL || ""
  });

  document.getElementById("avis-text").value = "";
  msg.innerText = "✅ Avis posté avec succès.";
}

// Affichage des avis
function afficherAvis() {
  const container = document.getElementById("liste-avis");

  db.collection("avis").orderBy("date", "desc").onSnapshot((snapshot) => {
    container.innerHTML = "<h2>📣 Avis des utilisateurs</h2>";
    snapshot.forEach((docSnap) => {
      const avis = docSnap.data();
      const date = avis.date.toDate();
      const dateStr = date.toLocaleDateString();
      const heureStr = date.toLocaleTimeString();

      const div = document.createElement("div");
      div.className = "avis";
      div.innerHTML = `
        <div class="avis-header">
          ${avis.userPhoto ? `<img src="${avis.userPhoto}" alt="photo">` : ""}
          <strong>${avis.userName || avis.userEmail}</strong>
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

// Likes
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

// Affiche les avis dès que la page est chargée
window.onload = afficherAvis;
