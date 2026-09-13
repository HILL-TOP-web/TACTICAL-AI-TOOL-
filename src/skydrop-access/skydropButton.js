function skydropButton() {
  return {
    type: "button",
    id: "skydrop-access-button",
    label: "Open SkyDrop",
    action: "/api/skydrop/access",
    method: "POST"
  };
}

function renderSkyDropButton() {
  return `
    <button
      id="skydrop-access-button"
      type="button"
      onclick="openSkyDropAccess()"
    >
      Open SkyDrop
    </button>

    <script>
      async function openSkyDropAccess() {
        const password = window.prompt(
          "Enter SkyDrop access password:"
        );

        if (password === null) {
          return;
        }

        const response = await fetch(
          "/api/skydrop/access",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ password })
          }
        );

        const result = await response.json();

        if (result.success) {
          window.location.href = "/skydrop";
        } else {
          alert(result.message || "Access denied.");
        }
      }
    </script>
  `;
}

module.exports = {
  skydropButton,
  renderSkyDropButton
};
