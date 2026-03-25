export const FORGOT_PASSWORD_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Forgot Password OTP</title>
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
                <!-- Left Brand -->
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

                <!-- Centered Icon -->
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
                          border-radius: 999px;
                        "
                      >
                        <tr>
                          <td
                            align="center"
                            valign="middle"
                            style="
                              color: hsl(174, 72%, 40%);
                              font-size: 18px;
                              font-weight: 700;
                              line-height: 28px;
                              text-align: center;
                            "
                          >
                            ?
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
                  Password reset verification
                </h1>

                <p
                  style="
                    font-size: 15px;
                    color: hsl(220, 10%, 42%);
                    line-height: 1.7;
                    margin: 0 0 24px;
                  "
                >
                  Hi {{userName}}, we received a request to reset your
                  {{senderName}} password. To verify your identity, please enter
                  the following 6-digit code in the app.
                </p>

                <!-- OTP -->
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  align="center"
                  style="margin: 0 auto 28px"
                >
                  <tr>
                    <td
                      align="center"
                      valign="middle"
                      width="50"
                      height="58"
                      style="
                        width: 50px;
                        height: 58px;
                        border-radius: 12px;
                        background-color: hsl(210, 20%, 97%);
                        border: 1.5px solid hsla(174, 72%, 40%, 0.35);
                        font-size: 22px;
                        font-weight: 700;
                        color: hsl(220, 25%, 10%);
                      "
                    >
                      {{otp1}}
                    </td>
                    <td width="8"></td>
                    <td
                      align="center"
                      valign="middle"
                      width="50"
                      height="58"
                      style="
                        width: 50px;
                        height: 58px;
                        border-radius: 12px;
                        background-color: hsl(210, 20%, 97%);
                        border: 1.5px solid hsla(174, 72%, 40%, 0.35);
                        font-size: 22px;
                        font-weight: 700;
                        color: hsl(220, 25%, 10%);
                      "
                    >
                      {{otp2}}
                    </td>
                    <td width="8"></td>
                    <td
                      align="center"
                      valign="middle"
                      width="50"
                      height="58"
                      style="
                        width: 50px;
                        height: 58px;
                        border-radius: 12px;
                        background-color: hsl(210, 20%, 97%);
                        border: 1.5px solid hsla(174, 72%, 40%, 0.35);
                        font-size: 22px;
                        font-weight: 700;
                        color: hsl(220, 25%, 10%);
                      "
                    >
                      {{otp3}}
                    </td>
                    <td width="8"></td>
                    <td
                      align="center"
                      valign="middle"
                      width="50"
                      height="58"
                      style="
                        width: 50px;
                        height: 58px;
                        border-radius: 12px;
                        background-color: hsl(210, 20%, 97%);
                        border: 1.5px solid hsla(174, 72%, 40%, 0.35);
                        font-size: 22px;
                        font-weight: 700;
                        color: hsl(220, 25%, 10%);
                      "
                    >
                      {{otp4}}
                    </td>
                    <td width="8"></td>
                    <td
                      align="center"
                      valign="middle"
                      width="50"
                      height="58"
                      style="
                        width: 50px;
                        height: 58px;
                        border-radius: 12px;
                        background-color: hsl(210, 20%, 97%);
                        border: 1.5px solid hsla(174, 72%, 40%, 0.35);
                        font-size: 22px;
                        font-weight: 700;
                        color: hsl(220, 25%, 10%);
                      "
                    >
                      {{otp5}}
                    </td>
                    <td width="8"></td>
                    <td
                      align="center"
                      valign="middle"
                      width="50"
                      height="58"
                      style="
                        width: 50px;
                        height: 58px;
                        border-radius: 12px;
                        background-color: hsl(210, 20%, 97%);
                        border: 1.5px solid hsla(174, 72%, 40%, 0.35);
                        font-size: 22px;
                        font-weight: 700;
                        color: hsl(220, 25%, 10%);
                      "
                    >
                      {{otp6}}
                    </td>
                  </tr>
                </table>

                <!-- Expiry -->
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
                              Code expires in {{time}}
                            </p>
                            <p
                              style="
                                font-size: 13px;
                                color: hsl(40, 20%, 40%);
                                line-height: 1.5;
                                margin: 0;
                              "
                            >
                              For security, this one-time code can only be used
                              once and will expire shortly. If it expires,
                              return to the app and request a new code.
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

                <h2
                  style="
                    font-size: 16px;
                    font-weight: 600;
                    color: hsl(220, 25%, 10%);
                    margin: 0 0 10px;
                  "
                >
                  Didn't request this?
                </h2>

                <p
                  style="
                    font-size: 15px;
                    color: hsl(220, 10%, 42%);
                    line-height: 1.7;
                    margin: 0 0 24px;
                  "
                >
                  If you didn't initiate a password reset, someone may have
                  entered your email address by mistake. You can safely ignore
                  this email — no changes will be made to your account.
                </p>

                <p
                  style="
                    font-size: 13px;
                    color: hsl(220, 10%, 55%);
                    line-height: 1.6;
                    margin: 0 0 14px;
                  "
                >
                  For additional security, we recommend enabling two-factor
                  authentication in your account settings. If you believe your
                  account may be compromised, contact us immediately at
                  <a
                    href="mailto:{{supportEmail}}"
                    style="
                      color: hsl(174, 72%, 38%);
                      text-decoration: underline;
                      text-underline-offset: 2px;
                    "
                    >{{supportEmail}}</a
                  >.
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
</html>`;

export function buildForgotPasswordEmailContext(params: {
  name: string;
  otp: string;
  otpExpirationMinutes: number;
  label1: string;
  label1Url: string;
  label2: string;
  label2Url: string;
}) {
  return {
    userName: params.name,
    otp1: params.otp[0] ?? '',
    otp2: params.otp[1] ?? '',
    otp3: params.otp[2] ?? '',
    otp4: params.otp[3] ?? '',
    otp5: params.otp[4] ?? '',
    otp6: params.otp[5] ?? '',
    time: `${params.otpExpirationMinutes} minute${
      params.otpExpirationMinutes > 1 ? 's' : ''
    }`,
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
