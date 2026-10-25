const sanitizeHtml = require("sanitize-html");

// Deliberately small - this is formatting for a short admin notice, not a
// rich document editor, and keeping the allowlist tight limits how much
// damage a compromised admin account could do with it (it's rendered via
// dangerouslySetInnerHTML for every member on every page load).
const ANNOUNCEMENT_SANITIZE_OPTIONS = {
  // "div" matters here specifically because Chrome wraps each new line
  // typed in a contentEditable box in its own <div> on Enter (not <br>) -
  // without it in the allowlist, sanitize-html was unwrapping those divs
  // and silently flattening every line break the admin typed.
  allowedTags: ["b", "strong", "i", "em", "u", "a", "br", "p", "div", "ul", "ol", "li", "span"],
  allowedAttributes: { a: ["href", "target", "rel"], span: ["style"] },
  allowedStyles: { span: { color: [/^#[0-9a-fA-F]{3,6}$/] } },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

function sanitizeAnnouncementHtml(html) {
  return sanitizeHtml(html || "", ANNOUNCEMENT_SANITIZE_OPTIONS).trim();
}

module.exports = { sanitizeAnnouncementHtml };
