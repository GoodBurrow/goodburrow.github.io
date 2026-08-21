# Good Burrow problem-report worker

Receives the form at `https://goodburrow.com/report/` and forwards a text-only report through a Cloudflare email binding. It accepts no file uploads.

Before deployment, the account owner must:

1. Enable Cloudflare Email Routing for `goodburrow.com` and verify the private destination address.
2. Configure `REPORT_RECIPIENT` as a Worker secret containing that verified address.
3. Confirm `reports@goodburrow.com` is an allowed sender for the email binding.
4. Deploy, submit a harmless test report, and verify delivery before publishing the report page or repackaging apps that link to it.
