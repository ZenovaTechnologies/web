/* Google Analytics is blocked until the visitor explicitly accepts analytics. */
(() => {
  "use strict";
  const measurementId = "G-HC7CS2JDNE";
  const storageKey = "zenova-cookie-choice-v1";
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  let loaded = false;
  let returnFocus = null;
  let choice = readChoice();
  window["ga-disable-" + measurementId] = true;

  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey));
      if (
        value &&
        ["accepted", "rejected"].includes(value.analytics) &&
        Number.isFinite(value.savedAt) &&
        value.savedAt <= Date.now() &&
        Date.now() - value.savedAt < lifetime
      )
        return value.analytics;
    } catch {
      /* Storage may be blocked. Default to no analytics. */
    }
    return null;
  }

  function clearAnalyticsCookies() {
    const names = document.cookie
      .split(";")
      .map((item) => item.split("=")[0].trim())
      .filter((name) => name === "_ga" || name.startsWith("_ga_"));
    const host = location.hostname.split(".");
    const domains = ["", ...host.map((_, i) => host.slice(i).join("."))];
    const parts = location.pathname.split("/").filter(Boolean);
    const paths = ["/", ...parts.map((_, i) => "/" + parts.slice(0, i + 1).join("/"))];
    names.forEach((name) =>
      domains.forEach((domain) =>
        paths.forEach((path) => {
          document.cookie = `${name}=; Max-Age=0; path=${path};${domain ? " domain=" + domain + ";" : ""} SameSite=Lax`;
        }),
      ),
    );
  }

  function loadAnalytics() {
    if (loaded || choice !== "accepted") return;
    loaded = true;
    window["ga-disable-" + measurementId] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 15552000,
      cookie_update: false,
      page_location: location.origin + location.pathname,
      page_referrer: cleanReferrer(),
    });
    const tag = document.createElement("script");
    tag.id = "zenova-google-tag";
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
    document.head.appendChild(tag);
  }

  function cleanReferrer() {
    try {
      const url = new URL(document.referrer);
      return url.origin + url.pathname;
    } catch {
      return "";
    }
  }

  function stopAnalytics() {
    window["ga-disable-" + measurementId] = true;
    clearAnalyticsCookies();
  }

  function showSettings() {
    returnFocus = document.activeElement;
    document.getElementById("cookie-banner").hidden = false;
    document.getElementById("cookie-current-choice").textContent = choice
      ? `Current choice: analytics ${choice}.`
      : "Analytics is off until you accept.";
    document.querySelector("[data-cookie-reject]").focus();
  }

  function saveChoice(value) {
    choice = value;
    let persisted = false;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ analytics: value, savedAt: Date.now() }));
      persisted = true;
    } catch {
      /* The choice still applies to this page. */
    }
    document.getElementById("cookie-banner").hidden = true;
    if (value === "accepted") loadAnalytics();
    else {
      stopAnalytics();
      // Reload after withdrawal so previously loaded analytics code is removed.
      if (loaded && persisted) {
        location.reload();
        return;
      }
    }
    if (returnFocus instanceof HTMLElement) returnFocus.focus();
  }

  function init() {
    document
      .querySelectorAll("[data-cookie-settings]")
      .forEach((button) => button.addEventListener("click", showSettings));
    document
      .querySelector("[data-cookie-accept]")
      .addEventListener("click", () => saveChoice("accepted"));
    document
      .querySelector("[data-cookie-reject]")
      .addEventListener("click", () => saveChoice("rejected"));
    if (choice === "accepted") loadAnalytics();
    else stopAnalytics();
    document.getElementById("cookie-banner").hidden = choice !== null;
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    choice = readChoice();
    if (choice === "accepted") loadAnalytics();
    else {
      stopAnalytics();
      if (loaded) location.reload();
    }
    document.getElementById("cookie-banner").hidden = choice !== null;
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
