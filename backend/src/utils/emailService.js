const { Resend } = require("resend");
const User = require("../models/User");
const Book = require("../models/Book");

const DIGEST_WINDOWS_DAYS = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

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
// sendDueDigests() on a schedule.
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

// Scheduled job (see notificationScheduler.js) - checks every non-immediate
// frequency for users who are due, and sends each their own personal digest
// of what's new since their lastNotifiedAt.
async function sendDueDigests() {
  for (const [frequency, days] of Object.entries(DIGEST_WINDOWS_DAYS)) {
    const windowMs = days * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - windowMs);

    let users;
    try {
      users = await User.find({
        notificationFrequency: frequency,
        status: "approved",
        $or: [{ lastNotifiedAt: null }, { lastNotifiedAt: { $lte: cutoff } }],
      }).select("_id email lastNotifiedAt");
    } catch (error) {
      console.error(`Failed to load ${frequency} digest recipients:`, error);
      continue;
    }

    for (const user of users) {
      try {
        const since = user.lastNotifiedAt || new Date(Date.now() - windowMs);
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
}

function buildRequestFulfilledHtml(title, author) {
  const frontendUrl = getFrontendUrl();
  const bodyHtml = `
    <p style="font-size:16px; color:#111827; margin:0 0 8px;">Boken du ba om er nå lagt til i biblioteket:</p>
    <div style="margin:16px 0; padding:16px; background:#f9fafb; border-radius:12px;">
      <div style="font-size:16px; font-weight:bold; color:#111827;">${title}</div>
      <div style="font-size:14px; color:#6b7280;">${author}</div>
    </div>
    ${
      frontendUrl
        ? `<a href="${frontendUrl}/books" style="display:inline-block; margin-top:8px; padding:10px 20px; background:#667eea; color:#ffffff; border-radius:999px; text-decoration:none; font-weight:bold; font-size:14px;">Se biblioteket</a>`
        : ""
    }`;

  return renderEmailLayout({ heading: "Forespørselen din er innfridd! 📖", bodyHtml, frontendUrl });
}

// Always immediate, regardless of notificationFrequency - this is a direct
// response to the user's own request, not a general catalog broadcast.
// Caller is responsible for checking the user's notifyOnRequestFulfilled
// preference before calling this.
async function notifyRequestFulfilled({ email, title, author }) {
  if (!email) return;

  try {
    const client = getClient();
    if (!client || !process.env.RESEND_FROM_EMAIL) {
      console.error("Resend not configured - skipping request-fulfilled email to", email);
      return;
    }

    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: `📖 Boken du ba om er lagt til: ${title}`,
      html: buildRequestFulfilledHtml(title, author),
    });
  } catch (error) {
    console.error("Failed to send request-fulfilled email to", email, error);
  }
}

module.exports = { notifyUpdates, sendDueDigests, notifyRequestFulfilled };
