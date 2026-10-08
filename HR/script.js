// Shared interactions for all localized pages.
const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwxKfp66aECXQ0AYP0E5q67_2H2JJycf_MtMm_dE1d4X9q1JffVDaXKmI4dh8Gu4tJ6wg/exec";

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const menuToggle = document.querySelector(".menu-toggle");
  const siteNav = document.querySelector(".site-nav");
  const backToTop = document.querySelector(".back-to-top");
  const sectionLinks = document.querySelectorAll('.site-nav a[href^="#"]');
  const trackedSections = document.querySelectorAll("main section[id]");
  const inquiryForm = document.querySelector(".inquiry-form");
  const formStatus = document.querySelector(".form-status");
  if (formStatus && formStatus.parentElement !== document.body) {
    document.body.appendChild(formStatus);
  }
  const feedbackSliders = document.querySelectorAll("[data-slider]");
  const getHeaderOffset = () => {
    const header = document.querySelector("header");
    return (header ? header.offsetHeight : 0) + 12;
  };
  const syncHeaderHeight = () => {
    const header = document.querySelector("header");
    document.documentElement.style.setProperty("--header-height", `${header ? header.offsetHeight : 78}px`);
  };
  let statusTimer = null;
  const showFormStatus = (message, type = "success") => {
    if (!formStatus) {
      return;
    }
    window.clearTimeout(statusTimer);
    formStatus.textContent = message;
    formStatus.classList.remove("success", "error", "visible");
    formStatus.classList.add(type, "visible");
    statusTimer = window.setTimeout(() => {
      formStatus.classList.remove("visible");
    }, 5200);
  };

  syncHeaderHeight();
  window.addEventListener("resize", syncHeaderHeight);

  document.querySelectorAll(".lang-switch a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      syncHeaderHeight();
      window.setTimeout(syncHeaderHeight, 320);
    });

    document.querySelectorAll(".site-nav a").forEach((link) => {
      link.addEventListener("click", () => {
        siteNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        syncHeaderHeight();
        window.setTimeout(syncHeaderHeight, 320);
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) {
        siteNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        syncHeaderHeight();
        window.setTimeout(syncHeaderHeight, 320);
      }
    });
  }

  if (trackedSections.length && sectionLinks.length) {
    const updateActiveSectionLink = () => {
      const headerOffset = getHeaderOffset() + 6;
      let activeId = trackedSections[0].id;

      trackedSections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop - headerOffset <= 0) {
          activeId = section.id;
        }
      });

      sectionLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${activeId}`;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    window.addEventListener("scroll", updateActiveSectionLink, { passive: true });
    window.addEventListener("resize", updateActiveSectionLink);
    updateActiveSectionLink();
  }

  if (backToTop) {
    const toggleBackToTop = () => {
      backToTop.classList.toggle("visible", window.scrollY > 480);
    };
    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    toggleBackToTop();
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  if (inquiryForm) {
    inquiryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!inquiryForm.checkValidity()) {
        const invalidField = inquiryForm.querySelector(":invalid");
        const invalidLabel = invalidField ? invalidField.closest(".field")?.querySelector("span")?.textContent : "";
        const isEmailTypo = invalidField && invalidField.type === "email" && invalidField.validity.typeMismatch;
        showFormStatus(
          isEmailTypo
            ? "Please enter a valid email address."
            : invalidLabel
              ? `Please complete ${invalidLabel.replace(/\s*\(.+\)\s*/, "")}.`
              : "Please complete all required fields.",
          "error"
        );
        if (invalidField) {
          invalidField.focus();
        }
        return;
      }

      const endpoint = inquiryForm.dataset.endpoint || GOOGLE_SHEETS_WEB_APP_URL;
      if (formStatus) {
        formStatus.classList.remove("visible", "success", "error");
      }

      if (!endpoint) {
        showFormStatus("Form is ready. Add your Google Apps Script Web App URL in script.js.", "error");
        return;
      }

      const submitButton = inquiryForm.querySelector('button[type="submit"]');
      const submitButtonText = submitButton ? submitButton.textContent : "";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      const payload = new URLSearchParams(new FormData(inquiryForm));
      payload.append("page", currentPage);
      payload.append("submittedAt", new Date().toISOString());

      try {
        await fetch(endpoint, {
          method: "POST",
          mode: "no-cors",
          body: payload
        });

        inquiryForm.reset();
        showFormStatus("Thank you. Your enquiry was submitted successfully.", "success");
      } catch (error) {
        showFormStatus("Contact submission failed. Please call or email us directly.", "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButtonText;
        }
      }
    });
  }

  feedbackSliders.forEach((slider) => {
    const track = slider.querySelector("[data-slider-track]");
    const slides = track ? Array.from(track.children) : [];
    const prevBtn = slider.querySelector("[data-slider-prev]");
    const nextBtn = slider.querySelector("[data-slider-next]");
    const dotsWrap = slider.querySelector("[data-slider-dots]");
    if (!track || slides.length <= 1 || !prevBtn || !nextBtn || !dotsWrap) {
      return;
    }

    const total = slides.length;
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[total - 1].cloneNode(true);
    track.appendChild(firstClone);
    track.insertBefore(lastClone, track.firstChild);

    let current = 1;
    let isAnimating = false;
    let autoTimer = null;
    const dots = slides.map((_, idx) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "feedback-dot";
      dot.setAttribute("aria-label", `Go to feedback ${idx + 1}`);
      dot.addEventListener("click", () => {
        if (isAnimating) {
          return;
        }
        current = idx + 1;
        render(true);
        restartAuto();
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    const setTransition = (enabled) => {
      track.style.transition = enabled && !prefersReducedMotion ? "transform 0.35s ease" : "none";
    };

    const syncDots = () => {
      const logicalIndex = (current - 1 + total) % total;
      dots.forEach((dot, idx) => dot.classList.toggle("is-active", idx === logicalIndex));
    };

    const render = (animate) => {
      setTransition(animate);
      track.style.transform = `translateX(-${current * 100}%)`;
      syncDots();
    };

    const goNext = () => {
      if (isAnimating) {
        return;
      }
      current += 1;
      if (prefersReducedMotion) {
        if (current === total + 1) {
          current = 1;
        }
        render(false);
        return;
      }
      isAnimating = true;
      render(true);
    };

    const goPrev = () => {
      if (isAnimating) {
        return;
      }
      current -= 1;
      if (prefersReducedMotion) {
        if (current === 0) {
          current = total;
        }
        render(false);
        return;
      }
      isAnimating = true;
      render(true);
    };

    const startAuto = () => {
      if (prefersReducedMotion) {
        return;
      }
      autoTimer = window.setInterval(goNext, 5000);
    };

    const stopAuto = () => {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    };

    const restartAuto = () => {
      stopAuto();
      startAuto();
    };

    nextBtn.addEventListener("click", () => {
      goNext();
      restartAuto();
    });

    prevBtn.addEventListener("click", () => {
      goPrev();
      restartAuto();
    });

    track.addEventListener("transitionend", () => {
      if (current === 0) {
        current = total;
        render(false);
      } else if (current === total + 1) {
        current = 1;
        render(false);
      }
      isAnimating = false;
    });

    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", startAuto);

    render(false);
    startAuto();
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");
      const target = targetId ? document.querySelector(targetId) : null;
      if (!target) {
        return;
      }

      event.preventDefault();
      const top = targetId === "#top"
        ? 0
        : target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    });
  });
});


