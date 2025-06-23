let expression = "";

// ---------------- CALCULATRICE ----------------
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

// ---------------- AVIS ----------------
function envoyerAvis() {
  const texte = document.getElementById("avis-text").value;
  const note = document.getElementById("etoiles").value;

  if (!texte || texte.length > 250) {
    return alert("Votre avis doit contenir 1 à 250 caractères.");
  }

  const avis = {
    texte,
    note,
    likes: 0,
    id: Date.now()
  };

  const anciens = JSON.parse(localStorage.getItem("avis") || "[]");
  anciens.push(avis);
  localStorage.setItem("avis", JSON.stringify(anciens));
  document.getElementById("avis-text").value = "";
  afficherAvis();
}

function afficherAvis() {
  const container = document.getElementById("liste-avis");
  if (!container) return;

  const avisList = JSON.parse(localStorage.getItem("avis") || "[]");
  container.innerHTML = "<h2>📣 Avis des utilisateurs</h2>";

  avisList.reverse().forEach(avis => {
    const div = document.createElement("div");
    div.className = "avis";
    div.innerHTML = `
      <strong>${"⭐".repeat(avis.note)}</strong><br>
      <p>${avis.texte}</p>
      <button class="like-btn" onclick="likerAvis(${avis.id})">❤️ ${avis.likes}</button>
    `;
    container.appendChild(div);
  });
}

function likerAvis(id) {
  let avisList = JSON.parse(localStorage.getItem("avis") || "[]");
  avisList = avisList.map(avis => {
    if (avis.id === id) avis.likes++;
    return avis;
  });
  localStorage.setItem("avis", JSON.stringify(avisList));
  afficherAvis();
}

// Chargement automatique des avis si présent
window.onload = afficherAvis;

