let currentUser = null;

async function requireAdmin() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
    showLogin();
    return;
  }

  currentUser = data.session?.user || null;

  if (currentUser) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById("loginCard")?.classList.remove("hidden");
  document.getElementById("dashboard")?.classList.add("hidden");
  document.getElementById("logout")?.classList.add("hidden");
}

function showDashboard() {
  document.getElementById("loginCard")?.classList.add("hidden");
  document.getElementById("dashboard")?.classList.remove("hidden");
  document.getElementById("logout")?.classList.remove("hidden");

  loadSites();
  loadFeedback();
  loadSettings();
}

async function loadSites() {
  const list = document.getElementById("siteList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("websites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<div class="card" style="padding:20px">${error.message}</div>`;
    return;
  }

  const sites = data || [];
  window.allSites = sites;

  if (!sites.length) {
    list.innerHTML = `
      <div class="card" style="padding:20px;color:#777">
        No websites added yet.
      </div>`;
    return;
  }

  list.innerHTML = sites.map(s => `
    <div class="admin-item">
      <div style="display:flex;gap:14px;align-items:center">
        <img src="${s.image_url || ""}"
             style="width:65px;height:50px;object-fit:cover;border-radius:10px">
        <div>
          <b>${s.title || ""}</b>
          <small style="display:block;color:#888">${s.category || ""}</small>
        </div>
      </div>

      <div class="admin-item-actions">
        <button class="btn ghost edit-site" data-id="${s.id}">
          Edit
        </button>

        <button class="btn ghost delete-site" data-id="${s.id}">
          Delete
        </button>
      </div>
    </div>
  `).join("");

  list.querySelectorAll(".edit-site").forEach(b => {
    b.onclick = () => openEditor(b.dataset.id);
  });

  list.querySelectorAll(".delete-site").forEach(b => {
    b.onclick = () => deleteSite(b.dataset.id);
  });
}

function openEditor(id = "") {
  const form = document.getElementById("siteForm");
  if (!form) return;

  form.classList.remove("hidden");

  const s = (window.allSites || []).find(
    x => String(x.id) === String(id)
  );

  form.reset();

  form.elements.id.value = s?.id || "";
  form.elements.title.value = s?.title || "";
  form.elements.category.value = s?.category || "";
  form.elements.image_url.value = s?.image_url || "";
  form.elements.demo_url.value = s?.demo_url || "";
  form.elements.description.value = s?.description || "";
  form.elements.tags.value = (s?.tags || []).join(", ");

  document.getElementById("siteFormTitle").textContent =
    s ? "Edit website" : "Add website";
}

async function saveSite(e) {
  e.preventDefault();

  const f = e.target;

  const p = {
    title: f.elements.title.value.trim(),
    category: f.elements.category.value.trim(),
    image_url: f.elements.image_url.value.trim(),
    demo_url: f.elements.demo_url.value.trim(),
    description: f.elements.description.value.trim(),
    tags: f.elements.tags.value
      .split(",")
      .map(x => x.trim())
      .filter(Boolean)
  };

  const id = f.elements.id.value;

  let result;

  if (id) {
    result = await supabaseClient
      .from("websites")
      .update(p)
      .eq("id", id);
  } else {
    result = await supabaseClient
      .from("websites")
      .insert([p]);
  }

  const msg = document.getElementById("siteMsg");

  if (result.error) {
    msg.textContent = result.error.message;
    return;
  }

  msg.textContent = "Saved successfully.";

  f.classList.add("hidden");

  await loadSites();
}

async function deleteSite(id) {
  if (!confirm("Delete this demo?")) return;

  const { error } = await supabaseClient
    .from("websites")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadSites();
}

async function loadFeedback() {
  const box = document.getElementById("adminFeedback");
  if (!box) return;

  const { data, error } = await supabaseClient
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    box.innerHTML = `<div class="card" style="padding:20px">${error.message}</div>`;
    return;
  }

  const feedback = data || [];

  if (!feedback.length) {
    box.innerHTML = `
      <div class="card" style="padding:20px;color:#777">
        No feedback yet.
      </div>`;
    return;
  }

  box.innerHTML = feedback.map(f => `
    <div class="admin-item">
      <div>
        <b>${f.name}</b> · ${f.rating}/5
        ${f.approved ? "· Published" : "· Pending"}

        <p style="margin:8px 0;color:#666">
          ${f.message}
        </p>
      </div>

      <div class="admin-item-actions">

        <button class="btn ghost approve-f" data-id="${f.id}">
          ${f.approved ? "Hide" : "Approve"}
        </button>

        <button class="btn ghost delete-f" data-id="${f.id}">
          Delete
        </button>

      </div>
    </div>
  `).join("");

  box.querySelectorAll(".approve-f").forEach(b => {
    b.onclick = () => toggleFeedback(b.dataset.id);
  });

  box.querySelectorAll(".delete-f").forEach(b => {
    b.onclick = () => deleteFeedback(b.dataset.id);
  });
}

async function toggleFeedback(id) {
  const { data, error } = await supabaseClient
    .from("feedback")
    .select("approved")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  const { error: updateError } = await supabaseClient
    .from("feedback")
    .update({ approved: !data.approved })
    .eq("id", id);

  if (updateError) {
    alert(updateError.message);
    return;
  }

  await loadFeedback();
}

async function deleteFeedback(id) {
  if (!confirm("Delete feedback?")) return;

  const { error } = await supabaseClient
    .from("feedback")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadFeedback();
}

async function loadSettings() {
  const form = document.getElementById("settingsForm");
  if (!form) return;

  const { data, error } = await supabaseClient
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  form.elements.whatsapp.value = data?.whatsapp || "";
  form.elements.about_text.value = data?.about_text || "";
  form.elements.about_image.value = data?.about_image || "";
  form.elements.theme.value = data?.theme || "cream";
}


/* LOGIN */

document.getElementById("loginForm")?.addEventListener(
  "submit",
  async e => {

    e.preventDefault();

    const f = e.target;
    const msg = document.getElementById("loginMsg");

    msg.textContent = "Logging in...";

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: f.elements.email.value.trim(),
        password: f.elements.password.value
      });

    if (error) {
      msg.textContent = error.message;
      return;
    }

    currentUser = data.user;

    msg.textContent = "";

    showDashboard();
  }
);


/* LOGOUT */

document.getElementById("logout")?.addEventListener(
  "click",
  async () => {

    await supabaseClient.auth.signOut();

    currentUser = null;

    showLogin();
  }
);


/* ADD WEBSITE */

document.getElementById("newSite")?.addEventListener(
  "click",
  () => openEditor()
);


/* CANCEL */

document.getElementById("cancelSite")?.addEventListener(
  "click",
  () => {
    document
      .getElementById("siteForm")
      ?.classList.add("hidden");
  }
);


/* WEBSITE FORM */

document.getElementById("siteForm")
  ?.addEventListener("submit", saveSite);


/* SETTINGS */

document.getElementById("settingsForm")
  ?.addEventListener("submit", async e => {

    e.preventDefault();

    const f = e.target;

    const settings = {
      id: 1,
      whatsapp: f.elements.whatsapp.value,
      about_text: f.elements.about_text.value,
      about_image: f.elements.about_image.value,
      theme: f.elements.theme.value
    };

    const { error } = await supabaseClient
      .from("settings")
      .upsert(settings);

    document.getElementById("settingsMsg").textContent =
      error ? error.message : "Settings saved.";
  });


/* TABS */

document.querySelectorAll(".tab").forEach(b => {

  b.onclick = () => {

    document.querySelectorAll(".tab")
      .forEach(x => x.classList.toggle("active", x === b));

    document.querySelectorAll(".tab-panel")
      .forEach(x => x.classList.add("hidden"));

    document
      .getElementById("tab-" + b.dataset.tab)
      ?.classList.remove("hidden");
  };

});


/* START */

if (document.getElementById("loginCard")) {
  requireAdmin();
}
