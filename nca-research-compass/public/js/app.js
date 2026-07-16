const STAGES = [
  { number: 1, key: "problem_statement", title: "Problem Statement" },
  { number: 2, key: "research_question_objectives", title: "Research Question & Objectives" },
  { number: 3, key: "literature_review_framework", title: "Literature Review Framework" },
  { number: 4, key: "hypothesis", title: "Hypothesis" },
  { number: 5, key: "research_design_methodology", title: "Research Design & Methodology" },
  { number: 6, key: "sampling_data_collection", title: "Sampling & Data Collection Tools" },
  { number: 7, key: "data_analysis_plan", title: "Data Analysis Plan" },
  { number: 8, key: "ethical_considerations", title: "Ethical Considerations" },
  { number: 9, key: "report_writeup", title: "Research Proposal Write-up" },
];

const Auth = {
  getToken() { return localStorage.getItem("nca_token"); },
  getUser() {
    const raw = localStorage.getItem("nca_user");
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem("nca_token", token);
    localStorage.setItem("nca_user", JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem("nca_token");
    localStorage.removeItem("nca_user");
  },
  requireLogin() {
    if (!this.getToken()) {
      window.location.href = "/auth.html";
      return false;
    }
    return true;
  },
};

async function api(path, options = {}) {
  const headers = options.headers || {};
  headers["Content-Type"] = "application/json";
  const token = Auth.getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch("/api" + path, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }

  if (!res.ok) {
    if (res.status === 401) {
      Auth.clear();
      window.location.href = "/auth.html";
    }
    throw new Error((data && data.error) || "Something went wrong.");
  }
  return data;
}

function renderNav(activePage) {
  const el = document.getElementById("nav");
  if (!el) return;
  const user = Auth.getUser();
  el.innerHTML = `
    <a class="nav-brand" href="/index.html">
      <span class="mark">NCA</span>
      <span class="name">Research Compass</span>
    </a>
    <div class="nav-links">
      ${user ? `
        <a href="/dashboard.html">My Research</a>
        <a href="/library.html">Problem Library</a>
        <span class="mono" style="color:var(--ink-soft); font-size:13px;">${user.name.split(" ")[0]}</span>
        <a href="#" id="logoutLink">Log out</a>
      ` : `
        <a href="/library.html">Problem Library</a>
        <a href="/auth.html" class="btn btn-primary" style="padding:8px 16px;">Log in</a>
      `}
    </div>
  `;
  const logout = document.getElementById("logoutLink");
  if (logout) {
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      Auth.clear();
      window.location.href = "/index.html";
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
