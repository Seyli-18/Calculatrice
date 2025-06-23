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

// Ajout dans script.js à la fin

window.onload = () => {
  const btn = document.getElementById("google-login-btn");

  // Client ID récupéré sur Google Cloud Console
  const clientId = "TON_CLIENT_ID_GOOGLE.apps.googleusercontent.com";

  btn.addEventListener("click", () => {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse
    });
    google.accounts.id.prompt(); // Affiche popup login Google
  });
};

// Fonction appelée après login Google réussi
function handleCredentialResponse(response) {
  // response.credential contient le token JWT
  console.log("Token JWT reçu:", response.credential);

  // Ici tu peux décoder le token, vérifier côté serveur, etc.
  // Pour l'instant on affiche juste un message :
  alert("Connexion réussie ! Merci pour ton avis.");
}

