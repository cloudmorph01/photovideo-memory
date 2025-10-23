// Elements
const form = document.getElementById("memoryForm");
const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const uploadBtn = document.getElementById("uploadBtn");
const addBtn = document.getElementById("addBtn");
const searchInput = document.getElementById("search");
const filterAll = document.getElementById("filterAll");
const filterImg = document.getElementById("filterImg");
const filterVid = document.getElementById("filterVid");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const uploadStatus = document.getElementById("uploadStatus");

// Modal
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalDate = document.getElementById("modalDate");
const modalDesc = document.getElementById("modalDesc");
const modalLink = document.getElementById("modalLink");
const modalMediaWrap = document.getElementById("modalMediaWrap");
const closeModal = document.getElementById("closeModal");
const editBtn = document.getElementById("editBtn");

let memories = JSON.parse(localStorage.getItem("memories") || "[]");
let currentFilter = "all";
let uploadedURL = "";
let uploadedType = "";
let editIndex = null;

// CLOUDINARY CONFIG
const CLOUD_NAME = "diawzhidw";
const UPLOAD_PRESET = "memories";

// File preview
fileInput.addEventListener("change", () => {
  preview.innerHTML = "";
  const file = fileInput.files[0];
  if (!file) return (preview.innerHTML = "<span>No file selected</span>");

  const url = URL.createObjectURL(file);
  if (file.type.startsWith("image/")) {
    preview.innerHTML = `<img src="${url}" style="max-width:100%;border-radius:8px;">`;
  } else if (file.type.startsWith("video/")) {
    preview.innerHTML = `<video src="${url}" controls style="max-width:100%"></video>`;
  }
});

// Upload to Cloudinary
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a file first!");
  uploadStatus.textContent = "Uploading... ⏳";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.secure_url) {
      uploadedURL = data.secure_url;
      uploadedType = file.type.startsWith("image/") ? "image" : "video";
      uploadStatus.innerHTML = `✅ Uploaded Successfully!<br><a href="${uploadedURL}" target="_blank">${uploadedURL}</a>`;
    } else {
      uploadStatus.textContent = "❌ Upload failed: " + (data.error?.message || "Unknown error");
    }
  } catch (err) {
    console.error(err);
    uploadStatus.textContent = "❌ Error uploading file. Check console.";
  }
});

// Add memory (from Cloudinary URL)
addBtn.addEventListener("click", () => {
  const title = document.getElementById("title").value.trim();
  const desc = document.getElementById("description").value.trim();
  const link = document.getElementById("link").value.trim();

  if (!title || !uploadedURL) {
    alert("Please upload an image/video first, then add memory!");
    return;
  }

  const memory = {
    title,
    desc,
    link,
    type: uploadedType,
    fileData: uploadedURL,
    date: new Date().toLocaleString(),
  };
  memories.push(memory);
  localStorage.setItem("memories", JSON.stringify(memories));
  renderGallery();

  // Reset form
  form.reset();
  preview.innerHTML = "<span>No file selected</span>";
  uploadStatus.textContent = "";
  uploadedURL = "";
});

// Render gallery
function renderGallery() {
  gallery.innerHTML = "";
  const search = searchInput.value.toLowerCase();

  memories.forEach((m, i) => {
    if (
      (currentFilter === "image" && m.type !== "image") ||
      (currentFilter === "video" && m.type !== "video")
    )
      return;

    if (
      search &&
      !m.title.toLowerCase().includes(search) &&
      !m.desc.toLowerCase().includes(search)
    )
      return;

    const div = document.createElement("div");
    div.className = "memory";
    div.innerHTML = `
      ${m.type === "image"
        ? `<img src="${m.fileData}" alt="${m.title}">`
        : `<video src="${m.fileData}" muted></video>`}
      <div class="meta">
        <h3>${m.title}</h3>
        <p>${m.date.split(",")[0]}</p>
      </div>
      <div class="actions">
        <button onclick="openModal(${i})">🔍</button>
        <button onclick="deleteMemory(${i})">🗑️</button>
      </div>
    `;
    gallery.appendChild(div);
  });
}

// Modal View
function openModal(i) {
  const m = memories[i];
  modal.classList.add("open");
  modalTitle.textContent = m.title;
  modalDate.textContent = m.date;
  modalDesc.textContent = m.desc || "";
  modalLink.innerHTML = m.link
    ? `<a href="${m.link}" target="_blank">Visit Link ↗</a>`
    : "";

  modalMediaWrap.innerHTML =
    m.type === "image"
      ? `<img class="modal-media" src="${m.fileData}" />`
      : `<video class="modal-media" src="${m.fileData}" controls autoplay></video>`;

  closeModal.onclick = () => modal.classList.remove("open");
}

// Delete memory
function deleteMemory(i) {
  if (confirm("Delete this memory?")) {
    memories.splice(i, 1);
    localStorage.setItem("memories", JSON.stringify(memories));
    renderGallery();
  }
}

// Filters
filterAll.onclick = () => (currentFilter = "all", renderGallery());
filterImg.onclick = () => (currentFilter = "image", renderGallery());
filterVid.onclick = () => (currentFilter = "video", renderGallery());

// Search
searchInput.addEventListener("input", renderGallery);

// Clear all
clearBtn.addEventListener("click", () => {
  if (confirm("Clear all memories?")) {
    localStorage.removeItem("memories");
    memories = [];
    renderGallery();
  }
});

// Export / Import
exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(memories)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "my_memories.json";
  a.click();
});

importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      if (Array.isArray(data)) {
        memories = data;
        localStorage.setItem("memories", JSON.stringify(memories));
        renderGallery();
      } else alert("Invalid file format");
    } catch {
      alert("Failed to import file");
    }
  };
  reader.readAsText(file);
});

// Init
renderGallery();
