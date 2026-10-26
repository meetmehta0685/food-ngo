(async () => {
  const diagrams = [...document.querySelectorAll(".mermaid")];

  if (diagrams.length === 0) {
    return;
  }

  try {
    const { default: mermaid } = await import(
      "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"
    );

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        primaryColor: "#f3b62f",
        primaryTextColor: "#172033",
        primaryBorderColor: "#c28d13",
        lineColor: "#617089",
        secondaryColor: "#e4eefb",
        tertiaryColor: "#dff4e9",
      },
    });

    await mermaid.run({ nodes: diagrams });
  } catch {
    // The Mermaid source remains readable as a fallback when offline.
  }
})();
