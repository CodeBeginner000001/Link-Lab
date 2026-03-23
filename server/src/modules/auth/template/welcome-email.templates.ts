export const WELCOME_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome Email</title>
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
                  style="margin-bottom: 24px"
                >
                  <tr>
                    <td valign="middle">
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
                  style="
                    margin-bottom: 20px;
                    background-color: hsl(174, 60%, 96%);
                    border: 1px solid hsl(174, 40%, 88%);
                    border-radius: 20px;
                  "
                >
                  <tr>
                    <td style="padding: 6px 14px">
                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                      >
                        <tr>
                          <td
                            valign="middle"
                            style="
                              font-size: 12px;
                              font-weight: 600;
                              color: hsl(174, 50%, 30%);
                            "
                          >
                            Account created successfully
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <h1
                  style="
                    font-size: 24px;
                    font-weight: 700;
                    color: hsl(220, 25%, 10%);
                    margin: 0 0 14px;
                    letter-spacing: -0.02em;
                    line-height: 1.3;
                  "
                >
                  Welcome to {{senderName}}, {{userName}}!
                </h1>

                <p
                  style="
                    font-size: 15px;
                    color: hsl(220, 10%, 42%);
                    line-height: 1.7;
                    margin: 0 0 28px;
                  "
                >
                  We're thrilled to have you on board. Your account is fully set
                  up and ready to go. Here's a quick overview of what you can do
                  right away.
                </p>

                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="margin-bottom: 32px"
                >
                  <tr>
                    <td
                      style="
                        padding: 16px 0;
                        border-bottom: 1px solid hsl(220, 15%, 94%);
                      "
                    >
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
                            width="36"
                            style="font-size: 22px; line-height: 1; padding-top: 2px"
                          >
                            📊
                          </td>
                          <td valign="top">
                            <p
                              style="
                                font-size: 14px;
                                font-weight: 600;
                                color: hsl(220, 25%, 10%);
                                margin: 0 0 4px;
                              "
                            >
                              Personal Dashboard
                            </p>
                            <p
                              style="
                                font-size: 13px;
                                color: hsl(220, 10%, 50%);
                                line-height: 1.5;
                                margin: 0;
                              "
                            >
                              Track your activity, manage settings, and view
                              insights — all from one place.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 16px 0;
                        border-bottom: 1px solid hsl(220, 15%, 94%);
                      "
                    >
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
                            width="36"
                            style="font-size: 22px; line-height: 1; padding-top: 2px"
                          >
                            🔐
                          </td>
                          <td valign="top">
                            <p
                              style="
                                font-size: 14px;
                                font-weight: 600;
                                color: hsl(220, 25%, 10%);
                                margin: 0 0 4px;
                              "
                            >
                              Enterprise-Grade Security
                            </p>
                            <p
                              style="
                                font-size: 13px;
                                color: hsl(220, 10%, 50%);
                                line-height: 1.5;
                                margin: 0;
                              "
                            >
                              Your data is encrypted at rest and in transit.
                              Two-factor authentication is available.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 16px 0;
                        border-bottom: 1px solid hsl(220, 15%, 94%);
                      "
                    >
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
                            width="36"
                            style="font-size: 22px; line-height: 1; padding-top: 2px"
                          >
                            🤝
                          </td>
                          <td valign="top">
                            <p
                              style="
                                font-size: 14px;
                                font-weight: 600;
                                color: hsl(220, 25%, 10%);
                                margin: 0 0 4px;
                              "
                            >
                              Dedicated Support
                            </p>
                            <p
                              style="
                                font-size: 13px;
                                color: hsl(220, 10%, 50%);
                                line-height: 1.5;
                                margin: 0;
                              "
                            >
                              Our team is available around the clock. Reach out
                              anytime via chat or email.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <div style="text-align: center; margin-bottom: 28px">
                  <a
                    href="{{dashboardUrl}}"
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
                    Open Your Dashboard
                  </a>
                </div>

                <p
                  style="
                    font-size: 15px;
                    color: hsl(220, 10%, 42%);
                    line-height: 1.7;
                    margin: 0 0 28px;
                  "
                >
                  Take a few minutes to explore your settings and personalize
                  your profile. If you need any help getting started, our
                  <a
                    href="{{quickGuideUrl}}"
                    style="
                      color: hsl(174, 72%, 38%);
                      text-decoration: underline;
                      text-underline-offset: 2px;
                    "
                    >{{quickGuideLabel}}</a
                  >
                  walks you through the essentials in under 5 minutes.
                </p>

                <div
                  style="
                    height: 1px;
                    background-color: hsl(220, 15%, 92%);
                    margin: 0 0 28px;
                  "
                ></div>

                <p
                  style="
                    font-size: 13px;
                    color: hsl(220, 10%, 55%);
                    line-height: 1.6;
                    margin: 0 0 14px;
                  "
                >
                  You're receiving this because you recently created an account
                  on {{senderName}}. If this wasn't you, please contact
                  <a
                    href="mailto:{{supportEmail}}"
                    style="
                      color: hsl(174, 72%, 38%);
                      text-decoration: underline;
                      text-underline-offset: 2px;
                    "
                    >{{supportEmail}}</a
                  >
                  immediately so we can secure your account.
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
                    href="{{Label1Url}}"
                    style="
                      color: hsl(174, 72%, 38%);
                      text-decoration: none;
                    "
                    >{{Label1}}</a
                  >
                  <span style="color: hsl(220, 10%, 70%); margin: 0 6px">·</span>
                  <a
                    href="{{Label2Url}}"
                    style="
                      color: hsl(174, 72%, 38%);
                      text-decoration: none;
                    "
                    >{{Label2}}</a
                  >
                  <span style="color: hsl(220, 10%, 70%); margin: 0 6px">·</span>
                  <a
                    href="{{Label3Url}}"
                    style="
                      color: hsl(174, 72%, 38%);
                      text-decoration: none;
                    "
                    >{{Label3}}</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
export function buildWelcomeEmailContext(params: {
  name: string;
  frontend: string;
  label1: string;
  label1Url: string;
  label2: string;
  label2Url: string;
  label3: string;
  label3Url: string;
}) {
  return {
    userName: params.name,
    senderName: 'Link Lab',
    senderLogo: 'https://linklab-solutions.vercel.app/logo.png',
    supportEmail: 'ashu2100ag@gmail.com',
    dashboardUrl: `${params.frontend}/dashboard`,
    quickGuideUrl: `${params.frontend}/quick-guide`,
    quickGuideLabel: 'quick start guide',
    Label1: params.label1,
    Label1Url: params.label1Url,
    Label2: params.label2,
    Label2Url: params.label2Url,
    Label3: params.label3,
    Label3Url: params.label3Url,
    year: new Date().getFullYear(),
  };
}
