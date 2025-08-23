# Email Notification Setup with Resend.com

## Prerequisites
- Resend.com account
- API key added to `.env.local` as `RESEND_API_KEY`
- `resend` package installed (`npm install resend`)

## How It Works
- When an admin approves, denies, or requests more info for an application, the dashboard calls `/api/send-status-email`.
- The API route sends an email to the applicant with their status and any admin note.
- If approved, the email includes a payment link.

## API Route
- Location: `src/pages/api/send-status-email.ts`
- Uses Resend SDK to send transactional emails.
- Expects POST requests with:
  - `email`: recipient's email
  - `name`: recipient's name
  - `status`: new status (approved, denied, needs_more_info)
  - `note`: optional admin note
  - `paymentLink`: optional payment URL

## Dashboard Integration
- In `ApplicationList.tsx`, after status change, the dashboard calls the API route with applicant info.
- Example call:
```js
await fetch("/api/send-status-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: app.email,
    name: `${app.first_name} ${app.last_name}`,
    status: "approved", // or "denied", "needs_more_info"
    note: "Optional admin note",
    paymentLink: "https://yourdomain.com/pay?..." // only for approved
  }),
});
```

## Customizing Email Content
- Edit the API route to change subject, body, or sender address.
- You can add HTML formatting or branding as needed.

## Testing
- Change an application's status in the dashboard.
- Check the applicant's email inbox for the notification.
- Review logs/errors in the dashboard and API route for troubleshooting.

---

Let your developer know if you want to customize the email template or add more notification types.
