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

const CLIENT_ID = "769072474225-p3ioqhjsrq28u0bbl3c9tb68a3ccq92h.apps.googleusercontent.com";

function handleCredentialResponse(response) {
  console.log("Token JWT reçu:", response.credential);
  alert("Connexion réussie ! Merci pour ton avis.");
}

window.onload = () => {
  const btn = document.getElementById("google-login-btn");

  btn.addEventListener("click", () => {
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse
    });
    google.accounts.id.prompt(); // Affiche la popup de connexion Google
  });
};
