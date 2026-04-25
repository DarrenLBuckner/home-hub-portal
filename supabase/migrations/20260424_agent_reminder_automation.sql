-- Agent reminder automation
-- 1) Add 4th email template (24-hour final warning)
-- 2) Add profiles.needs_review flag (cron flags accounts >= 45 days inactive)
-- 3) Add admin_emails.sent_by_cron flag (distinguishes cron sends from manual sends)

INSERT INTO email_templates (name, subject, body)
SELECT
  '24hr Account Removal Notice',
  '{{first_name}} — your account is being removed in 24 hours',
  'Hi {{first_name}},

This is your final notice.

Your Guyana HomeHub account has had zero listings for {{days_inactive}} days. We sent you reminders. We offered help. We have not heard back.

Your account will be permanently removed in 24 hours.

If you want to keep your account:
→ Log in now: {{login_url}}
→ Post at least one active listing before the 24-hour window closes

If your account is removed and you want to rejoin later, you will need to reapply and go through the full verification process again. Your spot in the agent directory is not reserved.

If something came up and you need more time, reply to this email right now. I will review it personally.

— Alphius Bookie
Guyana HomeHub Operations
bookie@guyanahomehub.com'
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates WHERE name = '24hr Account Removal Notice'
);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE;

ALTER TABLE admin_emails
  ADD COLUMN IF NOT EXISTS sent_by_cron BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_admin_emails_cron_dedup
  ON admin_emails (recipient_id, template_id, sent_at)
  WHERE sent_by_cron = TRUE;
