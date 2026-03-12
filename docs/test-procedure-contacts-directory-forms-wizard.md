# Test Procedure: Contacts Directory Using Forms Wizard

This document describes manual test steps for verifying the **Contacts Directory** (ContactsWidget) and its integration with the **Forms Wizard** (FormsWidget) for editing contact records.

---

## 1. Prerequisites

| Item | Requirement |
|------|-------------|
| Environment | Local dev (`npm run dev` in `frontend/`) or deployed app |
| Auth | Signed in for Firestore sync; may test without auth for local-only behavior |
| Contacts | Seeded contacts appear after first load (Maya Brooks, Derek Hale, Tina Alvarez, etc.) |

---

## 2. Opening the Contacts Directory

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | Open the app and start a chat | Chat interface loads |
| 2.2 | Ask the assistant to open or show the Contacts Directory (e.g. "Open Contacts Directory", "Show my contacts") | Assistant responds with `[[WIDGET:Contacts]]` and the Contacts Directory widget appears inline |
| 2.3 | Click the widget header (or maximize icon) | Widget expands to full view |

---

## 3. Navigating to Edit Mode (Forms Wizard)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Ensure the Contacts widget is **expanded** (full panel) | Edit button is visible in the top toolbar |
| 3.2 | Select a contact (carousel click, table row, or deck card) | Contact is highlighted; detail panel shows contact info |
| 3.3 | Click **Edit** | Forms Wizard modal opens; title shows `Edit [Contact Name]` |

> **Note:** The Edit button is disabled when no contact is selected. It only appears in expanded view.

---

## 4. Forms Wizard – Wizard Mode (Multi-Step)

The Forms Wizard organizes fields into steps based on `PageBreak` fields in the schema.

### 4.1 Step Navigation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1.1 | Verify stepper bar at top shows step titles (e.g. "Identity & Contact", "Contact Info", etc.) | Steps are listed; current step is highlighted |
| 4.1.2 | Click **Next** | Moves to next step; step indicator updates |
| 4.1.3 | Click **Back** | Returns to previous step |
| 4.1.4 | Click a step pill in the stepper bar | Jumps directly to that step |
| 4.1.5 | On last step, verify **Finish** appears instead of **Next** | Finish button is visible |

### 4.2 Field Types (First Step – Identity)

| Field | Type | Action | Expected Result |
|-------|------|--------|-----------------|
| Full Name / First Name | Name | Edit value | Accepts text; label floats above input |
| Last Name | Name | Edit value | Accepts text |
| Role / Title | Text | Edit value | Accepts text |
| Company | Text | Edit value | Accepts text |
| Category | Enum | Open dropdown | Options: party, provider, vendor |
| Favorite? | Yes/No | Toggle | Switch toggles on/off |

### 4.3 Field Types (Contact Info Step)

| Field | Type | Action | Expected Result |
|-------|------|--------|-----------------|
| Phone | Phone | Enter digits | Validates 10+ digits; formats on blur |
| Email | Email | Enter value | Validates email format |

### 4.4 Field Types (Details Step)

| Field | Type | Action | Expected Result |
|-------|------|--------|-----------------|
| Mailing Address | Address | Edit value | Accepts text |
| Profile Photo | Image | Click to upload | File picker opens; path/file name stored |
| Private Notes | LongText | Edit value | Multi-line text area |

---

## 5. Conditional Fields (Rich Schema)

When the Contacts Directory uses `CONTACTS_DIRECTORY_TABLE_DEF` (tableDef), additional conditional fields appear:

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | Set **Entity Type** to Person / Company / Team / Bot | Dropdown options update |
| 5.2 | Set **Services & Providers** to "Clients" | Home Phone, Home Address, City, State, Zip Code fields appear |
| 5.3 | Set **Services & Providers** to "Vendor Services" | Company Name, Title/Tagline, Business Phone, etc. appear |
| 5.4 | Set **Services & Providers** to "Law Enforcement Agency" | Branch/Category and Job fields appear |
| 5.5 | Set **Branch/Category** | Job dropdown options update based on selection |

---

## 6. Save and Cancel

| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.1 | Click **Cancel** | Modal closes; no changes persisted |
| 6.2 | Edit a contact and click **Finish** | Modal closes; contact record updates in the directory |
| 6.3 | Verify edited fields in detail view | Name, phone, email, notes, etc. reflect changes |
| 6.4 | (Signed in) Refresh page | Changes persist via Firestore sync |

---

## 7. Field Mapping Verification

The `handleSaveContact` logic maps form fields to `ContactRecord`:

| Form Field(s) | ContactRecord Field |
|---------------|---------------------|
| FirstName + LastName | `name` |
| Mobile | `phone` |
| Email | `email` |
| CompanyName | `company` |
| Photo | `imageUrl` |
| HomeAddress | `address` |
| AdditionalInfo | `notes` |

| Step | Action | Verification |
|------|--------|--------------|
| 7.1 | Change First Name and Last Name | Detail view shows combined name |
| 7.2 | Change Mobile | Detail view shows updated phone |
| 7.3 | Change Email | Detail view shows updated email |
| 7.4 | Change Additional Info / Private Notes | Notes section shows updated text |

---

## 8. Search and Filter (Pre-Edit)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 8.1 | Use search box (name, role, company) | Results filter in real time |
| 8.2 | Apply category tabs (All, Parties, Services, Vendors) | Only matching contacts shown |
| 8.3 | Open filter panel (sliders icon); add filter | Active filters appear; list filters accordingly |

---

## 9. View Modes (Expanded)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 9.1 | Toggle view (deck ↔ table ↔ carousel) | Layout changes; same contacts shown |
| 9.2 | Drag split resize handle (table/deck) | List/detail ratio changes |
| 9.3 | Resize panel | Layout remains usable |

---

## 10. Edge Cases

| Scenario | Action | Expected Result |
|----------|--------|-----------------|
| Edit with invalid email | Enter `notanemail` in Email field | Validation error on blur |
| Edit with short phone | Enter `123` in Phone | Validation error (too short) |
| Edit modal overlay | Click outside modal | Modal stays open (click outside may not close) |
| No contact selected | Click Edit | Button disabled |

---

## 11. Firestore Sync (Authenticated)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 11.1 | Sign in with Firebase Auth | Contacts hydrate from Firestore |
| 11.2 | Edit a contact and Finish | Upsert to `contacts` collection |
| 11.3 | Open Firestore Console → `contacts` | Document exists with `ownerId` matching user UID |
| 11.4 | Sign out; sign in as different user | Different contact set (owner-scoped) |

---

## 12. Quick Smoke Checklist

- [ ] Contacts Directory appears when requested
- [ ] Expand widget → select contact → Edit opens Forms Wizard
- [ ] Wizard steps advance via Next/Back and step pills
- [ ] Edit fields → Finish → changes appear in directory
- [ ] Cancel closes without saving
- [ ] Search and filters work
- [ ] (Auth) Changes sync to Firestore after refresh
