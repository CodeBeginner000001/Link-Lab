export const PASSWORD_CHANGED_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Changed</title>
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

                <!-- Success Icon -->
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
                      width="60"
                      height="60"
                      style="
                        width: 60px;
                        height: 60px;
                        border-radius: 999px;
                        background: linear-gradient(135deg, hsl(160, 70%, 42%) 0%, hsl(174, 72%, 40%) 100%);
                        color: #ffffff;
                        font-size: 28px;
                        font-weight: 700;
                        line-height: 60px;
                        text-align: center;
                      "
                    >
                      ✓
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
                  Password changed successfully
                </h1>

                <p
                  style="
                    font-size: 15px;
                    color: hsl(220, 10%, 42%);
                    line-height: 1.7;
                    margin: 0 0 28px;
                  "
                >
                  Hi {{userName}}, your {{senderName}} account password has been
                  successfully updated. You can now use your new password to sign
                  in to your account.
                </p>

                <!-- Details Card -->
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="
                    background-color: hsl(210, 20%, 97%);
                    border: 1px solid hsl(220, 15%, 92%);
                    border-radius: 12px;
                    margin-bottom: 24px;
                  "
                >
                  <tr>
                    <td style="padding: 20px">
                      <p
                        style="
                          font-size: 13px;
                          font-weight: 700;
                          color: hsl(220, 25%, 10%);
                          margin: 0 0 16px;
                          text-transform: uppercase;
                          letter-spacing: 0.06em;
                        "
                      >
                        Change Details
                      </p>

                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        width="100%"
                      >
                        <tr>
                          <td
                            style="
                              font-size: 13px;
                              color: hsl(220, 10%, 50%);
                              font-weight: 500;
                              padding: 8px 0;
                            "
                          >
                            Date
                          </td>
                          <td
                            align="right"
                            style="
                              font-size: 13px;
                              color: hsl(220, 25%, 10%);
                              font-weight: 600;
                              padding: 8px 0;
                            "
                          >
                            {{changeDate}}
                          </td>
                        </tr>
                      </table>

                      <div
                        style="height: 1px; background-color: hsl(220, 15%, 92%)"
                      ></div>

                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        width="100%"
                      >
                        <tr>
                          <td
                            style="
                              font-size: 13px;
                              color: hsl(220, 10%, 50%);
                              font-weight: 500;
                              padding: 8px 0;
                            "
                          >
                            Time
                          </td>
                          <td
                            align="right"
                            style="
                              font-size: 13px;
                              color: hsl(220, 25%, 10%);
                              font-weight: 600;
                              padding: 8px 0;
                            "
                          >
                            {{changeTime}}
                          </td>
                        </tr>
                      </table>

                      <div
                        style="height: 1px; background-color: hsl(220, 15%, 92%)"
                      ></div>

                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        width="100%"
                      >
                        <tr>
                          <td
                            style="
                              font-size: 13px;
                              color: hsl(220, 10%, 50%);
                              font-weight: 500;
                              padding: 8px 0;
                            "
                          >
                            Device
                          </td>
                          <td
                            align="right"
                            style="
                              font-size: 13px;
                              color: hsl(220, 25%, 10%);
                              font-weight: 600;
                              padding: 8px 0;
                            "
                          >
                            {{deviceInfo}}
                          </td>
                        </tr>
                      </table>

                      <div
                        style="height: 1px; background-color: hsl(220, 15%, 92%)"
                      ></div>

                      <table
                        role="presentation"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        width="100%"
                      >
                        <tr>
                          <td
                            style="
                              font-size: 13px;
                              color: hsl(220, 10%, 50%);
                              font-weight: 500;
                              padding: 8px 0;
                            "
                          >
                            Location
                          </td>
                          <td
                            align="right"
                            style="
                              font-size: 13px;
                              color: hsl(220, 25%, 10%);
                              font-weight: 600;
                              padding: 8px 0;
                            "
                          >
                            {{locationInfo}}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Warning -->
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="
                    margin-bottom: 28px;
                    background-color: hsl(0, 100%, 97%);
                    border: 1px solid hsl(0, 70%, 88%);
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
                            ⚠️
                          </td>
                          <td valign="top">
                            <p
                              style="
                                font-size: 13px;
                                font-weight: 600;
                                color: hsl(0, 50%, 35%);
                                margin: 0 0 4px;
                              "
                            >
                              Wasn't you?
                            </p>
                            <p
                              style="
                                font-size: 13px;
                                color: hsl(0, 20%, 45%);
                                line-height: 1.5;
                                margin: 0;
                              "
                            >
                              If you did not make this change, your account may
                              be compromised. Please reset your password
                              immediately and contact our support team.
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
                    margin: 0 0 28px;
                  "
                >
                  For your security, you've been signed out of all other
                  devices. You'll need to sign in again with your new password on
                  any device you use.
                </p>

                <!-- Tips -->
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="
                    background-color: hsla(174, 72%, 40%, 0.05);
                    border: 1px solid hsl(174, 50%, 85%);
                    border-radius: 10px;
                    margin-bottom: 24px;
                  "
                >
                  <tr>
                    <td style="padding: 18px 20px">
                      <p
                        style="
                          font-size: 14px;
                          font-weight: 700;
                          color: hsl(174, 50%, 30%);
                          margin: 0 0 12px;
                        "
                      >
                        🔐 Password Security Tips
                      </p>

                      <ul
                        style="
                          margin: 0;
                          padding-left: 18px;
                          color: hsl(174, 20%, 38%);
                        "
                      >
                        <li
                          style="
                            font-size: 13px;
                            line-height: 1.8;
                            margin-bottom: 2px;
                          "
                        >
                          Use a unique password you don't use on other sites
                        </li>
                        <li
                          style="
                            font-size: 13px;
                            line-height: 1.8;
                            margin-bottom: 2px;
                          "
                        >
                          Enable two-factor authentication for added security
                        </li>
                        <li
                          style="
                            font-size: 13px;
                            line-height: 1.8;
                            margin-bottom: 2px;
                          "
                        >
                          Never share your password with anyone
                        </li>
                        <li
                          style="
                            font-size: 13px;
                            line-height: 1.8;
                            margin-bottom: 0;
                          "
                        >
                          Consider using a password manager
                        </li>
                      </ul>
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
                  Need help? Reach out to our support team at
                  <a
                    href="mailto:{{supportEmail}}"
                    style="
                      color: hsl(174, 72%, 38%);
                      text-decoration: underline;
                      text-underline-offset: 2px;
                    "
                    >{{supportEmail}}</a
                  >
                  — we're here 24/7.
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
export function buildPasswordChangedEmailContext(params: {
  name: string;
  changeDate: string;
  changeTime: string;
  deviceInfo: string;
  locationInfo: string;
  label1: string;
  label1Url: string;
  label2: string;
  label2Url: string;
}) {
  return {
    userName: params.name,
    changeDate: params.changeDate,
    changeTime: params.changeTime,
    deviceInfo: params.deviceInfo,
    locationInfo: params.locationInfo,
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
