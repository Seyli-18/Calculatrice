firebase.initializeApp({
  apiKey: "AIzaSyCWSSYXHJNXcbFaJn6AapsEARKCTjhzqXs",
  authDomain: "monsitecalculatrice.firebaseapp.com",
  projectId: "monsitecalculatrice"
});
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;

function ajouterChiffre(chiffre) {
  const affichage = document.getElementById("affichage");
  affichage.value += chiffre;
}

function ajouterOperateur(op) {
  const affichage = document.getElementById("affichage");
  if (!/[+\-*/]$/.test(affichage.value)) affichage.value += op;
}

function calculer() {
  const affichage = document.getElementById("affichage");
  try {
    affichage.value = eval(affichage.value);
  } catch {
    affichage.value = "Erreur";
  }
}

function effacer() {
  document.getElementById("affichage").value = "";
}

// Google Sign-In
function onSignIn(response) {
  const credential = google.accounts.id.credential;
  const user = parseJwt(credential);
  currentUser = user;
  document.getElementById("user-info").style.display = "block";
  document.getElementById("login-container").style.display = "none";
  document.getElementById("user-name").innerText = `Connecté en tant que ${user.name}`;
}

function logout() {
  google.accounts.id.disableAutoSelect();
  location.reload();
}

function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

async function envoyerAvis() {
  const texte = document.getElementById("avis-text").value;
  const note = parseInt(document.getElementById("etoiles").value);
  if (!texte || texte.length > 250 || !currentUser) return alert("Connexion requise et avis valide");

  await db.collection("avis").add({
    texte,
    note,
    likes: [],
    userId: currentUser.sub,
    userName: currentUser.name,
    date: new Date()
  });

  document.getElementById("avis-text").value = "";
}

function afficherAvis() {
  const container = document.getElementById("liste-avis");
  db.collection("avis").orderBy("date", "desc").onSnapshot(snapshot => {
    container.innerHTML = "<h2>📣 Avis des utilisateurs</h2>";
    snapshot.forEach(doc => {
      const data = doc.data();
      const dateDiff = Math.floor((Date.now() - data.date.toDate()) / (1000 * 60 * 60 * 24));
      const aDejaLike = currentUser && data.likes.includes(currentUser.sub);
      const div = document.createElement("div");
      div.className = "avis";
      div.innerHTML = `
        <strong>${"⭐".repeat(data.note)}</strong><br>
        <p>${data.texte}</p>
        <p>Par <b>${data.userName}</b> — il y a ${dateDiff} jour(s)</p>
        <button class="like-btn" ${aDejaLike ? "disabled" : ""} onclick="likerAvis('${doc.id}')">
          ❤️ ${data.likes.length}
        </button>
      `;
      container.appendChild(div);
    });
  });
}

async function likerAvis(id) {
  if (!currentUser) return alert("Connecte-toi pour liker !");
  const docRef = db.collection("avis").doc(id);
  const docSnap = await docRef.get();
  const data = docSnap.data();
  if (!data.likes.includes(currentUser.sub)) {
    await docRef.update({
      likes: firebase.firestore.FieldValue.arrayUnion(currentUser.sub)
    });
  }
}

window.onload = afficherAvis;
