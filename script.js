// AUDIO
const audio = document.getElementById("audio");
const toggleBtn = document.getElementById("toggleAudio");
const playBtn = document.getElementById("playBtn");
const loader = document.getElementById("loader");
const startStoryBtn = document.getElementById("startStoryBtn");
const lightbox = document.getElementById("imageLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const closeLightboxBtn = document.getElementById("closeLightbox");
const lightboxStage = document.getElementById("lightboxStage");
const loaderStatus = document.querySelector(".loader-status");

let isPlaying = false;
let zoomScale = 1;
let baseImageWidth = 0;
let baseImageHeight = 0;
let isLoaderReady = false;

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function applyLightboxZoom() {
  if (!baseImageWidth || !baseImageHeight) {
    return;
  }

  if (zoomScale <= 1) {
    lightboxImage.style.width = "";
    lightboxImage.style.height = "";
  } else {
    lightboxImage.style.width = `${baseImageWidth * zoomScale}px`;
    lightboxImage.style.height = `${baseImageHeight * zoomScale}px`;
  }

  if (zoomScale > 1) {
    lightboxImage.style.cursor = "zoom-out";
  } else {
    lightboxImage.style.cursor = "zoom-in";
  }
}

function resetLightboxZoom() {
  zoomScale = 1;
  applyLightboxZoom();

  if (lightboxStage) {
    lightboxStage.scrollTop = 0;
    lightboxStage.scrollLeft = 0;
  }
}

function waitForImages() {
  const images = Array.from(document.querySelectorAll("img")).filter(img => {
    if (img.dataset.skipPreload === "true") {
      return false;
    }

    return Boolean(img.getAttribute("src"));
  });

  return Promise.all(
    images.map(img => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise(resolve => {
        const done = () => {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          resolve();
        };

        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    })
  );
}

function waitForAudio() {
  return new Promise(resolve => {
    if (!audio) {
      resolve();
      return;
    }

    const isReady = audio.readyState >= 4;
    if (isReady) {
      resolve();
      return;
    }

    const done = () => {
      audio.removeEventListener("canplaythrough", done);
      audio.removeEventListener("error", done);
      resolve();
    };

    audio.addEventListener("canplaythrough", done, { once: true });
    audio.addEventListener("error", done, { once: true });
    audio.load();

    // Fallback de khong bi treo vo han neu trinh duyet khong ban canplaythrough.
    setTimeout(done, 10000);
  });
}

function showPageWhenReady() {
  Promise.all([waitForImages(), waitForAudio()]).finally(() => {
    isLoaderReady = true;
    loader.classList.add("is-ready");
    startStoryBtn.disabled = false;
    loaderStatus.innerText = "Mọi thứ đã sẵn sàng. Bấm để bắt đầu câu chuyện.";
  });
}

function beginStory() {
  if (!isLoaderReady) {
    return;
  }

  document.body.classList.remove("is-loading");
  reveal();

  audio.play()
    .then(() => {
      isPlaying = true;
      toggleBtn.innerText = "⏸";
    })
    .catch(() => {
      isPlaying = false;
      toggleBtn.innerText = "▶";
    });
}

function toggleAudio() {
  if (!isPlaying) {
    audio.play().then(() => {
      toggleBtn.innerText = "⏸";
      isPlaying = true;
    });
  } else {
    audio.pause();
    toggleBtn.innerText = "▶";
    isPlaying = false;
  }
}

audio.addEventListener("play", () => {
  isPlaying = true;
  toggleBtn.innerText = "⏸";
});

audio.addEventListener("pause", () => {
  isPlaying = false;
  toggleBtn.innerText = "▶";
});

toggleBtn.addEventListener("click", toggleAudio);
playBtn.addEventListener("click", toggleAudio);
startStoryBtn.addEventListener("click", beginStory);
showPageWhenReady();

function openLightbox(src, alt) {
  lightboxImage.src = src;
  lightboxImage.alt = alt || "Anh phong to";
  lightboxImage.style.width = "";
  lightboxImage.style.height = "";
  zoomScale = 1;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
  lightboxImage.style.width = "";
  lightboxImage.style.height = "";
  baseImageWidth = 0;
  baseImageHeight = 0;
}

document.querySelectorAll("img.zoomable").forEach(img => {
  img.addEventListener("click", () => {
    openLightbox(img.src, img.alt);
  });
});

closeLightboxBtn.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", event => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

window.addEventListener("keydown", event => {
  if (event.key === "Escape" && lightbox.classList.contains("open")) {
    closeLightbox();
  }

  if (!lightbox.classList.contains("open")) {
    return;
  }

  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    zoomScale = clamp(zoomScale + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
    applyLightboxZoom();
  }

  if (event.key === "-") {
    event.preventDefault();
    zoomScale = clamp(zoomScale - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
    applyLightboxZoom();
  }

  if (event.key === "0") {
    event.preventDefault();
    resetLightboxZoom();
  }
});

lightboxImage.addEventListener("wheel", event => {
  if (!event.ctrlKey) {
    return;
  }

  event.preventDefault();

  const direction = event.deltaY < 0 ? 1 : -1;
  zoomScale = clamp(zoomScale + direction * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
  applyLightboxZoom();
}, { passive: false });

lightboxImage.addEventListener("dblclick", () => {
  if (zoomScale > 1) {
    resetLightboxZoom();
    return;
  }

  zoomScale = 2;
  applyLightboxZoom();
});

lightboxImage.addEventListener("load", () => {
  baseImageWidth = lightboxImage.clientWidth;
  baseImageHeight = lightboxImage.clientHeight;
  applyLightboxZoom();
});

// SCROLL ANIMATION
function reveal() {
  const reveals = document.querySelectorAll(".reveal");

  reveals.forEach(el => {
    const windowHeight = window.innerHeight;
    const top = el.getBoundingClientRect().top;

    if (top < windowHeight - 100) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", reveal);
window.addEventListener("load", reveal);