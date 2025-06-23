// Initialisation Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCWSSYXHJNXcbFaJn6AapsEARKCTjhzqXs",
  authDomain: "monsitecalculatrice.firebaseapp.com",
  projectId: "monsitecalculatrice",
  storageBucket: "monsitecalculatrice.appspot.com",
  messagingSenderId: "287241978051",
  appId: "1:287241978051:web:d6fa38c47a6def42c6e276",
  measurementId: "G-3RY758BE8D"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let expression = "";
let utilisateur = null;

// Fonctions calculatrice
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

// Rendre les fonctions accessibles dans HTML
window.ajouterChiffre = ajouterChiffre;
window.ajouterOperateur = ajouterOperateur;
window.calculer = calculer;
window.effacer = effacer;

// Connexion Google
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

// Suivi de connexion
auth.onAuthStateChanged((user) => {
  utilisateur = user;
  document.getElementById("login-btn").style.display = user ? "none" : "inline-block";
  document.getElementById("logout-btn").style.display = user ? "inline-block" : "none";
  document.getElementById("utilisateur-connecte").innerText = user ? `Connecté en tant que : ${user.email}` : "";
});

document.getElementById("envoyer-btn").addEventListener("click", envoyerAvis);

// Envoyer avis
async function envoyerAvis() {
  if (!utilisateur) {
    alert("Veuillez vous connecter pour publier un avis.");
    return;
  }

  const texte = document.getElementById("avis-text").value;
  const note = parseInt(document.getElementById("etoiles").value);

  if (!texte || texte.length > 250) {
    alert("Votre avis est invalide.");
    return;
  }

  await db.collection("avis").add({
    texte,
    note,
    likes: 0,
    date: new Date(),
    userId: utilisateur.uid
  });

  document.getElementById("avis-text").value = "";
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
        <strong>${"⭐".repeat(avis.note)}</strong><br>
        <p>${avis.texte}</p>
        <p><small>Posté le ${dateStr} à ${heureStr}</small></p>
        <button class="like-btn" onclick="likerAvis('${docSnap.id}')">❤️ ${avis.likes || 0}</button>
      `;
      container.appendChild(div);
    });
  });
}

// Liker un avis
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
  const avisRef = db.collection("avis").doc(id);
  await avisRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
}

window.afficherAvis = afficherAvis;
window.likerAvis = likerAvis;

window.onload = afficherAvis;
