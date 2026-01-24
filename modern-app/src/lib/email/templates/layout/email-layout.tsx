// src/lib/email/templates/layout/email-layout.tsx
import type { ReactNode } from "react";
import { getEmailAsset, getEmailBaseUrl } from "@/lib/url";

// --- Brand & Style Definitions ---
const colors = {
  primary: "#2563eb", // Brand blue
  background: "#f5f7fb", // Light grey background
  card: "#ffffff",
  text: "#1f2933", // Dark grey for text
  muted: "#52606d",
  white: "#ffffff"
};

const appName = "Plumbers Portal";

export const EmailLayout = ({
  title,
  preheader,
  children
}: {
  title: string;
  preheader: string;
  children: ReactNode;
}) => {
  const baseUrl = getEmailBaseUrl();
  // Use the dark logo, it looks great on a white background
  const logoUrl = getEmailAsset("/logo-light.png");
  const homeUrl = baseUrl;

  // --- UPDATED FONT STACK ---
  const modernFontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} | ${appName}</title>
    <style>
      body { margin: 0; padding: 0; background-color: ${colors.background}; font-family: ${modernFontStack}; }
      table { border-spacing: 0; }
      td { padding: 0; }
      img { border: 0; display: block; }
      .wrapper { width: 100%; table-layout: fixed; background-color: ${colors.background}; padding-bottom: 40px; }
      
      /* --- REMOVED HEADER CLASS --- */

      /* --- UPDATED MAIN CARD --- */
      .main { 
        background-color: ${colors.card}; 
        margin: 0 auto; 
        width: 100%; 
        max-width: 600px; 
        border-spacing: 0; 
        font-family: ${modernFontStack}; 
        color: ${colors.text};
        border-radius: 8px; /* <-- MODERN TOUCH */
        overflow: hidden; /* <-- For border-radius */
      }
      
      /* --- ADDED LOGO PADDING (MOVED FROM HEADER) --- */
      .logo-padding {
        padding: 32px 32px 0 32px;
      }

      .content { padding: 32px; }
      .signature { padding-top: 24px; border-top: 1px solid #e5e7eb; margin-top: 32px; }
      
      .footer { 
        background-color: ${colors.background}; 
        padding: 24px 32px 32px; /* Added top padding */
        text-align: center; 
        color: ${colors.muted}; 
        font-size: 12px; 
      }
      
      /* --- UPDATED H1 --- */
      h1 { 
        font-size: 26px; 
        font-weight: 600;
        margin: 0 0 20px 0; 
        color: ${colors.text}; /* Changed from blue */
      }
      p { font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
      .button-link { display: inline-block; padding: 14px 28px; background-color: ${colors.primary}; color: ${colors.white}; text-decoration: none; border-radius: 6px; font-weight: bold; }
      
      @media only screen and (max-width: 600px) {
        .content { padding: 24px; }
        .logo-padding { padding: 24px 24px 0 24px; }
        h1 { font-size: 22px; }
        p { font-size: 15px; }
      }
    </style>
  </head>
  <body>
    <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${preheader}
    </div>

    <table class="wrapper" role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-top: 24px;">
          
          <table class="main" role="presentation" cellpadding="0" cellspacing="0">
            
            <tr>
              <td class="logo-padding">
                <a href="${homeUrl}" target="_blank" rel="noreferrer">
                  <img src="${logoUrl}" alt="${appName} Logo" width="50" height="auto" style="max-width: 100px;" />
                </a>
              </td>
            </tr>

            <tr>
              <td class="content">
                ${children}

                <div class="signature">
                  <p style="margin-bottom: 4px;">Thank you for using our platform.</p>
                  <p style="font-weight: 600; margin-bottom: 0;">The ${appName} Team</p>
                </div>
              </td>
            </tr>
          </table>

          <table class="footer" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
            <tr>
              <td align="center">
                <p style="font-size: 12px; margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
                <p style="font-size: 12px; margin: 0;">Plumbers Portal Ltd, PO Box 123, London SW1A 1AA, UK</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
