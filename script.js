let expression = "";
const CLIENT_ID = "769072474225-p3ioqhjsrq28u0bbl3c9tb68a3ccq92h.apps.googleusercontent.com";

function ajouterChiffre(chiffre) {
  expression += chiffre;
  afficher();
}

function ajouterOperateur(op) {
  if (op === "Math.sqrt(") {
    expression += "Math.sqrt(";
  } else {
    if (expression !== "" && !/[+\-*/(]$/.test(expression)) {
      expression += op;
    }
  }
  afficher();
}

function afficher() {
  document.getElementById("affichage").value = expression || "0";
}

function calculer() {
  try {
    // Pour gérer racine avec fermeture automatique
    if (expression.includes("Math.sqrt(")) {
      let ouvert = (expression.match(/Math\.sqrt\(/g) || []).length;
      let ferme = (expression.match(/\)/g) || []).length;
      expression += ")".repeat(ouvert - ferme);
    }

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

  document.getElementById("google-login-btn").addEventListener("click", () => {
    google.accounts.id.prompt();
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    location.reload(); // recharge la page pour tout réinitialiser
  });

  afficher();
};
