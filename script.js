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

// AVIS AVEC FIREBASE
async function envoyerAvis() {
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
    date: new Date()
  });

  document.getElementById("avis-text").value = "";
}

function afficherAvis() {
  const { collection, onSnapshot } = window.firestoreFns;
  const avisRef = collection(window.db, "avis");
  const container = document.getElementById("liste-avis");

  if (!container) return;

  onSnapshot(avisRef, (snapshot) => {
    container.innerHTML = "<h2>📣 Avis des utilisateurs</h2>";
    snapshot.docs
      .sort((a, b) => b.data().date?.toMillis() - a.data().date?.toMillis())
      .forEach((docSnap) => {
        const avis = docSnap.data();
        const div = document.createElement("div");
        div.className = "avis";
        div.innerHTML = `
          <strong>${"⭐".repeat(avis.note)}</strong><br>
          <p>${avis.texte}</p>
          <button class="like-btn" onclick="likerAvis('${docSnap.id}')">❤️ ${avis.likes || 0}</button>
        `;
        container.appendChild(div);
      });
  });
}

async function likerAvis(id) {
  const { doc, updateDoc, increment } = window.firestoreFns;
  const avisRef = doc(window.db, "avis", id);
  await updateDoc(avisRef, {
    likes: increment(1)
  });
}

window.onload = afficherAvis;
