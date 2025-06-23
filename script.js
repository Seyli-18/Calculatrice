// === Firebase config ===
firebase.initializeApp({
  apiKey: "AIzaSyCWSSYXHJNXcbFaJn6AapsEARKCTjhzqXs",
  authDomain: "monsitecalculatrice.firebaseapp.com",
  projectId: "monsitecalculatrice"
});
const db = firebase.firestore();

let user = null;

// === Google Auth ===
window.onload = () => {
  google.accounts.id.initialize({
    client_id: "287241978051-n2vslkdn3f1e5d7iv1b4bhrc3fc9trf1.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(
    document.getElementById("loginDiv"),
    { theme: "outline", size: "large" }
  );
  afficherAvis();
};

function handleCredentialResponse(response) {
  const data = JSON.parse(atob(response.credential.split('.')[1]));
  user = data;
  document.getElementById("userDiv").style.display = "block";
  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("formAvis").style.display = "block";
  document.getElementById("userInfo").innerText = `Connecté en tant que ${user.name}`;
  afficherAvis();
}

function logout() {
  google.accounts.id.disableAutoSelect();
  location.reload();
}

// === Calculatrice ===
function ajouter(val) {
  document.getElementById("affichage").value += val;
}
function effacer() {
  document.getElementById("affichage").value = "";
}
function calculer() {
  try {
    document.getElementById("affichage").value = eval(document.getElementById("affichage").value);
  } catch {
    document.getElementById("affichage").value = "Erreur";
  }
}

// === Avis ===
async function envoyerAvis() {
  const texte = document.getElementById("avisText").value;
  const note = parseInt(document.getElementById("etoiles").value);
  if (!texte || texte.length > 250 || !user) {
    return alert("Remplis tous les champs et connecte-toi !");
  }

  await db.collection("avis").add({
    texte,
    note,
    date: new Date(),
    likes: [],
    userId: user.sub,
    userName: user.name
  });

  document.getElementById("avisText").value = "";
}

function afficherAvis() {
  db.collection("avis").orderBy("date", "desc").onSnapshot(snapshot => {
    const liste = document.getElementById("avisListe");
    liste.innerHTML = "<h2>📣 Avis des utilisateurs</h2>";
    snapshot.forEach(doc => {
      const data = doc.data();
      const jours = Math.floor((Date.now() - data.date.toDate()) / 86400000);
      const dejaLike = user && data.likes.includes(user.sub);
      const div = document.createElement("div");
      div.className = "avis";
      div.innerHTML = `
        <strong>${"⭐".repeat(data.note)}</strong><br>
        <p>${data.texte}</p>
        <small>Par <b>${data.userName}</b> - il y a ${jours} jour(s)</small><br>
        <button class="like-btn" ${dejaLike ? "disabled" : ""} onclick="likerAvis('${doc.id}')">❤️ ${data.likes.length}</button>
      `;
      liste.appendChild(div);
    });
  });
}

async function likerAvis(id) {
  if (!user) return alert("Connecte-toi !");
  const ref = db.collection("avis").doc(id);
  const snap = await ref.get();
  const data = snap.data();
  if (!data.likes.includes(user.sub)) {
    await ref.update({
      likes: firebase.firestore.FieldValue.arrayUnion(user.sub)
    });
  }
}
