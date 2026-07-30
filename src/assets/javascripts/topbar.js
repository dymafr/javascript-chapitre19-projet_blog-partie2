const menuButton = document.querySelector(".header-menu-icon");
const headerMenu = document.querySelector(".header-menu");

if (menuButton && headerMenu) {
  let mobileMenuElement = null;

  const setMenuState = isOpen => {
    if (!mobileMenuElement && isOpen) {
      const navigationList = headerMenu.querySelector("nav ul");

      if (!navigationList) {
        return;
      }

      mobileMenuElement = document.createElement("div");
      mobileMenuElement.classList.add("mobile-menu");
      mobileMenuElement.append(navigationList.cloneNode(true));
      headerMenu.append(mobileMenuElement);
    }

    mobileMenuElement?.classList.toggle("open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Fermer le menu" : "Ouvrir le menu"
    );
  };

  menuButton.addEventListener("click", event => {
    event.stopPropagation();
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  headerMenu.addEventListener("click", event => {
    event.stopPropagation();
  });

  window.addEventListener("click", () => {
    setMenuState(false);
  });

  window.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      setMenuState(false);
      menuButton.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 480) {
      setMenuState(false);
    }
  });
}
