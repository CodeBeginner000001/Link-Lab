export const RESET_PASSWORD_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset Password</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: hsl(210, 20%, 96%);
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    "
  >
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="background-color: hsl(210, 20%, 96%); padding: 48px 16px"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="100%"
            style="
              max-width: 520px;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 1px 3px hsla(220, 25%, 10%, 0.06),
                0 8px 32px hsla(220, 25%, 10%, 0.08);
            "
          >
            <tr>
              <td
                style="
                  height: 4px;
                  background: linear-gradient(
                    90deg,
                    hsl(174, 72%, 40%) 0%,
                    hsl(190, 90%, 45%) 50%,
                    hsl(262, 80%, 55%) 100%
                  );
                  font-size: 0;
                  line-height: 0;
                "
              >
                &nbsp;
              </td>
            </tr>

            <tr>
              <td style="padding: 36px 40px 28px">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="margin: 0 0 24px"
                >
                  <tr>
                    <td align="center" valign="middle">
                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        width="20"
                        height="20"
                        style="
                          width: 20px;
                          height: 20px;
                          background-color: #000000;
                          border-radius: 50%;
                        "
                      >
                        <tr>
                          <td align="center" valign="middle">
                            <img
                              src="{{senderLogo}}"
                              alt="{{senderName}}"
                              width="36"
                              height="36"
                              style="
                                display: block;
                                width: 46px;
                                height: 46px;
                                object-fit: cover;
                              "
                            />
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td width="12"></td>
                    <td
                      valign="middle"
                      style="
                        font-size: 17px;
                        font-weight: 700;
                        color: hsl(220, 25%, 10%);
                        letter-spacing: -0.01em;
                      "
                    >
                      {{senderName}}
                    </td>
                  </tr>
                </table>

                <div
                  style="
                    height: 1px;
                    background-color: hsl(220, 15%, 92%);
                    margin: 0 0 28px;
                  "
                ></div>

                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  align="center"
                  style="margin: 0 auto 20px"
                >
                  <tr>
                    <td
                      align="center"
                      valign="middle"
                      width="56"
                      height="56"
                      style="
                        width: 56px;
                        height: 56px;
                        border-radius: 14px;
                        background-color: #eefaf7;
                      "
                    >
                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        align="center"
                        width="28"
                        height="28"
                        style="
                          width: 28px;
                          height: 28px;
                          border: 2px solid hsl(174, 72%, 40%);
                          border-radius: 50%;
                        "
                      >
                        <tr>
                          <td
                            align="center"
                            valign="middle"
                            style="
                              color: hsl(174, 72%, 40%);
                              font-size: 16px;
                              font-weight: 700;
                              line-height: 28px;
                              text-align: center;
                            "
                          >
                            ↻
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <h1
                  style="
                    font-size: 22px;
                    font-weight: 700;
                    color: hsl(220, 25%, 10%);
                    margin: 0 0 14px;
                    letter-spacing: -0.02em;
                    line-height: 1.3;
                    text-align: center;
                  "
                >
                  Reset your password
                </h1>

                <p
                  style="
                    font-size: 15px;
                    color: hsl(220, 10%, 42%);
                    line-height: 1.7;
                    margin: 0 0 28px;
                  "
                >
                  Hi {{userName}}, we received a request to reset the password
                  associated with your {{senderName}} account. If you made this
                  request, click the button below to choose a new password.
                </p>

                <div style="text-align: center; margin-bottom: 28px">
                  <a
                    href="{{resetUrl}}"
                    style="
                      display: inline-block;
                      background-color: hsl(174, 72%, 40%);
                      color: #ffffff;
                      font-size: 15px;
                      font-weight: 600;
                      padding: 14px 40px;
                      border-radius: 10px;
                      text-decoration: none;
                      letter-spacing: 0.01em;
                      box-shadow: 0 2px 8px hsla(174, 72%, 40%, 0.3);
                    "
                  >
                    Reset My Password
                  </a>
                </div>

                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="
                    margin-bottom: 28px;
                    background-color: hsl(40, 100%, 97%);
                    border: 1px solid hsl(40, 70%, 85%);
                    border-radius: 10px;
                  "
                >
                  <tr>
                    <td style="padding: 16px">
                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        width="100%"
                      >
                        <tr>
                          <td
                            valign="top"
                            width="24"
                            style="font-size: 18px; line-height: 1.4"
                          >
                            ⏱
                          </td>
                          <td valign="top">
                            <p
                              style="
                                font-size: 13px;
                                font-weight: 600;
                                color: hsl(40, 40%, 30%);
                                margin: 0 0 4px;
                              "
                            >
                              This link expires in {{time}}
                            </p>
                            <p
                              style="
                                font-size: 13px;
                                color: hsl(40, 20%, 40%);
                                line-height: 1.5;
                                margin: 0;
                              "
                            >
                              For your security, the password reset link is
                              time-sensitive. If it expires, you can always
                              request a new one from the login page.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <div
                  style="
                    height: 1px;
                    background-color: hsl(220, 15%, 92%);
                    margin: 0 0 28px;
                  "
                ></div>

                <p
                  style="
                    font-size: 15px;
                    color: hsl(220, 10%, 42%);
                    line-height: 1.7;
                    margin: 0 0 14px;
                  "
                >
                  If you didn't request a password reset, you can safely ignore
                  this email. Your existing password will remain unchanged and
                  your account will stay secure.
                </p>

                <p
                  style="
                    font-size: 13px;
                    color: hsl(220, 10%, 55%);
                    line-height: 1.6;
                    margin: 0 0 14px;
                  "
                >
                  <strong>Having trouble with the button?</strong> Copy and paste
                  the link below into your browser's address bar:
                </p>

                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="
                    background-color: hsl(210, 20%, 97%);
                    border: 1px solid hsl(220, 15%, 92%);
                    border-radius: 8px;
                    margin-bottom: 20px;
                  "
                >
                  <tr>
                    <td style="padding: 12px 14px">
                      <p
                        style="
                          font-size: 12px;
                          color: hsl(174, 72%, 38%);
                          margin: 0;
                          word-break: break-all;
                          line-height: 1.5;
                        "
                      >
                        {{resetUrl}}
                      </p>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    font-size: 13px;
                    color: hsl(220, 10%, 55%);
                    line-height: 1.6;
                    margin: 0 0 14px;
                  "
                >
                  If you continue to have issues, contact our support team at
                  <a
                    href="mailto:{{supportEmail}}"
                    style="
                      color: hsl(174, 72%, 38%);
                      text-decoration: underline;
                      text-underline-offset: 2px;
                    "
                    >{{supportEmail}}</a
                  >
                  and we'll help you get back into your account.
                </p>
              </td>
            </tr>

            <tr>
              <td
                style="
                  background-color: hsl(210, 20%, 97%);
                  padding: 20px 40px;
                  text-align: center;
                "
              >
                <p
                  style="
                    font-size: 12px;
                    color: hsl(220, 10%, 55%);
                    margin: 0 0 6px;
                  "
                >
                  © {{year}} {{senderName}} · All rights reserved
                </p>
                <p style="font-size: 12px; margin: 0">
                  <a
                    href="{{label1Url}}"
                    style="color: hsl(174, 72%, 38%); text-decoration: none"
                    >{{label1}}</a
                  >
                  <span style="color: hsl(220, 10%, 70%); margin: 0 6px">·</span>
                  <a
                    href="{{label2Url}}"
                    style="color: hsl(174, 72%, 38%); text-decoration: none"
                    >{{label2}}</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
export function buildResetPasswordEmailContext(params: {
  name: string;
  resetLink: string;
  expiration: number;
  label1: string;
  label1Url: string;
  label2: string;
  label2Url: string;
}) {
  return {
    userName: params.name,
    resetUrl: params.resetLink,
    time: `${params.expiration} min`,
    supportEmail: 'ashu2100ag@gmail.com',
    year: new Date().getFullYear(),
    senderName: 'Link Lab',
    senderLogo: 'https://linklab-solutions.vercel.app/logo.png',
    label1: params.label1,
    label1Url: params.label1Url,
    label2: params.label2,
    label2Url: params.label2Url,
  };
}
