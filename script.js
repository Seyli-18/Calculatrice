let expression = "";

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

let utilisateur = null;

function seConnecter() {
  const provider = new window.authFns.GoogleAuthProvider();
  window.authFns.signInWithPopup(window.auth, provider);
}

function seDeconnecter() {
  window.authFns.signOut(window.auth);
}

window.authFns.onAuthStateChanged(window.auth, (user) => {
  utilisateur = user;
  document.getElementById("login-btn").style.display = user ? "none" : "inline-block";
  document.getElementById("logout-btn").style.display = user ? "inline-block" : "none";
  document.getElementById("utilisateur-connecte").innerText = user ? `Connecté en tant que : ${user.email}` : "";
});

async function envoyerAvis() {
  if (!utilisateur) {
    alert("Vous devez être connecté pour publier un avis.");
    return;
  }

  const texte = document.getElementById("avis-text").value;
  const note = parseInt(document.getElementById("etoiles").value);

  if (!texte || texte.length > 250) {
    alert("Votre avis est invalide");
    return;
  }

  const { collection, addDoc } = window.firestoreFns;
  await addDoc(collection(window.db, "avis"), {
    texte,
    note,
    likes: 0,
    date: new Date(),
    userId: utilisateur.uid
  });

  document.getElementById("avis-text").value = "";
}

function afficherAvis() {
  const { collection, onSnapshot } = window.firestoreFns;
  const avisRef = collection(window.db, "avis");
  const container = document.getElementById("liste-avis");

  onSnapshot(avisRef, (snapshot) => {
    container.innerHTML = "<h2>📣 Avis des utilisateurs</h2>";
    snapshot.docs
      .sort((a, b) => b.data().date?.toMillis() - a.data().date?.toMillis())
      .forEach((docSnap) => {
        const avis = docSnap.data();
        const date = new Date(avis.date.seconds * 1000);
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

async function likerAvis(id) {
  if (!utilisateur) {
    alert("Connectez-vous pour liker !");
    return;
  }

  const { doc, updateDoc, increment, getDoc, setDoc } = window.firestoreFns;
  const likeRef = doc(window.db, "avis/" + id + "/likes", utilisateur.uid);
  const snapshot = await getDoc(likeRef);

  if (snapshot.exists()) {
    alert("Vous avez déjà liké cet avis !");
    return;
  }

  await setDoc(likeRef, { liked: true });
  const avisRef = doc(window.db, "avis", id);
  await updateDoc(avisRef, { likes: increment(1) });
}

window.onload = afficherAvis;
