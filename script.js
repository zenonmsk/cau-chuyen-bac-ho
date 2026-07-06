// AUDIO
const audio = document.getElementById("audio");
const toggleBtn = document.getElementById("toggleAudio");
const playBtn = document.getElementById("playBtn");

let isPlaying = false;

function waitForImages() {
  const images = Array.from(document.querySelectorAll("img"));

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
    document.body.classList.remove("is-loading");
    reveal();

    // Tu dong phat audio ngay khi preload xong.
    audio.play()
      .then(() => {
        isPlaying = true;
        toggleBtn.innerText = "⏸";
      })
      .catch(() => {
        // Trinh duyet co the chan autoplay; giu nguyen nut de user bam tay.
        isPlaying = false;
        toggleBtn.innerText = "▶";
      });
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
showPageWhenReady();

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