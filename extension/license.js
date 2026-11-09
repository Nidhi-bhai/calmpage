/* Calmpage Pro key = the PayPal subscription ID shown after checkout, e.g. I-ABCD1234EFGH.
   Checked offline only. No tracking, no server. */
var CalmLicense = {
  normalize(k) { return String(k || "").trim().toUpperCase().replace(/^CALM-/, ""); },
  valid(k) { return /^I-[A-Z0-9]{12}$/.test(CalmLicense.normalize(k)); },
};
if (typeof module === "object") module.exports = CalmLicense;
