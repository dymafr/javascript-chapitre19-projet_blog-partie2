let openedDialog = null;

const closePreviousDialog = () => {
  if (openedDialog?.open) {
    openedDialog.close("cancel");
  }
};

export function openModal(question) {
  closePreviousDialog();

  const invokingElement =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  const dialog = document.createElement("dialog");
  dialog.classList.add("modal-dialog");
  dialog.setAttribute("aria-labelledby", "modal-question");

  const form = document.createElement("form");
  form.method = "dialog";

  const questionElement = document.createElement("p");
  questionElement.id = "modal-question";
  questionElement.textContent = String(question);

  const actionsElement = document.createElement("div");
  actionsElement.classList.add("modal-actions");

  const cancelButton = document.createElement("button");
  cancelButton.type = "submit";
  cancelButton.value = "cancel";
  cancelButton.className = "btn btn-secondary";
  cancelButton.textContent = "Annuler";

  const confirmButton = document.createElement("button");
  confirmButton.type = "submit";
  confirmButton.value = "confirm";
  confirmButton.className = "btn btn-primary";
  confirmButton.textContent = "Confirmer";

  actionsElement.append(cancelButton, confirmButton);
  form.append(questionElement, actionsElement);
  dialog.append(form);

  dialog.addEventListener(
    "cancel",
    () => {
      dialog.returnValue = "cancel";
    },
    { once: true }
  );

  dialog.addEventListener("click", event => {
    if (event.target !== dialog) {
      return;
    }

    const bounds = dialog.getBoundingClientRect();
    const clickIsInside =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;

    if (!clickIsInside) {
      dialog.close("cancel");
    }
  });

  return new Promise(resolve => {
    dialog.addEventListener(
      "close",
      () => {
        const confirmed = dialog.returnValue === "confirm";
        dialog.remove();

        if (openedDialog === dialog) {
          openedDialog = null;
        }

        invokingElement?.focus();
        resolve(confirmed);
      },
      { once: true }
    );

    document.body.append(dialog);
    openedDialog = dialog;
    dialog.showModal();
    cancelButton.focus();
  });
}
