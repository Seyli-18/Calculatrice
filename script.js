let expression = "";
const CLIENT_ID = "TON_CLIENT_ID_GOOGLE.apps.googleusercontent.com";

function ajouterChiffre(chiffre) {
  expression += chiffre;
  afficher();
}

function ajouterOperateur(op) {
  if (expression && !/[+\-*/(]$/.test(expression)) {
    expression += op;
    afficher();
  }
}

function calculer() {
  try {
    expression = eval(expression).toString();
  } catch {
    expression = "Erreur";
  }
  afficher();
}

function effacer() {
  expression = "";
  afficher();
}

function afficher() {
  document.getElementById("affichage").value = expression || "0";
}

function envoyerAvis() {
  const texte = document.getElementById("avis-text").value;
  const note = document.getElementById("etoiles").value;
  if (!texte) return alert("Merci de remplir votre avis !");
  const avis = { texte, note };

  const avisExistants = JSON.parse(localStorage.getItem("avis")) || [];
  avisExistants.push(avis);
  localStorage.setItem("avis", JSON.stringify(avisExistants));

  document.getElementById("avis-text").value = "";
  afficherAvis();
}

function afficherAvis() {
  const liste = document.getElementById("liste-avis");
  const avis = JSON.parse(localStorage.getItem("avis")) || [];

  liste.innerHTML = "<h2>📢 Avis des utilisateurs :</h2>";
  avis.forEach(({ texte, note }) => {
    const div = document.createElement("div");
    div.className = "avis";
    div.innerHTML = `<strong>${"⭐".repeat(note)}</strong><br>${texte}`;
    liste.appendChild(div);
  });
}

// Connexion Google
function handleCredentialResponse(response) {
  console.log("Connexion réussie :", response.credential);
  document.getElementById("google-login-btn").style.display = "none";
  document.getElementById("user-info").style.display = "block";
  document.getElementById("avis-form").style.display = "block";
  afficherAvis();
}

window.onload = () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse
  });

  document.getElementById("google-login-btn").addEventListener("click", () => {
    google.accounts.id.prompt();
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    location.reload();
  });

  afficher();
  afficherAvis(); // Affiche les avis même sans connexion
};
