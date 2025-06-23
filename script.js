let expression = "";
const CLIENT_ID = "769072474225-p3ioqhjsrq28u0bbl3c9tb68a3ccq92h.apps.googleusercontent.com";

function ajouterChiffre(chiffre) {
  expression += chiffre;
  afficher();
}

function ajouterOperateur(op) {
  if (expression !== "" && !/[+\-*/(]$/.test(expression)) {
    expression += op;
    afficher();
  }
}

function afficher() {
  document.getElementById("affichage").value = expression || "0";
}

function calculer() {
  try {
    let resultat = eval(expression);
    expression = resultat.toString();
    afficher();
  } catch (e) {
    document.getElementById("affichage").value = "Erreur";
    expression = "";
  }
}

function effacer() {
  expression = "";
  afficher();
}

function envoyerAvis() {
  const texte = document.getElementById("avis-text").value;
  const note = document.getElementById("etoiles").value;
  if (!texte) return alert("Merci de remplir votre avis !");
  alert(`Merci pour votre avis : "${texte}" (${note}⭐)`);
}

// Connexion Google
function handleCredentialResponse(response) {
  console.log("Connexion réussie !", response.credential);
  document.getElementById("google-login-btn").style.display = "none";
  document.getElementById("user-info").style.display = "block";
  document.getElementById("avis-form").style.display = "block";
}

window.onload = () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("google-login-btn"),
    { theme: "outline", size: "large" }
  );

  document.getElementById("logout-btn").addEventListener("click", () => {
    location.reload(); // recharge tout
  });

  afficher();
};
