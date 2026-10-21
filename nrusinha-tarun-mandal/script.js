
/* =========================================================
   NRUSINHA TARUN MANDAL WEBSITE
   File: script.js
   Purpose: Add interactive website features
   ========================================================= */

/* ---------- 1. Automatically update the footer year ---------- */
const yearElement = document.getElementById("current-year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

/* ---------- 2. Mobile navigation menu ---------- */
const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

if (menuToggle && mainNav) {

  // Open or close the menu when the menu button is clicked.
  menuToggle.addEventListener("click", function () {
    const isOpen = mainNav.classList.toggle("open");

    // Update accessibility information for screen readers.
    menuToggle.setAttribute("aria-expanded", String(isOpen));

    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  });

  // Close the mobile menu after a navigation link is selected.
  const navLinks = mainNav.querySelectorAll("a");

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    });
  });

  // Close the mobile menu when the user presses Escape.
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    }
  });
}

/* ---------- 3. Handle missing gallery images ---------- */
const galleryImages = document.querySelectorAll(".gallery-item img");

galleryImages.forEach(function (image) {

  // Mark missing images so CSS can display a neutral placeholder.
  image.addEventListener("error", function () {
    image.classList.add("image-missing");
    image.dataset.imageFailed = "true";
  });

  // Remove the placeholder class if an image loads successfully.
  image.addEventListener("load", function () {
    image.classList.remove("image-missing");
    delete image.dataset.imageFailed;
  });

  // Handle images that failed before this script attached its listener.
  if (image.complete && image.naturalWidth === 0) {
    image.classList.add("image-missing");
    image.dataset.imageFailed = "true";
  }
});

/* ---------- 4. Gallery lightbox ---------- */
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");
const galleryItems = document.querySelectorAll(".gallery-item");

let previouslyFocusedElement = null;

// Open the larger image when a gallery card is clicked.
galleryItems.forEach(function (item) {
  item.addEventListener("click", function () {
    const image = item.querySelector("img");
    const imagePath = item.dataset.image;

    // Do not open the viewer for a missing image.
    if (!image || !imagePath || image.dataset.imageFailed === "true") {
      return;
    }

    previouslyFocusedElement = item;

    lightboxImage.src = imagePath;
    lightboxImage.alt = image.alt || "Expanded gallery image";

    lightbox.hidden = false;
    document.body.style.overflow = "hidden";

    // Move keyboard focus to the close button.
    if (lightboxClose) {
      lightboxClose.focus();
    }
  });
});

// Close the image viewer and restore the page scroll.
function closeLightbox() {
  if (!lightbox || lightbox.hidden) {
    return;
  }

  lightbox.hidden = true;
  lightboxImage.removeAttribute("src");
  document.body.style.overflow = "";

  // Return focus to the gallery card that was opened.
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
  }
}

// Close the viewer using the close button.
if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

// Close the viewer when the dark background is clicked.
if (lightbox) {
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

// Close the viewer using the Escape key.
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeLightbox();
  }
});

/* ---------- 5. Donation QR code handling ---------- */
const donationQR = document.getElementById("donation-qr");
const qrMessage = document.getElementById("qr-message");

if (donationQR && qrMessage) {

  // Display the QR code only if the image loads successfully.
  donationQR.addEventListener("load", function () {
    if (donationQR.naturalWidth > 0) {
      donationQR.hidden = false;
      qrMessage.hidden = true;
    }
  });

  // If no QR code is available, display the information message.
  donationQR.addEventListener("error", function () {
    donationQR.hidden = true;
    qrMessage.hidden = false;
    qrMessage.textContent =
      "Official donation QR code will be displayed here when available.";
  });

  // Handle an image that loaded or failed before the listener was attached.
  if (donationQR.complete) {
    if (donationQR.naturalWidth > 0) {
      donationQR.hidden = false;
      qrMessage.hidden = true;
    } else {
      donationQR.hidden = true;
      qrMessage.hidden = false;
    }
  } else {
    // Hide the image until the browser confirms that it loaded.
    donationQR.hidden = true;
  }
}
