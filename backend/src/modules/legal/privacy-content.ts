export const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Privacy Policy – Mascot</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 24px; color: #1a1a1a; }
    h1 { font-size: 1.5rem; margin-top: 0; }
    h2 { font-size: 1.1rem; margin-top: 1.5em; }
    p, li { margin: 0.5em 0; }
    ul { padding-left: 1.2em; }
    a { color: #0d6efd; }
    .updated { font-size: 0.9rem; color: #666; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: February 2025</p>

  <h2>1. Who We Are</h2>
  <p>Mascot is a Figma plugin that provides AI-generated mascots, poses, animations, and logo packs. This policy describes how we collect and use data when you use the Plugin.</p>

  <h2>2. Data We Collect</h2>
  <p>We collect:</p>
  <ul>
    <li><strong>Account data:</strong> When you sign in (e.g. via “Continue with Figma” or email), we receive and store your email, name, and profile information necessary to provide the service.</li>
    <li><strong>Usage data:</strong> We store information related to your use of the Plugin, such as credit balance, generation requests (mascots, poses, animations, logos), and associated metadata (e.g. prompts, file identifiers) to operate the service and improve it.</li>
    <li><strong>Payment data:</strong> When you buy credits, payment is processed by Stripe. We do not store your full card number; we receive and store only what is needed to link purchases to your account (e.g. transaction identifiers, credit amounts). Stripe’s privacy policy applies to payment data they process.</li>
  </ul>

  <h2>3. How We Use Your Data</h2>
  <p>We use the data above to:</p>
  <ul>
    <li>Provide and operate the Plugin (authentication, credits, generations).</li>
    <li>Process payments and manage your credit balance.</li>
    <li>Comply with legal obligations and enforce our Terms of Service.</li>
    <li>Improve and secure the service (e.g. debugging, analytics in aggregate).</li>
  </ul>
  <p>We do not sell your personal data to third parties.</p>

  <h2>4. Data Retention</h2>
  <p>We retain account and usage data for as long as your account is active and as needed to provide the service, comply with law, and resolve disputes. You may request deletion of your account and associated data; we will process such requests in accordance with applicable law.</p>

  <h2>5. Your Rights</h2>
  <p>Depending on your location (e.g. EU/EEA), you may have the right to access, correct, delete, or port your data, or to object to or restrict certain processing. To exercise these rights, contact us using the email address provided in the Plugin or in our documentation. You may also have the right to lodge a complaint with a supervisory authority.</p>

  <h2>6. Security</h2>
  <p>We take reasonable measures to protect your data (e.g. encryption in transit, access controls). No system is completely secure; we cannot guarantee absolute security.</p>

  <h2>7. Third Parties</h2>
  <p>We use:</p>
  <ul>
    <li><strong>Figma / Google:</strong> For sign-in when you choose “Continue with Figma”; their privacy policies apply to that authentication flow.</li>
    <li><strong>Stripe:</strong> For payment processing; Stripe’s privacy policy applies to payment data.</li>
    <li><strong>Infrastructure providers:</strong> To host and run the service (e.g. cloud providers); they process data on our instructions.</li>
  </ul>

  <h2>8. Changes</h2>
  <p>We may update this Privacy Policy from time to time. The “Last updated” date at the top will be revised when we do. Continued use of the Plugin after changes constitutes acceptance of the updated policy.</p>

  <h2>9. Contact</h2>
  <p>For questions about this Privacy Policy or your data, contact us at the email address provided in the Plugin or on our service documentation.</p>

  <p><a href="/api/v1/legal/terms">Terms of Service</a></p>
</body>
</html>`;
