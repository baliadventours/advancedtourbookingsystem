export const emailBaseTemplate = (title: string, subtitle: string, content: string, siteSettings?: any) => {
  const primaryColor = siteSettings?.primaryColor || '#ea580c';
  const siteName = siteSettings?.siteName || 'Bali Adventours';
  const logo = siteSettings?.logo;
  const officeAddress = siteSettings?.officeAddress;
  const supportEmail = siteSettings?.supportEmail || 'info@baliadventours.com';
  const supportPhone = siteSettings?.supportPhone || '+6281246502939';
  const appUrl = process.env.VITE_APP_URL || '#';
  const displayUrl = appUrl.replace('https://', '').replace('http://', '');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #444;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: ${primaryColor}; padding: 35px 20px; color: #ffffff;">
                            <div style="letter-spacing: 2px; font-size: 10px; font-weight: 800; margin-bottom: 15px; opacity: 0.9;">${siteName}</div>
                            <div style="background-color: #ffffff; min-width: 44px; height: 44px; ${logo ? '' : 'border-radius: 50%;'} display: inline-block; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: ${logo ? '5px 15px' : '0'};">
                                ${logo ? `
                                    <img src="${logo}" alt="${siteName}" style="max-height: 34px; margin-top: 5px; display: block;" />
                                ` : `
                                    <div style="color: ${primaryColor}; font-size: 22px; line-height: 44px; font-weight: bold;">✓</div>
                                `}
                            </div>
                            <h1 style="margin: 0; font-size: 30px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.1;">${title}</h1>
                            <p style="margin: 8px 0 0; font-size: 15px; font-weight: 500; opacity: 0.95;">${subtitle}</p>
                        </td>
                    </tr>
                    
                    <!-- Content Area -->
                    <tr>
                        <td style="padding: 30px 25px;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- Help Box -->
                    <tr>
                        <td style="padding: 0 30px 40px;">
                            <div style="background-color: #f8fafc; border-left: 4px solid ${primaryColor}; border-radius: 8px; padding: 20px;">
                                <h4 style="margin: 0 0 5px; color: #1e293b; font-size: 16px; font-weight: 800;">Need help?</h4>
                                <p style="margin: 0; font-size: 14px; color: #64748b;">
                                    Email <a href="mailto:${supportEmail}" style="color: ${primaryColor}; font-weight: 700; text-decoration: none;">${supportEmail}</a> &bull; Call <span style="font-weight: 700; color: ${primaryColor};">${supportPhone}</span>
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #1e293b; padding: 40px 20px; color: #ffffff;">
                            <div style="font-weight: 900; font-size: 16px; letter-spacing: 1px; margin-bottom: 4px;">${siteName}</div>
                            ${officeAddress ? `<div style="font-size: 11px; opacity: 0.6; margin-bottom: 8px;">${officeAddress}</div>` : ''}
                            <div style="font-size: 12px; opacity: 0.7; margin-bottom: 20px;"><a href="${appUrl}" style="color: ${primaryColor}; text-decoration: none;">${displayUrl}</a></div>
                            
                            <div style="font-size: 11px; opacity: 0.5; line-height: 1.6;">
                                &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.<br>
                                You received this email because you made a booking on our platform.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

export const bookingDetailsSection = (booking: any, siteSettings?: any) => {
  const primaryColor = siteSettings?.primaryColor || '#ea580c';
  const accentLight = '#f8fafc'; // Neutral bg
  const accentBorder = '#e2e8f0';

  return `
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="border: 2px dashed ${primaryColor}33; padding: 15px 35px; border-radius: 10px; display: inline-block; background-color: ${primaryColor}08;">
            <div style="font-size: 9px; font-weight: 900; color: ${primaryColor}; letter-spacing: 1.5px; margin-bottom: 4px;">Booking reference</div>
            <div style="font-family: inherit; font-size: 28px; font-weight: 900; color: ${primaryColor}; letter-spacing: 1px;">{{bookingId}}</div>
        </div>
    </div>

    <p style="font-size: 15px; margin-bottom: 15px;">Hi <strong>{{customerName}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.5; color: #4b5563; margin-bottom: 25px;">
        {{body}}
    </p>

    <!-- Tour Details Table -->
    <h3 style="font-size: 11px; font-weight: 900; color: ${primaryColor}; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Tour details</h3>
    <table width="100%" style="font-size: 13px; margin-bottom: 25px;">
        <tr>
            <td style="padding: 10px 0; color: #94a3b8; width: 30%;">Tour</td>
            <td style="padding: 10px 0; font-weight: 700; color: #1e293b;">{{tourTitle}}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0; color: #94a3b8;">Package</td>
            <td style="padding: 10px 0; font-weight: 700; color: #1e293b;">{{packageName}}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0; color: #94a3b8;">Date</td>
            <td style="padding: 10px 0; font-weight: 700; color: #1e293b;">{{date}}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0; color: #94a3b8;">Time</td>
            <td style="padding: 10px 0; font-weight: 700; color: #1e293b;">{{time}}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0; color: #94a3b8; border-bottom: none;">Guests</td>
            <td style="padding: 10px 0; font-weight: 700; color: #1e293b; border-bottom: none;">{{guests}}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0; color: #94a3b8; border-top: 1px solid #f1f5f9;">Pickup</td>
            <td style="padding: 10px 0; font-weight: 700; color: #1e293b; border-top: 1px solid #f1f5f9;">{{pickupAddress}}</td>
        </tr>
        {{guideRow}}
    </table>

    <!-- Price summary -->
    <h3 style="font-size: 11px; font-weight: 900; color: ${primaryColor}; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Price summary</h3>
    <div style="background-color: ${accentLight}; border-radius: 8px; border: 1px solid ${accentBorder}; overflow: hidden; margin-bottom: 25px;">
        <table width="100%" style="font-size: 13px; border-collapse: collapse;">
            {{priceBreakdown}}
            <tr style="background-color: ${primaryColor};">
                <td style="padding: 12px 15px; color: #ffffff; font-weight: 900; font-size: 15px; letter-spacing: 1px;">Total paid</td>
                <td align="right" style="padding: 12px 15px; color: #ffffff; font-weight: 900; font-size: 20px;">{{totalAmount}}</td>
            </tr>
        </table>
    </div>

    <!-- What to expect -->
    <h3 style="font-size: 11px; font-weight: 900; color: ${primaryColor}; letter-spacing: 1px; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">What to expect</h3>
    
    <table width="100%" style="margin-bottom: 5px;">
        <tr>
            <td valign="top" width="35" style="padding-bottom: 15px;">
                <div style="background-color: ${primaryColor}10; color: ${primaryColor}; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 900; font-size: 12px;">1</div>
            </td>
            <td style="padding-bottom: 15px;">
                <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 2px;">Reminder on the way</div>
                <div style="color: #64748b; font-size: 12px; line-height: 1.4;">24 hours before your tour, we'll send a reminder with final details.</div>
            </td>
        </tr>
        <tr>
            <td valign="top" width="35" style="padding-bottom: 15px;">
                <div style="background-color: ${primaryColor}10; color: ${primaryColor}; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 900; font-size: 12px;">2</div>
            </td>
            <td style="padding-bottom: 15px;">
                <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 2px;">Arrive a little early</div>
                <div style="color: #64748b; font-size: 12px; line-height: 1.4;">Please be at the meeting point 15 minutes before your start time.</div>
            </td>
        </tr>
        <tr>
            <td valign="top" width="35" style="padding-bottom: 15px;">
                <div style="background-color: ${primaryColor}10; color: ${primaryColor}; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 900; font-size: 12px;">3</div>
            </td>
            <td style="padding-bottom: 15px;">
                <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 2px;">Pack light & comfortably</div>
                <div style="color: #64748b; font-size: 12px; line-height: 1.4;">Wear comfortable clothing and bring sunscreen, water, and adventure!</div>
            </td>
        </tr>
    </table>
`;
};
