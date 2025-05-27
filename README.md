# Identity Reconciliation Service

This service reconciles contact information by matching emails and phone numbers to avoid duplicates and link related contacts. It ensures a single primary contact with associated secondary contacts.

---

## Features

* Create and reconcile contacts by email and/or phone.
* Find and link existing contacts sharing email or phone.
* Maintain one **primary** contact (the oldest), convert others to **secondary**.
* Merge multiple primary contacts if overlaps exist.
* Return consolidated emails, phone numbers, and secondary contact IDs.
* Prevent duplicate contacts with identical email-phone pairs.

---

## API

### `POST /identify`

**Request:**

```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

**Response:**

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com", "other@example.com"],
    "phoneNumbers": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## Important Notes

* Only one primary contact per user.
* Older primary contact remains primary; others are converted to secondary if overlapping.
* New contact entries are added only if no existing exact match exists.

---
