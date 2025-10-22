// Get elements
const form = document.getElementById("memoryForm");
const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const addBtn = document.getElementById("addBtn");
const searchInput = document.getElementById("search");
const filterAll = document.getElementById("filterAll");
const filterImg = document.getElementById("filterImg");
const filterVid = document.getElementById("filterVid");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

// Modal elements
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
let editIndex = null;

// Preview file
fileInput.addEventListener("change", () => {
  preview.innerHTML = "";
  const file = fileInput.files[0];
  if (!file) {
    preview.innerHTML = "<span>No file selected</span>";
    return;
  }

  const url = URL.createObjectURL(file);
  if (file.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = url;
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";
    preview.appendChild(img);
  } else if (file.type.startsWith("video/")) {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.style.maxWidth = "100%";
    preview.appendChild(video);
  }
});

// Add new memory
addBtn.addEventListener("click", () => {
  const title = document.getElementById("title").value.trim();
  const desc = document.getElementById("description").value.trim();
  const link = document.getElementById("link").value.trim();
  const file = fileInput.files[0];

  if (!title || !file) {
    alert("Please provide a title and select a file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const memory = {
      title,
      desc,
      link,
      type: file.type.startsWith("image/") ? "image" : "video",
      fileData: e.target.result,
      date: new Date().toLocaleString(),
    };
    memories.push(memory);
    localStorage.setItem("memories", JSON.stringify(memories));
    renderGallery();
    form.reset();
    preview.innerHTML = "<span>No file selected</span>";
  };
  reader.readAsDataURL(file);
});

// Render gallery
function renderGallery() {
  gallery.innerHTML = "";
  const search = searchInput.value.toLowerCase();

  memories.forEach((m, index) => {
    if (
      (currentFilter === "image" && m.type !== "image") ||
      (currentFilter === "video" && m.type !== "video")
    ) {
      return;
    }

    if (
      search &&
      !m.title.toLowerCase().includes(search) &&
      !m.desc.toLowerCase().includes(search)
    ) {
      return;
    }

    const div = document.createElement("div");
    div.className = "memory";
    div.innerHTML = `
      ${
        m.type === "image"
          ? `<img src="${m.fileData}" alt="${m.title}" />`
          : `<video src="${m.fileData}" muted></video>`
      }
      <div class="meta">
        <h3>${m.title}</h3>
        <p>${m.date.split(",")[0]}</p>
      </div>
      <div class="actions">
        <button onclick="openModal(${index})">🔍</button>
        <button onclick="deleteMemory(${index})">🗑️</button>
      </div>
    `;
    gallery.appendChild(div);
  });
}

// Modal view
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

  editBtn.onclick = () => editMemory(i);
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

// Edit memory
function editMemory(i) {
  const m = memories[i];
  document.getElementById("title").value = m.title;
  document.getElementById("description").value = m.desc;
  document.getElementById("link").value = m.link;
  preview.innerHTML = m.type === "image"
    ? `<img src="${m.fileData}" style="max-width:100%;border-radius:8px;">`
    : `<video src="${m.fileData}" controls style="max-width:100%"></video>`;

  editIndex = i;
  modal.classList.remove("open");

  addBtn.textContent = "Save Changes";
  addBtn.onclick = saveEdit;
}

function saveEdit() {
  const title = document.getElementById("title").value.trim();
  const desc = document.getElementById("description").value.trim();
  const link = document.getElementById("link").value.trim();
  const file = fileInput.files[0];

  if (!title) {
    alert("Title required!");
    return;
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateMemory(e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    updateMemory(memories[editIndex].fileData);
  }

  function updateMemory(fileData) {
    const m = memories[editIndex];
    m.title = title;
    m.desc = desc;
    m.link = link;
    m.fileData = fileData;
    m.type = file
      ? file.type.startsWith("image/")
        ? "image"
        : "video"
      : m.type;
    m.date = new Date().toLocaleString();

    localStorage.setItem("memories", JSON.stringify(memories));
    renderGallery();
    form.reset();
    preview.innerHTML = "<span>No file selected</span>";
    addBtn.textContent = "Add Memory";
    addBtn.onclick = addMemory;
    editIndex = null;
  }
}

// Filters
filterAll.onclick = () => {
  currentFilter = "all";
  renderGallery();
};
filterImg.onclick = () => {
  currentFilter = "image";
  renderGallery();
};
filterVid.onclick = () => {
  currentFilter = "video";
  renderGallery();
};

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

// Export
exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(memories)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "my_memories.json";
  a.click();
});

// Import
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
      } else {
        alert("Invalid file format");
      }
    } catch {
      alert("Failed to import file");
    }
  };
  reader.readAsText(file);
});

// Initial render
renderGallery();
