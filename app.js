// Footer year
document.getElementById("year").textContent = new Date().getFullYear();


// Replace this with your Steam app URL when ready
const STEAM_URL = "#";


// Wire all Steam buttons
["steamBtn","steamBtn2","steamBtn3","steamBtn4"].forEach((id) => {
const el = document.getElementById(id);
if (!el) return;
el.setAttribute("href", STEAM_URL);
el.setAttribute("target", "_blank");
el.setAttribute("rel", "noopener noreferrer");
});