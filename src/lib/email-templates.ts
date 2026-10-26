import env from "@/env/env";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

// Brand tokens, copied from the frontend's index.css. Email clients don't load
// stylesheets, so every value has to be inlined where it's used.
const color = {
  brand: "#ff0062",
  brandSoft: "#ffe3ee",
  teal: "#16c2ac",
  canvas: "#fff5f8",
  surface: "#ffffff",
  ink: "#1a1420",
  inkSoft: "#6b6472",
  hairline: "#f0dfe6",
};

// Fredoka and Nunito only load in clients that honour web fonts (Apple Mail,
// iOS); Gmail and Outlook fall back to the rest of the stack.
const font = {
  display: "'Fredoka', 'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
  body: "'Nunito', 'Segoe UI', Helvetica, Arial, sans-serif",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface LayoutOptions {
  /** Shown by the inbox next to the subject, hidden in the body. */
  preheader: string;
  title: string;
  paragraphs: string[];
  action: { label: string; url: string };
  expiry: string;
  ignoreNote: string;
}

// Table-based on purpose: Outlook still renders with Word's engine, which
// ignores flexbox, grid and most of CSS. Tables and inline styles are the only
// layout every inbox agrees on.
function layout(options: LayoutOptions): string {
  const url = escapeHtml(options.action.url);
  // Served by the frontend (public/email/). Hosted images rather than
  // attachments: they keep the email small and most inboxes show them.
  const logoUrl = `${env.FRONTEND_URL}/email/logo.png`;
  const dogUrl = `${env.FRONTEND_URL}/email/dog.png`;

  const paragraphs = options.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-family:${font.body};font-size:16px;line-height:26px;font-weight:600;color:${color.inkSoft};">${paragraph}</p>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(options.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@600;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${color.canvas};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(options.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${color.canvas};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="background-color:${color.brand};border-radius:24px 24px 0 0;padding:0 32px 0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;padding:28px 0 28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="vertical-align:middle;padding-right:10px;">
                        <img src="${logoUrl}" width="40" height="40" alt="" style="display:block;border:0;">
                      </td>
                      <td style="vertical-align:middle;font-family:${font.display};font-size:26px;font-weight:600;letter-spacing:-0.5px;color:#ffffff;">Tailhop</td>
                    </tr>
                  </table>
                  <p style="margin:22px 0 0;font-family:${font.display};font-size:24px;line-height:28px;font-weight:600;letter-spacing:-0.5px;color:#ffffff;">Toda pata merece<br>um novo lar</p>
                </td>
                <td width="104" style="vertical-align:bottom;padding:20px 0 0;" align="right">
                  <img src="${dogUrl}" width="91" height="130" alt="" style="display:block;border:0;">
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:${color.surface};border-radius:0 0 24px 24px;padding:36px 32px;">
            <h1 style="margin:0 0 20px;font-family:${font.display};font-size:28px;line-height:34px;font-weight:600;letter-spacing:-0.5px;color:${color.ink};">${escapeHtml(options.title)}</h1>
            ${paragraphs}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 20px;">
              <tr>
                <td style="background-color:${color.teal};border-radius:999px;">
                  <a href="${url}" target="_blank" style="display:inline-block;padding:16px 36px;font-family:${font.display};font-size:17px;font-weight:600;color:${color.ink};text-decoration:none;border-radius:999px;">${escapeHtml(options.action.label)}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 28px;font-family:${font.body};font-size:14px;line-height:22px;font-weight:600;color:${color.inkSoft};">${escapeHtml(options.expiry)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="border-top:2px solid ${color.hairline};font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>
            <p style="margin:24px 0 8px;font-family:${font.body};font-size:13px;line-height:20px;font-weight:600;color:${color.inkSoft};">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
            <p style="margin:0 0 20px;font-family:${font.body};font-size:13px;line-height:20px;font-weight:600;word-break:break-all;"><a href="${url}" target="_blank" style="color:${color.brand};text-decoration:underline;">${url}</a></p>
            <p style="margin:0;font-family:${font.body};font-size:13px;line-height:20px;font-weight:600;color:${color.inkSoft};">${escapeHtml(options.ignoreNote)}</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 16px 0;font-family:${font.body};font-size:12px;line-height:18px;font-weight:600;color:${color.inkSoft};">
            Tailhop · Conectando pets a famílias<br>
            Este e-mail foi enviado automaticamente. Não é preciso responder.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function verificationEmail(verifyUrl: string): EmailContent {
  return {
    subject: "Confirme seu e-mail no Tailhop",
    html: layout({
      preheader: "Falta um passo para sua ONG começar a publicar pets.",
      title: "Falta só confirmar seu e-mail",
      paragraphs: [
        "Que bom ter sua ONG no Tailhop! Confirme que este endereço é seu para ativar a conta e começar a publicar os pets que estão esperando um lar.",
      ],
      action: { label: "Confirmar e-mail", url: verifyUrl },
      expiry: "O link vale por 24 horas.",
      ignoreNote:
        "Não criou uma conta no Tailhop? Pode ignorar este e-mail. Nenhuma conta é ativada sem essa confirmação.",
    }),
    text: [
      "Falta só confirmar seu e-mail",
      "",
      "Que bom ter sua ONG no Tailhop! Confirme que este endereço é seu para ativar a conta e começar a publicar os pets que estão esperando um lar.",
      "",
      `Confirmar e-mail: ${verifyUrl}`,
      "",
      "O link vale por 24 horas.",
      "",
      "Não criou uma conta no Tailhop? Pode ignorar este e-mail. Nenhuma conta é ativada sem essa confirmação.",
      "",
      "Tailhop · Conectando pets a famílias",
    ].join("\n"),
  };
}

export function passwordResetEmail(resetUrl: string): EmailContent {
  return {
    subject: "Redefina sua senha do Tailhop",
    html: layout({
      preheader: "Use o link para escolher uma senha nova.",
      title: "Vamos criar uma senha nova",
      paragraphs: [
        "Recebemos um pedido para redefinir a senha da conta da sua ONG no Tailhop. Clique no botão abaixo para escolher uma senha nova.",
      ],
      action: { label: "Escolher nova senha", url: resetUrl },
      expiry: "O link vale por 1 hora e só pode ser usado uma vez.",
      ignoreNote:
        "Não pediu para trocar a senha? Pode ignorar este e-mail. Sua senha atual continua valendo.",
    }),
    text: [
      "Vamos criar uma senha nova",
      "",
      "Recebemos um pedido para redefinir a senha da conta da sua ONG no Tailhop. Use o link abaixo para escolher uma senha nova.",
      "",
      `Escolher nova senha: ${resetUrl}`,
      "",
      "O link vale por 1 hora e só pode ser usado uma vez.",
      "",
      "Não pediu para trocar a senha? Pode ignorar este e-mail. Sua senha atual continua valendo.",
      "",
      "Tailhop · Conectando pets a famílias",
    ].join("\n"),
  };
}
