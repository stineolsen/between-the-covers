# 🇳🇴 Norwegian Translation Guide

This guide provides exact translations for all remaining English text in the application.
Use Ctrl+F to find the English text in each file and replace with the Norwegian equivalent.

## Translation Rules
- **Members**: Alltid bruk "medlemmer" (ikke deltakere eller personer)
- **RSVP**: Bruk "Meld deg på/av" eller "Påmelding"
- **Save**: Alltid bruk "Lagre endringer" for konsistens
- **Status updates**: Bruk "oppdatert" ikke "lagret"

---

## 1. RegisterForm.jsx
**File**: `frontend/src/components/auth/RegisterForm.jsx`

### Title & Description
```javascript
// Line 66-67
<h2 className="text-5xl font-bold gradient-text mb-3">✨ Join Our Bookclub</h2>
<p className="mt-2 text-gray-600 text-lg font-medium">Create your account (pending approval)</p>
```
**Replace with:**
```javascript
<h2 className="text-5xl font-bold gradient-text mb-3">✨ Bli med i bokklubben vår</h2>
<p className="mt-2 text-gray-600 text-lg font-medium">Opprett konto (venter på godkjenning)</p>
```

### Error Messages
```javascript
// Line 34
setError('Passwords do not match');
// Line 40
setError('Password must be at least 6 characters');
```
**Replace with:**
```javascript
setError('Passordene stemmer ikke overens');
setError('Passordet må være minst 6 tegn');
```

### Form Labels & Placeholders
```javascript
// Line 85
👤 Username
placeholder="bookworm123"

// Line 101
📧 Email Address
placeholder="you@example.com"

// Line 117
✨ Display Name (Optional)
placeholder="Jane Doe"

// Line 132
🔒 Password

// Line 148
🔐 Confirm Password

// Line 167
{loading ? '⏳ Creating Account...' : '🚀 Register'}
```
**Replace with:**
```javascript
👤 Brukernavn
placeholder="bokormen123"

📧 E-postadresse
placeholder="deg@eksempel.com"

✨ Visningsnavn (valgfritt)
placeholder="Ola Nordmann"

🔒 Passord

🔒 Bekreft passord

{loading ? '⏳ Oppretter konto...' : '🚀 Registrer'}
```

### Footer Link
```javascript
// Line 173-175
Already have an account?{' '}
<Link to="/login" className="font-bold hover:underline" style={{ color: '#f5576c' }}>
  Sign in here ✨
```
**Replace with:**
```javascript
Har du allerede en konto?{' '}
<Link to="/login" className="font-bold hover:underline" style={{ color: '#f5576c' }}>
  Logg inn her ✨
```

---

## 2. ReviewList.jsx
**File**: `frontend/src/components/reviews/ReviewList.jsx`

### Loading & Empty States
```javascript
// Line 30
<p className="text-gray-600 font-medium">Loading reviews...</p>

// Line 39
<p className="text-gray-700 font-bold text-lg">No reviews yet</p>

// Line 83
{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
```
**Replace with:**
```javascript
<p className="text-gray-600 font-medium">Laster anmeldelser...</p>

<p className="text-gray-700 font-bold text-lg">Ingen anmeldelser ennå</p>

{reviews.length} {reviews.length === 1 ? 'anmeldelse' : 'anmeldelser'}
```

---

## 3. ReviewCard.jsx
**File**: `frontend/src/components/reviews/ReviewCard.jsx`

### Spoiler Buttons
```javascript
// Look for these strings:
'Show Spoilers'
'Hide Spoilers'
'Edit'
'Delete'
```
**Replace with:**
```javascript
'Vis spoilere'
'Skjul spoilere'
'Rediger'
'Slett'
```

---

## 4. ReviewForm.jsx
**File**: `frontend/src/components/reviews/ReviewForm.jsx`

### Form Labels
```javascript
// Find and replace:
'Write a Review' → 'Skriv en anmeldelse'
'Edit Review' → 'Rediger anmeldelse'
'Rating' → 'Vurdering'
'Title' → 'Tittel'
'Your Review' → 'Din anmeldelse'
'Reading Date' → 'Lesedato'
'Contains Spoilers' → 'Inneholder spoilere'
'Submit Review' → 'Send inn anmeldelse'
'Update Review' → 'Oppdater anmeldelse'
'Cancel' → 'Avbryt'
'Submitting...' → 'Sender inn...'
'Updating...' → 'Oppdaterer...'
```

---

## 5. MeetingCard.jsx
**File**: `frontend/src/components/meetings/MeetingCard.jsx`

### Status & Labels
```javascript
// Status badges (around line 31-39)
case 'upcoming':
  return 'linear-gradient(135deg, #667eea, #764ba2)';
case 'past':
  return 'linear-gradient(135deg, #f093fb, #f5576c)';
case 'cancelled':
  return 'linear-gradient(135deg, #6b7280, #4b5563)';
```
**Find the status display and change text:**
```javascript
// Status text display (around line 64)
'Upcoming' → 'Kommende'
'Past' → 'Tidligere'
'Cancelled' → 'Avlyst'

// Around line 107
'Discussing:' → 'Diskuterer:'

// Around line 126 (attendee count)
{attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} attending
```
**Replace with:**
```javascript
{attendeeCount} {attendeeCount === 1 ? 'medlem' : 'medlemmer'} påmeldt

// Around line 130
'(Max:' → '(Maks:'

// Around line 174
'Meeting Notes:' → 'Møtenotater:'

// RSVP Button (around line 195)
'Processing...' → 'Behandler...'
'✓ Attending' → '✓ Påmeldt'
'Meeting Full' → 'Møtet er fullt'
'+ RSVP' → '+ Meld deg på'

// Admin buttons (around line 207, 213)
'✏️ Edit' → '✏️ Rediger'
'🗑️ Delete' → '🗑️ Slett'

// Created by (around line 223)
'Created by' → 'Opprettet av'
```

---

## 6. MeetingForm.jsx
**File**: `frontend/src/components/meetings/MeetingForm.jsx`

### Form Title & Labels
```javascript
// Line 95
'✏️ Edit Meeting' → '✏️ Rediger møte'
'✨ Create New Meeting' → '✨ Opprett nytt møte'

// Form labels:
'Meeting Title' → 'Møtetittel'
'Date' → 'Dato'
'Time' → 'Tidspunkt'
'Location' → 'Sted'
'Description / Agenda' → 'Beskrivelse / Agenda'
'📚 Related Book (Optional)' → '📚 Relatert bok (valgfritt)'
'No book selected' → 'Ingen bok valgt'
'Maximum Attendees (0 = unlimited)' → 'Maksimalt antall medlemmer (0 = ubegrenset)'
'Status' → 'Status'

// Status options:
'Upcoming' → 'Kommende'
'Past' → 'Tidligere'
'Cancelled' → 'Avlyst'

'Meeting Notes / Summary' → 'Møtenotater / Sammendrag'

// Buttons (around line 263)
{loading ? (isEditing ? '⏳ Updating...' : '⏳ Creating...') : (isEditing ? '✏️ Update Meeting' : '✨ Create Meeting')}
```
**Replace with:**
```javascript
{loading ? (isEditing ? '⏳ Oppdaterer...' : '⏳ Oppretter...') : (isEditing ? '✏️ Oppdater møte' : '✨ Opprett møte')}

// Cancel button:
'Cancel' → 'Avbryt'
```

---

## 7. NextMeeting.jsx
**File**: `frontend/src/components/meetings/NextMeeting.jsx`

### Title & Time Display
```javascript
// Find these strings:
'Next Meeting' → 'Neste møte'
'Today at' → 'I dag klokken'
'Tomorrow at' → 'I morgen klokken'

// For days calculation (look for template string with 'in'):
`in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`
```
**Replace with:**
```javascript
`om ${daysUntil} ${daysUntil === 1 ? 'dag' : 'dager'}`
```

### Same translations as MeetingCard for:
- 'Discussing:' → 'Diskuterer:'
- Attendee count with "medlemmer"
- RSVP button states
- "Påmeldt" / "Meld deg på"

---

## 8. BookForm.jsx
**File**: `frontend/src/components/books/BookForm.jsx`

### Form Labels
```javascript
'Add New Book' → 'Legg til ny bok'
'Edit Book' → 'Rediger bok'
'Title' → 'Tittel'
'Author' → 'Forfatter'
'ISBN' → 'ISBN'
'Description' → 'Beskrivelse'
'Published Year' → 'Utgivelsesår'
'Page Count' → 'Antall sider'
'Publisher' → 'Forlag'
'Language' → 'Språk'
'Genres' → 'Sjangere'
'Cover Image' → 'Omslagsbilde'
'Upload Cover' → 'Last opp omslag'
'Bookclub Month' → 'Bokklubb måned'
'Not a bookclub book' → 'Ikke en bokklubb-bok'

// Buttons:
'Save Changes' → 'Lagre endringer'
'Create Book' → 'Opprett bok'
'Update Book' → 'Oppdater bok'
'Cancel' → 'Avbryt'
'Saving...' → 'Lagrer...'
```

---

## 9. StatusSelector.jsx
**File**: `frontend/src/components/books/StatusSelector.jsx`

### Reading Status Options
```javascript
'To Read' → 'Skal lese'
'Currently Reading' → 'Leser nå'
'Read' → 'Lest'
'Update Status' → 'Oppdater status'
'Set Reading Status' → 'Sett lesestatus'
```

---

## 10. ProductForm.jsx
**File**: `frontend/src/components/shop/ProductForm.jsx`

### Form Labels
```javascript
'Add New Product' → 'Legg til nytt produkt'
'Edit Product' → 'Rediger produkt'
'Product Name' → 'Produktnavn'
'Description' → 'Beskrivelse'
'Price' → 'Pris'
'Stock' → 'Lager'
'Category' → 'Kategori'
'Related Book' → 'Relatert bok'
'No book selected' → 'Ingen bok valgt'
'Product Image' → 'Produktbilde'
'Available' → 'Tilgjengelig'
'Save Changes' → 'Lagre endringer'
'Create Product' → 'Opprett produkt'
'Cancel' → 'Avbryt'
```

---

## 11. Admin Page
**File**: `frontend/src/pages/Admin.jsx`

### Tab Names & Headers
```javascript
'Pending Users' → 'Ventende brukere'
'Books' → 'Bøker'
'Products' → 'Produkter'
'Orders' → 'Bestillinger'
'Meetings' → 'Møter'

// Table headers:
'Username' → 'Brukernavn'
'Email' → 'E-post'
'Status' → 'Status'
'Actions' → 'Handlinger'
'Approve' → 'Godkjenn'
'Reject' → 'Avvis'
'Delete' → 'Slett'
'Edit' → 'Rediger'
'Customer' → 'Kunde'
'Total' → 'Total'
'Items' → 'Varer'
'Order Date' → 'Bestillingsdato'
'View Details' → 'Vis detaljer'
```

---

## 12. Navbar/Layout
**File**: `frontend/src/components/layout/Navbar.jsx` (if exists)

### Navigation Links
```javascript
'Home' → 'Hjem'
'Books' → 'Bøker'
'Meetings' → 'Møter'
'Shop' → 'Butikk'
'Profile' → 'Profil'
'Admin' → 'Admin'
'Login' → 'Logg inn'
'Logout' → 'Logg ut'
'Register' → 'Registrer'
```

---

## 13. Common Toast Messages

Search across all files for these patterns and replace:

```javascript
// Success messages:
'successfully' → 'med suksess'
'created successfully' → 'opprettet'
'updated successfully' → 'oppdatert'
'deleted successfully' → 'slettet'
'uploaded successfully' → 'lastet opp med suksess'

// Error messages:
'Failed to' → 'Greide ikke'
'Failed to create' → 'Greide ikke opprette'
'Failed to update' → 'Greide ikke oppdatere'
'Failed to delete' → 'Greide ikke slette'
'Failed to upload' → 'Greide ikke laste opp'
'Failed to fetch' → 'Greide ikke hente'

// Confirmation dialogs:
'Are you sure?' → 'Er du sikker?'
'This action cannot be undone' → 'Denne handlingen kan ikke angres'
'Are you sure you want to delete' → 'Er du sikker på at du vil slette'
```

---

## Quick Find & Replace Commands

Use your editor's find & replace (Ctrl+H) with these patterns:

### Across all `.jsx` files:

1. **Buttons:**
   - `>Edit<` → `>Rediger<`
   - `>Delete<` → `>Slett<`
   - `>Cancel<` → `>Avbryt<`
   - `>Save<` → `>Lagre endringer<`
   - `>Create<` → `>Opprett<`
   - `>Update<` → `>Oppdater<`

2. **Status:**
   - `Loading...` → `Laster...`
   - `Saving...` → `Lagrer...`
   - `Uploading...` → `Laster opp...`
   - `Processing...` → `Behandler...`

3. **Plurals:**
   - Replace carefully with context:
   - `person` → `medlem`
   - `people` → `medlemmer`
   - `attendee` → `medlem`
   - `attendees` → `medlemmer`

---

## Testing Checklist

After translations, test these user flows:

- [ ] Login page
- [ ] Register page
- [ ] Profile editing & avatar upload
- [ ] Create/edit review
- [ ] Create/edit meeting
- [ ] RSVP to meeting
- [ ] Create/edit book (admin)
- [ ] Create/edit product (admin)
- [ ] View orders (admin)
- [ ] All error messages display in Norwegian
- [ ] All success toasts display in Norwegian
- [ ] Confirm dialogs are in Norwegian

---

## Notes

- Be consistent with formality (use "du" form throughout, not "De")
- Keep emojis - they're language-independent
- Maintain the same capitalization style as English version
- Test on both mobile and desktop after translation
- Double-check pluralization logic in template strings

---

## Priority Order

If doing translations incrementally, prioritize in this order:

1. ✅ **Auth forms** (Login, Register) - DONE
2. ✅ **Profile page** - DONE
3. **Meeting components** (most user-facing)
4. **Review components** (high visibility)
5. **Book forms** (admin-facing)
6. **Shop components**
7. **Admin page**
8. **Misc components**
