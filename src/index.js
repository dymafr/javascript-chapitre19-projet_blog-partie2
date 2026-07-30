import "./assets/styles/styles.scss";
import "./index.scss";
import "./assets/javascripts/topbar.js";
import { openModal } from "./assets/javascripts/modal.js";

const API_URL = "https://restapi.fr/api/article";
const SORT_ORDERS = new Set(["asc", "desc"]);
const articleContainerElement = document.querySelector(".articles-container");
const categoriesContainerElement = document.querySelector(".categories");
const selectElement = document.querySelector("#sort-order");

if (
  !articleContainerElement ||
  !categoriesContainerElement ||
  !selectElement
) {
  throw new Error("Les éléments principaux de la liste sont requis.");
}

let articles = [];
let activeCategory = null;
let sortOrder = "desc";
let articlesRequestController = null;

const normalizeCategory = category => {
  const normalizedCategory = String(category ?? "").trim();
  return normalizedCategory || "Sans catégorie";
};

const createArticleElement = article => {
  const articleElement = document.createElement("article");
  articleElement.classList.add("article");

  const imageElement = document.createElement("img");
  imageElement.src = String(article.img ?? "");
  imageElement.alt = `Portrait de ${article.author ?? "l’auteur"}`;
  imageElement.loading = "lazy";

  const titleElement = document.createElement("h2");
  titleElement.textContent = String(article.title ?? "");

  const authorElement = document.createElement("p");
  authorElement.classList.add("article-author");
  const date = new Date(article.createdAt);
  const formattedDate = Number.isNaN(date.getTime())
    ? "date inconnue"
    : date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
  authorElement.textContent =
    `${article.author ?? "Auteur inconnu"} - ${formattedDate}`;

  const contentElement = document.createElement("p");
  contentElement.classList.add("article-content");
  contentElement.textContent = String(article.content ?? "");

  const actionsElement = document.createElement("div");
  actionsElement.classList.add("article-actions");

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn btn-danger";
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.articleId = String(article._id);
  deleteButton.textContent = "Supprimer";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "btn btn-primary";
  editButton.dataset.action = "edit";
  editButton.dataset.articleId = String(article._id);
  editButton.textContent = "Modifier";

  actionsElement.append(deleteButton, editButton);
  articleElement.append(
    imageElement,
    titleElement,
    authorElement,
    contentElement,
    actionsElement
  );

  return articleElement;
};

const getVisibleArticles = () => {
  if (activeCategory === null) {
    return articles;
  }

  return articles.filter(
    article => normalizeCategory(article.category) === activeCategory
  );
};

const renderArticles = () => {
  const articleElements = getVisibleArticles().map(createArticleElement);

  if (articleElements.length === 0) {
    const emptyElement = document.createElement("p");
    emptyElement.classList.add("empty-state");
    emptyElement.textContent = "Aucun article dans cette catégorie.";
    articleContainerElement.replaceChildren(emptyElement);
    return;
  }

  articleContainerElement.replaceChildren(...articleElements);
};

const displayMenuCategories = categories => {
  const itemElements = categories.map(([category, count]) => {
    const itemElement = document.createElement("li");
    const buttonElement = document.createElement("button");
    const countElement = document.createElement("strong");
    const isActive = category === activeCategory;

    buttonElement.type = "button";
    buttonElement.classList.add("category-button");
    buttonElement.classList.toggle("active", isActive);
    buttonElement.dataset.category = category;
    buttonElement.setAttribute("aria-pressed", String(isActive));
    countElement.textContent = String(count);

    buttonElement.append(
      document.createTextNode(`${category} (`),
      countElement,
      document.createTextNode(")")
    );
    itemElement.append(buttonElement);

    return itemElement;
  });

  categoriesContainerElement.replaceChildren(...itemElements);
};

const createMenuCategories = () => {
  const categoryCounts = articles.reduce((counts, article) => {
    const category = normalizeCategory(article.category);
    counts[category] = (counts[category] ?? 0) + 1;
    return counts;
  }, Object.create(null));

  const categories = Object.entries(categoryCounts).toSorted(
    ([firstCategory], [secondCategory]) =>
      firstCategory.localeCompare(secondCategory, "fr")
  );

  if (
    activeCategory !== null &&
    !categories.some(([category]) => category === activeCategory)
  ) {
    activeCategory = null;
  }

  displayMenuCategories(categories);
};

const getArticlesUrl = () => {
  const url = new URL(API_URL);
  url.searchParams.set("sort", `createdAt:${sortOrder}`);
  return url;
};

const fetchArticles = async () => {
  articlesRequestController?.abort();
  const controller = new AbortController();
  articlesRequestController = controller;

  try {
    const response = await fetch(getArticlesUrl(), {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Chargement impossible : HTTP ${response.status}`);
    }

    const body = await response.json();
    articles = Array.isArray(body) ? body : body ? [body] : [];

    createMenuCategories();
    renderArticles();
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }

    console.error(error);
    articles = [];
    activeCategory = null;
    articleContainerElement.textContent =
      "Impossible de charger les articles pour le moment.";
    categoriesContainerElement.replaceChildren();
  } finally {
    if (articlesRequestController === controller) {
      articlesRequestController = null;
    }
  }
};

selectElement.addEventListener("change", () => {
  const nextSortOrder = selectElement.value;
  sortOrder = SORT_ORDERS.has(nextSortOrder) ? nextSortOrder : "desc";
  selectElement.value = sortOrder;
  fetchArticles();
});

categoriesContainerElement.addEventListener("click", event => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const buttonElement = event.target.closest("button[data-category]");

  if (!buttonElement || !categoriesContainerElement.contains(buttonElement)) {
    return;
  }

  const selectedCategory = buttonElement.dataset.category;
  activeCategory =
    activeCategory === selectedCategory ? null : selectedCategory;

  renderArticles();
  createMenuCategories();
});

articleContainerElement.addEventListener("click", async event => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const buttonElement = event.target.closest(
    "button[data-action][data-article-id]"
  );

  if (!buttonElement || !articleContainerElement.contains(buttonElement)) {
    return;
  }

  const { action, articleId } = buttonElement.dataset;

  if (action === "edit") {
    window.location.assign(
      `/form/form.html?id=${encodeURIComponent(articleId)}`
    );
    return;
  }

  if (action !== "delete") {
    return;
  }

  const confirmed = await openModal(
    "Êtes-vous sûr de vouloir supprimer cet article ?"
  );

  if (!confirmed) {
    return;
  }

  buttonElement.disabled = true;

  try {
    const response = await fetch(
      `${API_URL}/${encodeURIComponent(articleId)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      throw new Error(`Suppression impossible : HTTP ${response.status}`);
    }

    await fetchArticles();
  } catch (error) {
    console.error(error);
    buttonElement.disabled = false;
  }
});

fetchArticles();
