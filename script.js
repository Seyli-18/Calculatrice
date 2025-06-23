let expression = "";

function ajouterChiffre(chiffre) {
  expression += chiffre;
  mettreAJourAffichage();
}

function ajouterOperateur(op) {
  if (expression !== "" && !expression.endsWith("+")) {
    expression += op;
    mettreAJourAffichage();
  }
}

function calculer() {
  try {
    const resultat = eval(expression);
    expression = resultat.toString();
    mettreAJourAffichage();
  } catch (e) {
    expression = "";
    document.getElementById("affichage").value = "Erreur";
  }
}

function effacer() {
  expression = "";
  mettreAJourAffichage();
}

function mettreAJourAffichage() {
  document.getElementById("affichage").value = expression;
}

// Mets ici ton vrai CLIENT_ID Google, récupéré dans Google Cloud Console
const CLIENT_ID = "TON_CLIENT_ID_GOOGLE.apps.googleusercontent.com";

// Fonction appelée quand la connexion Google réussit
function handleCredentialResponse(response) {
  console.log("Token JWT reçu:", response.credential);
  alert("Connexion réussie ! Merci pour ton avis.");
}

// Initialisation Google Sign-In au chargement de la page
window.onload = () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse
  });

  const btn = document.getElementById("google-login-btn");
  btn.addEventListener("click", () => {
    google.accounts.id.prompt(); // Affiche la popup Google pour connexion
  });
};
