/* Zenova Technologies — plain JavaScript, no framework or secret credentials. */
"use strict";
(() => {
  const one = (s) => document.querySelector(s);
  const all = (s) => [...document.querySelectorAll(s)];
  const serviceMap = {
    "web-design": "Website design & management",
    "voip-virtual-landlines": "VoIP & virtual landlines",
    "custom-software": "Custom software",
  };
  const forms = all("form[data-kind]");
  const key = (d) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  function bounds() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const p = (t) => Number(parts.find((x) => x.type === t).value);
    const today = new Date(Date.UTC(p("year"), p("month") - 1, p("day")));
    return { start: new Date(+today + 86400000), end: new Date(+today + 90 * 86400000) };
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + "T00:00:00Z"),
      b = bounds();
    return (
      !Number.isNaN(+d) &&
      key(d) === value &&
      d >= b.start &&
      d <= b.end &&
      ![0, 6].includes(d.getUTCDay())
    );
  }
  function setMode(mode, updateHash = false) {
    if (!one("#panel-enquiry")) return;
    all("[data-mode]").forEach((el) => {
      const active = el.dataset.mode === mode;
      el.setAttribute("aria-selected", String(active));
      el.tabIndex = active ? 0 : -1;
      el.dataset.state = active ? "active" : "inactive";
    });
    one("#panel-enquiry").hidden = mode !== "enquiry";
    one("#panel-consultation").hidden = mode !== "consultation";
    if (updateHash)
      history.replaceState(null, "", mode === "consultation" ? "#consultation" : "#contact-form");
  }
  function syncMode() {
    setMode(location.hash === "#consultation" ? "consultation" : "enquiry");
  }
  all("[data-mode]").forEach((el, i) => {
    el.addEventListener("click", () => setMode(el.dataset.mode, true));
    el.addEventListener("keydown", (e) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const tabs = all("[data-mode]");
        const target = e.key === "Home" ? tabs[0] : e.key === "End" ? tabs[1] : tabs[1 - i];
        target.click();
        target.focus();
      }
    });
  });
  window.addEventListener("hashchange", syncMode);
  syncMode();
  const selectedService = serviceMap[new URLSearchParams(location.search).get("service")];
  if (selectedService) all('select[name="Service"]').forEach((el) => (el.value = selectedService));
  all('select[name="Service"]').forEach((el) =>
    el.addEventListener("change", () =>
      all('select[name="Service"]').forEach((other) => (other.value = el.value)),
    ),
  );
  let chosenDate = "",
    chosenTime = "";
  const initial = bounds().start;
  let month = new Date(Date.UTC(initial.getUTCFullYear(), initial.getUTCMonth(), 1));
  function renderCalendar() {
    const grid = one(".calendar-grid");
    if (!grid) return;
    grid.replaceChildren();
    one("#calendar-month").textContent = month.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      const el = document.createElement("span");
      el.textContent = day;
      grid.append(el);
    }
    for (let i = 0; i < (month.getUTCDay() + 6) % 7; i++) {
      const el = document.createElement("span");
      el.setAttribute("aria-hidden", "true");
      grid.append(el);
    }
    const count = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
    ).getUTCDate();
    for (let i = 1; i <= count; i++) {
      const d = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), i)),
        value = key(d),
        button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-day";
      button.textContent = String(i);
      button.disabled = !validDate(value);
      button.setAttribute("aria-pressed", String(value === chosenDate));
      button.setAttribute(
        "aria-label",
        d.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }),
      );
      button.addEventListener("click", () => {
        chosenDate = value;
        all(".calendar-day").forEach((b) => b.setAttribute("aria-pressed", "false"));
        button.setAttribute("aria-pressed", "true");
        updateContinue();
      });
      grid.append(button);
    }
    const b = bounds();
    one('[data-month="-1"]').disabled =
      month <= new Date(Date.UTC(b.start.getUTCFullYear(), b.start.getUTCMonth(), 1));
    one('[data-month="1"]').disabled =
      month >= new Date(Date.UTC(b.end.getUTCFullYear(), b.end.getUTCMonth(), 1));
  }
  function updateContinue() {
    one("[data-continue]").disabled = !validDate(chosenDate) || !chosenTime;
  }
  all("[data-month]").forEach((el) =>
    el.addEventListener("click", () => {
      month.setUTCMonth(month.getUTCMonth() + Number(el.dataset.month));
      renderCalendar();
    }),
  );
  all('input[name="time-choice"]').forEach((el) =>
    el.addEventListener("change", () => {
      chosenTime = el.value;
      updateContinue();
    }),
  );
  function showStep(step) {
    one("[data-schedule]").hidden = step === 2;
    one("[data-details]").hidden = step !== 2;
    one(".step-count").textContent = `Step ${step} of 2`;
    one("[data-book-heading]").textContent =
      step === 1 ? "Find a time to connect." : "A little about you.";
    one("[data-book-intro]").textContent =
      step === 1
        ? "Pick your preferred date and time."
        : "Tell us where to reach you and what you have in mind.";
    one("[data-step-line]").classList.toggle("active", step === 2);
    if (step === 2) {
      const f = one('form[data-kind="consultation"]');
      f.elements["Preferred date"].value = chosenDate;
      f.elements["Preferred time"].value = chosenTime;
      one("[data-selection]").textContent =
        new Date(chosenDate + "T00:00:00Z").toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }) +
        " · " +
        chosenTime +
        " · UK time";
      f.elements.name.focus();
    }
  }
  one("[data-continue]")?.addEventListener("click", () => {
    if (validDate(chosenDate) && chosenTime) showStep(2);
  });
  one("[data-back]")?.addEventListener("click", () => {
    showStep(1);
    one("[data-continue]").focus();
  });
  renderCalendar();
  const storage = {
    get(k) {
      try {
        return sessionStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set(k, v) {
      try {
        sessionStorage.setItem(k, v);
      } catch {}
    },
    remove(k) {
      try {
        sessionStorage.removeItem(k);
      } catch {}
    },
  };
  function makeReference(kind) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return (
      (kind === "consultation" ? "ZN-" : "ZE-") +
      [...bytes]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
    );
  }
  const referencePattern = /^(ZE|ZN)-[A-F0-9]{32}$/;
  forms.forEach((form) => {
    form.querySelector('[type="submit"]').disabled = false;
    const kind = form.dataset.kind,
      storeKey = "zenova-reference-" + kind;
    let reference = storage.get(storeKey);
    if (!referencePattern.test(reference || "")) {
      reference = makeReference(kind);
      storage.set(storeKey, reference);
    }
    form.elements.Reference.value = reference;
    form.querySelector("[data-reference]").textContent = "Your reference: " + reference;
    const format = form.elements["Meeting format"];
    if (format)
      format.addEventListener("change", () => {
        const phone = form.elements["Phone number"];
        phone.required = format.value === "Phone call";
        phone.pattern = phone.required ? "[+0-9 ().-]{6,35}" : ".*";
        form.querySelector("[data-phone-label]").textContent = phone.required
          ? "(required)"
          : "(optional)";
      });
    form.addEventListener("submit", (event) => {
      const status = form.querySelector(".form-status");
      status.textContent = "";
      if (form.dataset.sending === "true") {
        event.preventDefault();
        return;
      }
      if (!["http:", "https:"].includes(location.protocol)) {
        event.preventDefault();
        status.textContent =
          "Please use the hosted website to send a request, or contact info@zenovatechnologies.co.uk directly.";
        return;
      }
      form.elements.name.value = form.elements.name.value.trim();
      form.elements.message.value = form.elements.message.value.trim();
      if (
        form.elements.name.value.length < 2 ||
        (kind === "enquiry" && form.elements.message.value.length < 10)
      ) {
        event.preventDefault();
        status.textContent = "Please enter your full name and a message of at least 10 characters.";
        return;
      }
      if (!form.reportValidity()) {
        event.preventDefault();
        return;
      }
      if (form.elements._honey.value) {
        event.preventDefault();
        status.textContent = "Your request could not be sent. Please contact us directly.";
        return;
      }
      if (kind === "consultation" && (!validDate(chosenDate) || !chosenTime)) {
        event.preventDefault();
        showStep(1);
        renderCalendar();
        updateContinue();
        return;
      }
      const next = new URL("thanks.html", location.href);
      next.searchParams.set("reference", reference);
      next.searchParams.set("type", kind);
      form.elements._next.value = next.href;
      form.elements._subject.value = `Zenova ${kind === "consultation" ? "consultation request" : "contact enquiry"} — ${reference}`;
      form.elements["Submitted at (UTC)"].value = new Date().toISOString();
      form.dataset.sending = "true";
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      button.textContent = "Continuing to secure submission…";
      // Native POST retains FormSubmit's default CAPTCHA. The external service
      // returns to thanks.html after its submission flow. No credentials here.
    });
  });
  window.addEventListener("pageshow", () =>
    forms.forEach((f) => {
      delete f.dataset.sending;
      const b = f.querySelector('[type="submit"]');
      b.disabled = false;
      b.textContent =
        f.dataset.kind === "consultation" ? "Request consultation ↗" : "Send enquiry ↗";
    }),
  );
  const thanks = one("#thanks-reference");
  if (thanks) {
    const p = new URLSearchParams(location.search),
      ref = p.get("reference");
    if (referencePattern.test(ref || "")) {
      thanks.textContent = ref;
      const kind = p.get("type");
      if (
        ["enquiry", "consultation"].includes(kind) &&
        storage.get("zenova-reference-" + kind) === ref
      )
        storage.remove("zenova-reference-" + kind);
    }
  }
})();
