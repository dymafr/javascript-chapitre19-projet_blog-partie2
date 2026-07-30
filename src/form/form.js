import "../assets/styles/styles.scss";
import "../assets/javascripts/topbar.js";
import "./form.scss";
import { openModal } from "../assets/javascripts/modal.js";

const API_URL = "https://restapi.fr/api/article";
const form = document.querySelector("form");
const errorElement = document.querySelector("#errors");
const btnCancel = document.querySelector(".btn-secondary");

if (!form || !errorElement || !btnCancel) {
  throw new Error("Le formulaire et ses contrôles sont requis.");
}

const submitButton = form.querySelector('button[type="submit"]');

if (!submitButton) {
  throw new Error("Le bouton d’enregistrement est requis.");
}

let articleId = null;
let hasUnsavedChanges = false;

const displayErrors = messages => {
  const items = messages.map(message => {
    const item = document.createElement("li");
    item.textContent = message;
    return item;
  });
  errorElement.replaceChildren(...items);
};

const formIsValid = article => {
  const requiredFields = ["author", "category", "content", "img", "title"];
  const hasEmptyField = requiredFields.some(field => {
    return !String(article[field] ?? "").trim();
  });

  if (hasEmptyField) {
    displayErrors(["Vous devez renseigner tous les champs."]);
    return false;
  }

  displayErrors([]);
  return true;
};

const fillForm = article => {
  const fieldNames = ["author", "img", "category", "title", "content"];

  fieldNames.forEach(fieldName => {
    const field = form.elements.namedItem(fieldName);
    if (field) {
      field.value = article[fieldName] ?? "";
    }
  });
};

const fetchArticle = async id => {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`);

  if (!response.ok) {
    throw new Error(`Impossible de charger l'article (${response.status})`);
  }

  return response.json();
};

const initForm = async () => {
  const params = new URL(window.location.href).searchParams;
  articleId = params.get("id");

  if (!articleId) {
    return;
  }

  try {
    const article = await fetchArticle(articleId);
    fillForm(article);
  } catch (error) {
    console.error(error);
    displayErrors(["Le chargement de l'article a échoué."]);
    submitButton.disabled = true;
  }
};

form.addEventListener("input", () => {
  hasUnsavedChanges = true;
});

btnCancel.addEventListener("click", async () => {
  const canLeave =
    !hasUnsavedChanges ||
    (await openModal(
      "Si vous quittez la page, vous perdrez les modifications non enregistrées."
    ));

  if (canLeave) {
    window.location.assign("/index.html");
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();

  const formData = new FormData(form);
  const article = Object.fromEntries(formData.entries());

  if (!formIsValid(article)) {
    return;
  }

  const requestUrl = articleId
    ? `${API_URL}/${encodeURIComponent(articleId)}`
    : API_URL;
  const method = articleId ? "PATCH" : "POST";

  submitButton.disabled = true;

  try {
    const response = await fetch(requestUrl, {
      method,
      body: JSON.stringify(article),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Impossible d'enregistrer l'article (${response.status})`);
    }

    hasUnsavedChanges = false;
    window.location.assign("/index.html");
  } catch (error) {
    console.error(error);
    displayErrors(["L'enregistrement de l'article a échoué."]);
    submitButton.disabled = false;
  }
});

initForm();
