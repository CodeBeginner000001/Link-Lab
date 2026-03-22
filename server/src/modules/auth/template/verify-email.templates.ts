export const VERIFY_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your email address</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f3f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    "
  >
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="background-color: #f3f6f8; padding: 48px 16px"
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
              box-shadow: 0 1px 3px rgba(18, 24, 40, 0.06),
                0 8px 32px rgba(18, 24, 40, 0.08);
            "
          >
            <tr>
              <td
                style="
                  height: 4px;
                  background: linear-gradient(
                    90deg,
                    #1fb8a6 0%,
                    #0ea5c6 50%,
                    #6d39e6 100%
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
                        width="44"
                        height="44"
                        style="
                          width: 30px;
                          height: 30px;
                          border-radius: 12px;
                          background-color: #111827;
                        "
                      >
                        <tr>
                          <td align="center" valign="middle">
                            <img
                              src="{{senderLogo}}"
                              alt="{{senderName}}"
                              width="26"
                              height="26"
                              style="
                                display: block;
                                width: 36px;
                                height: 36px;
                                object-fit: contain;
                              "
                            />
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td width="10"></td>
                    <td
                      valign="middle"
                      style="
                        font-size: 18px;
                        font-weight: 700;
                        color: #111827;
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
                    background-color: #e7ebf0;
                    margin: 0 0 28px;
                  "
                ></div>

                <h1
                  style="
                    margin: 0 0 14px;
                    font-size: 22px;
                    line-height: 1.3;
                    font-weight: 700;
                    color: #111827;
                    letter-spacing: -0.02em;
                  "
                >
                  Verify your email address
                </h1>

                <p
                  style="
                    margin: 0 0 32px;
                    font-size: 15px;
                    line-height: 1.7;
                    color: #5b6472;
                  "
                >
                  Hi {{userName}}, thanks for signing up. Before we get started,
                  we need to confirm your identity. Enter the 6-digit code below
                  in the app to verify your email.
                </p>

                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  align="center"
                  style="margin: 0 auto 28px"
                >
                  <tr>
                    <td align="center" valign="middle" width="50" height="58" style="width: 50px; height: 58px; border-radius: 12px; background-color: #f7f9fb; border: 1.5px solid rgba(31, 184, 166, 0.35); font-size: 22px; font-weight: 700; color: #111827;">
                      {{otp1}}
                    </td>
                    <td width="8"></td>
                    <td align="center" valign="middle" width="50" height="58" style="width: 50px; height: 58px; border-radius: 12px; background-color: #f7f9fb; border: 1.5px solid rgba(31, 184, 166, 0.35); font-size: 22px; font-weight: 700; color: #111827;">
                      {{otp2}}
                    </td>
                    <td width="8"></td>
                    <td align="center" valign="middle" width="50" height="58" style="width: 50px; height: 58px; border-radius: 12px; background-color: #f7f9fb; border: 1.5px solid rgba(31, 184, 166, 0.35); font-size: 22px; font-weight: 700; color: #111827;">
                      {{otp3}}
                    </td>
                    <td width="8"></td>
                    <td align="center" valign="middle" width="50" height="58" style="width: 50px; height: 58px; border-radius: 12px; background-color: #f7f9fb; border: 1.5px solid rgba(31, 184, 166, 0.35); font-size: 22px; font-weight: 700; color: #111827;">
                      {{otp4}}
                    </td>
                    <td width="8"></td>
                    <td align="center" valign="middle" width="50" height="58" style="width: 50px; height: 58px; border-radius: 12px; background-color: #f7f9fb; border: 1.5px solid rgba(31, 184, 166, 0.35); font-size: 22px; font-weight: 700; color: #111827;">
                      {{otp5}}
                    </td>
                    <td width="8"></td>
                    <td align="center" valign="middle" width="50" height="58" style="width: 50px; height: 58px; border-radius: 12px; background-color: #f7f9fb; border: 1.5px solid rgba(31, 184, 166, 0.35); font-size: 22px; font-weight: 700; color: #111827;">
                      {{otp6}}
                    </td>
                  </tr>
                </table>

                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="
                    margin-bottom: 28px;
                    background-color: #eefaf7;
                    border: 1px solid #d6efe8;
                    border-radius: 10px;
                  "
                >
                  <tr>
                    <td style="padding: 14px 16px">
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
                            style="
                              font-size: 16px;
                              line-height: 1.6;
                              color: #2f6f67;
                            "
                          >
                            ⏱
                          </td>
                          <td
                            valign="top"
                            style="
                              font-size: 13px;
                              line-height: 1.6;
                              color: #2f6f67;
                            "
                          >
                            This code expires in
                            <strong>{{time}}</strong>. After that, you'll need
                            to request a new one.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <div
                  style="
                    height: 1px;
                    background-color: #e7ebf0;
                    margin: 0 0 28px;
                  "
                ></div>

                <p
                  style="
                    margin: 0 0 14px;
                    font-size: 13px;
                    line-height: 1.6;
                    color: #737b88;
                  "
                >
                  If you didn't create an account with {{senderName}}, please disregard
                  this email. No action is needed on your part.
                </p>

                <p
                  style="
                    margin: 0;
                    font-size: 13px;
                    line-height: 1.6;
                    color: #737b88;
                  "
                >
                  For security, if you have concerns about your account's safety,
                  please contact our support team immediately.
                </p>
              </td>
            </tr>

            <tr>
              <td
                align="center"
                style="
                  background-color: #f7f9fb;
                  padding: 20px 40px;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0 0 6px;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #737b88;
                  "
                >
                  © {{year}} {{senderName}} · All rights reserved
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export function buildVerifyEmailContext(
  name: string,
  otp: string,
  otpExpirationMinutes: number,
) {
  return {
    userName: name,
    otp1: otp[0] ?? '',
    otp2: otp[1] ?? '',
    otp3: otp[2] ?? '',
    otp4: otp[3] ?? '',
    otp5: otp[4] ?? '',
    otp6: otp[5] ?? '',
    time: `${otpExpirationMinutes} minute${
      otpExpirationMinutes > 1 ? 's' : ''
    }`,
    year: new Date().getFullYear(),
    senderName: 'Link Lab',
    senderLogo: 'https://linklab-solutions.vercel.app/logo.png',
  };
}
