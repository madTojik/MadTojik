// Mobile menu + forms (accessible, keyboard-friendly)
(() => {
  /* ---------- Mobile menu ---------- */
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");

  if (btn && menu) {
    // Ensure ARIA attributes exist for initial state
    btn.setAttribute("aria-controls", "mobileMenu");
    if (!btn.hasAttribute("aria-expanded")) btn.setAttribute("aria-expanded", "false");
    if (!menu.hasAttribute("aria-hidden")) menu.setAttribute("aria-hidden", "true");

    let lastFocused = null;

    const getFocusable = (root = menu) => {
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(",");
      return Array.from(root.querySelectorAll(selectors)).filter((el) => el.offsetParent !== null);
    };

    function openMenu() {
      menu.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
      lastFocused = document.activeElement;
      const focusables = getFocusable();
      if (focusables.length) focusables[0].focus();
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("click", onDocClick, true);
    }

    function closeMenu() {
      menu.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onDocClick, true);
      if (lastFocused instanceof HTMLElement) lastFocused.focus();
    }

    function toggleMenu() {
      const isOpen = menu.getAttribute("aria-hidden") === "false";
      if (isOpen) closeMenu();
      else openMenu();
    }

    function onKeyDown(e) {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }

      if (e.key === "Tab") {
        // Focus trap
        const focusables = getFocusable();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function onDocClick(e) {
      // If click outside menu and not on the toggle button, close
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        closeMenu();
      }
    }

    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleMenu();
    });

    // Allow Enter/Space to toggle when focused (button element already handles this,
    // but keep semantic parity if markup changes)
    btn.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleMenu();
      }
    });
  }

  /* ---------- Footer year ---------- */
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Accessible status region for form feedback ---------- */
  function ensureStatusRegion() {
    let region = document.getElementById("site-status");
    if (!region) {
      region = document.createElement("div");
      region.id = "site-status";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      region.className = "sr-only";
      document.body.appendChild(region);
    }
    return region;
  }
  const statusRegion = ensureStatusRegion();

  /* ---------- Send quote via mailto (no backend) ---------- */
  function wireForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const phone = (data.get("phone") || "").toString().trim();
      const details = (data.get("details") || "").toString().trim();

      // Basic validation
      if (!name || !phone || !details) {
        statusRegion.textContent = "Please complete all required fields.";
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      const subject = encodeURIComponent(`Quote Request — ${name} (${phone})`);
      const bodyText = `Name: ${name}\nPhone: ${phone}\n\nMove Details:\n${details}\n\n— Sent from 2skinnymovers.fit website`;
      const body = encodeURIComponent(bodyText);

      const mailto = `mailto:2skinnymovers@gmail.com?subject=${subject}&body=${body}`;

      // Some clients / browsers limit URL length. Use a conservative threshold.
      const MAX_MAILTO_LEN = 1900;
      if (mailto.length > MAX_MAILTO_LEN) {
        // Fallback: copy content to clipboard and instruct user to paste in email client
        try {
          await navigator.clipboard.writeText(
            `To: 2skinnymovers@gmail.com\nSubject: Quote Request — ${name} (${phone})\n\n${bodyText}`
          );
          statusRegion.textContent = "Message copied to clipboard — paste it into your email client to send.";
        } catch (err) {
          statusRegion.textContent = "Message too long to open mail client automatically. Please email 2skinnymovers@gmail.com with your details.";
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
        return;
      }

      // Open mail client. Use location.href to trigger default mail client in most environments.
      try {
        window.location.href = mailto;
        statusRegion.textContent = "Your email client should open — if it doesn't, please email 2skinnymovers@gmail.com.";
      } catch (err) {
        statusRegion.textContent = "Couldn't open your email client. Please email 2skinnymovers@gmail.com with your details.";
      } finally {
        // Re-enable submit after a short delay so the user can try again if needed.
        setTimeout(() => {
          if (submitBtn) submitBtn.disabled = false;
        }, 1000);
      }
    });
  }

  wireForm("quoteForm");
  wireForm("quoteForm2");
})();