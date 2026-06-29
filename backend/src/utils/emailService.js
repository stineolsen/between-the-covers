const { Resend } = require("resend");
const User = require("../models/User");
const Book = require("../models/Book");
const BookRequest = require("../models/BookRequest");

const REQUEST_NOTIFY_DELAY_MS = 5 * 60 * 1000;

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "").replace(/\/$/, "");
}

// Email clients (especially Outlook) need table-based layouts and inline
// styles - no flexbox/grid, and gradients are unreliable, so we use solid
// brand colors instead of the site's CSS gradients.
function renderEmailLayout({ heading, bodyHtml, frontendUrl }) {
  const logoUrl = frontendUrl ? `${frontendUrl}/logo_croppped.png` : null;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:32px 16px; font-family:Arial, Helvetica, sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#ffffff; border-radius:16px; overflow:hidden;">
        <tr>
          <td style="background:#667eea; padding:28px 32px; text-align:center;">
            ${logoUrl ? `<img src="${logoUrl}" alt="Between the Covers" width="64" style="display:block; margin:0 auto 12px; border-radius:12px;" />` : ""}
            <span style="color:#ffffff; font-size:20px; font-weight:bold;">Between the Covers</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px; font-size:20px; color:#111827;">${heading}</h1>
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb; padding:20px 32px; text-align:center; font-size:12px; color:#6b7280;">
            ${frontendUrl ? `<a href="${frontendUrl}/profile" style="color:#667eea; text-decoration:none;">Endre varslingsinnstillinger</a>` : "Bokklubben"}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

function renderBookRow(book, frontendUrl) {
  const link = frontendUrl ? `${frontendUrl}/books/${book._id}` : null;
  const titleHtml = link
    ? `<a href="${link}" style="color:#111827; text-decoration:none;">${book.title}</a>`
    : book.title;

  return `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #f3f4f6;">
        <div style="font-size:16px; font-weight:bold; color:#111827;">${titleHtml}</div>
        <div style="font-size:14px; color:#6b7280;">${book.author}</div>
      </td>
    </tr>`;
}

function renderSection(title, books, frontendUrl) {
  if (!books || books.length === 0) return "";
  const rows = books.map((b) => renderBookRow(b, frontendUrl)).join("");
  return `
    <h2 style="margin:24px 0 8px; font-size:15px; color:#667eea;">${title}</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

function buildHeading(newBooks, newAudiobooks) {
  const hasBooks = newBooks.length > 0;
  const hasAudiobooks = newAudiobooks.length > 0;

  if (hasBooks && hasAudiobooks) return "Nytt i biblioteket! 📚🎧";
  if (hasAudiobooks) {
    return newAudiobooks.length === 1
      ? "En ny lydbok er klar! 🎧"
      : `${newAudiobooks.length} nye lydbøker er klare! 🎧`;
  }
  return newBooks.length === 1
    ? "En ny bok er lagt til! 📚"
    : `${newBooks.length} nye bøker er lagt til! 📚`;
}

function buildSubject(newBooks, newAudiobooks) {
  const hasBooks = newBooks.length > 0;
  const hasAudiobooks = newAudiobooks.length > 0;

  if (hasBooks && hasAudiobooks) {
    return `📚🎧 ${newBooks.length} nye bøker, ${newAudiobooks.length} nye lydbøker`;
  }
  if (hasAudiobooks) {
    return newAudiobooks.length === 1
      ? `🎧 Ny lydbok: ${newAudiobooks[0].title}`
      : `🎧 ${newAudiobooks.length} nye lydbøker`;
  }
  return newBooks.length === 1
    ? `📚 Ny bok lagt til: ${newBooks[0].title}`
    : `📚 ${newBooks.length} nye bøker lagt til`;
}

function buildUpdatesEmailHtml(newBooks, newAudiobooks) {
  const frontendUrl = getFrontendUrl();
  const bodyHtml =
    renderSection("📚 Nye bøker", newBooks, frontendUrl) +
    renderSection("🎧 Nye lydbøker", newAudiobooks, frontendUrl);

  return renderEmailLayout({
    heading: buildHeading(newBooks, newAudiobooks),
    bodyHtml,
    frontendUrl,
  });
}

async function sendUpdatesEmail(toEmail, newBooks, newAudiobooks) {
  const client = getClient();
  if (!client || !process.env.RESEND_FROM_EMAIL) {
    console.error("Resend not configured - skipping notification email to", toEmail);
    return;
  }

  await client.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: toEmail,
    subject: buildSubject(newBooks, newAudiobooks),
    html: buildUpdatesEmailHtml(newBooks, newAudiobooks),
  });
}

// Fire-and-forget: failures are logged, never thrown, so callers can call
// this without awaiting and without risking the request that triggered it.
// Only handles "immediate" subscribers - digest frequencies are handled by
// sendDigestsFor() on a schedule.
async function notifyUpdates({ newBooks = [], newAudiobooks = [] } = {}) {
  if (newBooks.length === 0 && newAudiobooks.length === 0) return;

  try {
    const recipients = await User.find({
      notificationFrequency: "immediate",
      status: "approved",
    }).select("_id email");

    for (const recipient of recipients) {
      try {
        await sendUpdatesEmail(recipient.email, newBooks, newAudiobooks);
        await User.findByIdAndUpdate(recipient._id, { lastNotifiedAt: new Date() });
      } catch (error) {
        console.error("Failed to send notification email to", recipient.email, error);
      }
    }
  } catch (error) {
    console.error("notifyUpdates failed:", error);
  }
}

// Scheduled job (see notificationScheduler.js) - called once per frequency,
// each on its own cron trigger already timed to the right cadence (e.g. the
// "weekly" trigger only fires Mondays), so every approved user with this
// frequency is processed every time this runs - no extra due/elapsed check
// needed here. lastNotifiedAt is only used as the "what's new since" floor
// for the content query (and falls back to sinceFloorDays for someone who
// has never been notified yet, so a brand-new subscriber doesn't get dumped
// their entire historical catalog).
async function sendDigestsFor(frequency, sinceFloorDays) {
  let users;
  try {
    users = await User.find({
      notificationFrequency: frequency,
      status: "approved",
    }).select("_id email lastNotifiedAt");
  } catch (error) {
    console.error(`Failed to load ${frequency} digest recipients:`, error);
    return;
  }

  for (const user of users) {
    try {
      const since = user.lastNotifiedAt || new Date(Date.now() - sinceFloorDays * 24 * 60 * 60 * 1000);
      const [newBooks, newAudiobooks] = await Promise.all([
        Book.find({ createdAt: { $gt: since } }).select("title author").lean(),
        Book.find({ absUpdatedAt: { $gt: since } }).select("title author").lean(),
      ]);

      if (newBooks.length === 0 && newAudiobooks.length === 0) continue;

      await sendUpdatesEmail(user.email, newBooks, newAudiobooks);
      await User.findByIdAndUpdate(user._id, { lastNotifiedAt: new Date() });
    } catch (error) {
      console.error(`Failed to send ${frequency} digest to`, user.email, error);
    }
  }
}

// addedBook is the catalog Book the admin linked when marking the request
// added (optional - older requests or ones the admin didn't bother linking
// just show the originally requested title/author with no link).
function buildRequestFulfilledHtml(request, addedBook) {
  const frontendUrl = getFrontendUrl();
  const bookLink = addedBook && frontendUrl ? `${frontendUrl}/books/${addedBook._id}` : null;

  const requestedBlock = `
    <p style="font-size:13px; color:#6b7280; margin:0 0 4px; text-transform:uppercase; letter-spacing:0.05em;">Du ba om</p>
    <div style="margin:0 0 16px; padding:16px; background:#f9fafb; border-radius:12px;">
      <div style="font-size:16px; font-weight:bold; color:#111827;">${request.title}</div>
      <div style="font-size:14px; color:#6b7280;">${request.author}</div>
    </div>`;

  const addedBlock = addedBook
    ? `
    <p style="font-size:13px; color:#6b7280; margin:0 0 4px; text-transform:uppercase; letter-spacing:0.05em;">Lagt til i biblioteket</p>
    <div style="margin:0 0 16px; padding:16px; background:#eef2ff; border-radius:12px;">
      <div style="font-size:16px; font-weight:bold; color:#111827;">
        ${bookLink ? `<a href="${bookLink}" style="color:#111827; text-decoration:none;">${addedBook.title}</a>` : addedBook.title}
      </div>
      <div style="font-size:14px; color:#6b7280;">${addedBook.author}</div>
    </div>`
    : "";

  const ctaLink = bookLink || (frontendUrl ? `${frontendUrl}/books` : null);
  const ctaLabel = bookLink ? "Se boken" : "Se biblioteket";
  const bodyHtml =
    requestedBlock +
    addedBlock +
    (ctaLink
      ? `<a href="${ctaLink}" style="display:inline-block; margin-top:8px; padding:10px 20px; background:#667eea; color:#ffffff; border-radius:999px; text-decoration:none; font-weight:bold; font-size:14px;">${ctaLabel}</a>`
      : "");

  return renderEmailLayout({ heading: "Forespørselen din er innfridd! 📖", bodyHtml, frontendUrl });
}

async function sendRequestFulfilledEmail(email, request, addedBook) {
  const client = getClient();
  if (!client || !process.env.RESEND_FROM_EMAIL) {
    console.error("Resend not configured - skipping request-fulfilled email to", email);
    return;
  }

  await client.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: `📖 Boken du ba om er lagt til: ${addedBook ? addedBook.title : request.title}`,
    html: buildRequestFulfilledHtml(request, addedBook),
  });
}

// Scheduled job (see notificationScheduler.js) - runs frequently (every
// minute) looking for requests marked "added" at least 5 minutes ago that
// haven't been processed yet. The delay is deliberate: it gives the admin
// a moment to actually finish adding the book before we tell the requester
// it's there. notifiedRequesterAt is set whether or not an email was sent
// (e.g. the requester isn't opted in), so each request is only ever
// processed once.
async function sendPendingRequestNotifications() {
  const cutoff = new Date(Date.now() - REQUEST_NOTIFY_DELAY_MS);

  let requests;
  try {
    requests = await BookRequest.find({
      status: "added",
      notifiedRequesterAt: null,
      addedAt: { $lte: cutoff },
    })
      .populate("requestedBy", "email notifyOnRequestFulfilled")
      .populate("addedBook", "title author");
  } catch (error) {
    console.error("Failed to load pending request notifications:", error);
    return;
  }

  for (const request of requests) {
    try {
      if (request.requestedBy?.notifyOnRequestFulfilled) {
        await sendRequestFulfilledEmail(request.requestedBy.email, request, request.addedBook);
      }
      request.notifiedRequesterAt = new Date();
      await request.save();
    } catch (error) {
      console.error("Failed to process pending request notification for", request._id, error);
    }
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAnnouncementHtml(message) {
  const frontendUrl = getFrontendUrl();
  const bodyHtml = message
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="font-size:15px; color:#111827; margin:0 0 12px; line-height:1.5;">${escapeHtml(line)}</p>`)
    .join("");

  return renderEmailLayout({ heading: "Nyheter fra Between the Covers 🔔", bodyHtml, frontendUrl });
}

async function sendAnnouncementEmail(email, subject, message) {
  const client = getClient();
  if (!client || !process.env.RESEND_FROM_EMAIL) {
    console.error("Resend not configured - skipping announcement email to", email);
    return;
  }

  await client.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject,
    html: buildAnnouncementHtml(message),
  });
}

// Admin-triggered broadcast (e.g. "we just shipped X") - not tied to any
// book data or schedule, sent immediately to everyone opted into feature
// alerts. Unlike the other notify* functions this isn't fire-and-forget:
// the admin route awaits it so it can report back how many emails went out.
async function sendFeatureAlert({ subject, message }) {
  const recipients = await User.find({
    notifyOnFeatureAlerts: true,
    status: "approved",
  }).select("email");

  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    try {
      await sendAnnouncementEmail(recipient.email, subject, message);
      sent++;
    } catch (error) {
      console.error("Failed to send feature alert to", recipient.email, error);
      failed++;
    }
  }

  return { recipients: recipients.length, sent, failed };
}

function getAdminRecipients(opOptInField) {
  return User.find({ role: "admin", status: "approved", [opOptInField]: true }).select("email");
}

function buildNewRequestHtml(request) {
  const frontendUrl = getFrontendUrl();
  const formatLabels = { ebook: "📱 E-bok", audiobook: "🎧 Lydbok" };
  const formatsText = (request.formats || []).map((f) => formatLabels[f] || f).join(", ");

  const bodyHtml = `
    <div style="margin:0 0 8px; padding:16px; background:#f9fafb; border-radius:12px;">
      <div style="font-size:16px; font-weight:bold; color:#111827;">${request.title}</div>
      <div style="font-size:14px; color:#6b7280;">${request.author}</div>
      ${formatsText ? `<div style="font-size:13px; color:#6b7280; margin-top:6px;">${formatsText}</div>` : ""}
    </div>
    <p style="font-size:14px; color:#6b7280; margin:0 0 16px;">Fra: <strong>${request.requesterName}</strong></p>
    ${
      frontendUrl
        ? `<a href="${frontendUrl}/admin" style="display:inline-block; padding:10px 20px; background:#667eea; color:#ffffff; border-radius:999px; text-decoration:none; font-weight:bold; font-size:14px;">Se i admin</a>`
        : ""
    }`;

  return renderEmailLayout({ heading: "Ny bokforespørsel! 📋", bodyHtml, frontendUrl });
}

// Fire-and-forget admin alert - request is a plain object ({ title, author,
// formats, requesterName }), not a Mongoose doc, so the controller doesn't
// need to populate anything just for this.
async function notifyAdminsNewRequest(request) {
  try {
    const client = getClient();
    if (!client || !process.env.RESEND_FROM_EMAIL) {
      console.error("Resend not configured - skipping new-request admin alert");
      return;
    }

    const admins = await getAdminRecipients("notifyOnNewRequest");
    for (const admin of admins) {
      try {
        await client.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: admin.email,
          subject: `📋 Ny bokforespørsel: ${request.title}`,
          html: buildNewRequestHtml(request),
        });
      } catch (error) {
        console.error("Failed to send new-request alert to", admin.email, error);
      }
    }
  } catch (error) {
    console.error("notifyAdminsNewRequest failed:", error);
  }
}

function buildNewOrderHtml(order) {
  const frontendUrl = getFrontendUrl();
  const itemRows = order.items
    .map((item) => `<div style="font-size:14px; color:#111827; margin-bottom:4px;">${item.quantity}x ${item.productName}</div>`)
    .join("");

  const bodyHtml = `
    <p style="font-size:14px; color:#6b7280; margin:0 0 8px;">Fra: <strong>${order.customerName}</strong> (${order.customerEmail})</p>
    <div style="margin:0 0 16px; padding:16px; background:#f9fafb; border-radius:12px;">
      ${itemRows}
      <div style="font-size:16px; font-weight:bold; color:#111827; margin-top:8px; padding-top:8px; border-top:1px solid #e5e7eb;">
        Totalt: ${order.totalAmount.toFixed(2)} kr
      </div>
    </div>
    ${
      frontendUrl
        ? `<a href="${frontendUrl}/admin" style="display:inline-block; padding:10px 20px; background:#667eea; color:#ffffff; border-radius:999px; text-decoration:none; font-weight:bold; font-size:14px;">Se i admin</a>`
        : ""
    }`;

  return renderEmailLayout({ heading: "Ny bestilling! 🛍️", bodyHtml, frontendUrl });
}

// Fire-and-forget admin alert - order is the Order doc returned by
// Order.create(), which already has everything needed (no populate needed).
async function notifyAdminsNewOrder(order) {
  try {
    const client = getClient();
    if (!client || !process.env.RESEND_FROM_EMAIL) {
      console.error("Resend not configured - skipping new-order admin alert");
      return;
    }

    const admins = await getAdminRecipients("notifyOnNewOrder");
    for (const admin of admins) {
      try {
        await client.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: admin.email,
          subject: `🛍️ Ny bestilling fra ${order.customerName}`,
          html: buildNewOrderHtml(order),
        });
      } catch (error) {
        console.error("Failed to send new-order alert to", admin.email, error);
      }
    }
  } catch (error) {
    console.error("notifyAdminsNewOrder failed:", error);
  }
}

module.exports = {
  notifyUpdates,
  sendDigestsFor,
  sendPendingRequestNotifications,
  sendFeatureAlert,
  notifyAdminsNewRequest,
  notifyAdminsNewOrder,
};
