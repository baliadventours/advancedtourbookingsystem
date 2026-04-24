import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { emailBaseTemplate, bookingDetailsSection } from "./emailTemplates.js";

// Lazy-initialize Firestore only when needed
let db: any = null;

function getDb() {
  if (!db) {
    try {
      // Robust config loading for ES Modules & Cloud Environments
      let firebaseConfig: any = { projectId: process.env.VITE_FIREBASE_PROJECT_ID };
      
      const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, "utf-8");
        firebaseConfig = JSON.parse(configData);
      }

      if (admin.apps.length === 0 && firebaseConfig.projectId) {
        admin.initializeApp({
          projectId: firebaseConfig.projectId
        });
      }

      if (admin.apps.length > 0) {
        db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId || '(default)');
      }
    } catch (e) {
      console.warn("[Email Handler] Firebase Admin initialization FAILED. Using Env Vars fallback.", e);
      return null;
    }
  }
  return db;
}

export async function handleSendEmail(reqBody: any, authHeader?: string) {
    let { to, subject, html, type, booking, extraInfo } = reqBody;
    console.log(`[Email Handler] Processing: ${type || 'custom email'} to: ${to}`);

    const firestore = getDb();
    let idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
    let decodedToken: any = null;

    if (idToken) {
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (e) {
        console.warn("[Email Handler] Auth token verification failed.");
      }
    }

    // SECURITY: If no type/booking specified, only admins can send custom emails
    if (!type || !booking) {
      const isAdminEmail = decodedToken && (
        decodedToken.email === (process.env.PRIMARY_ADMIN_EMAIL || 'support@daytours.com') || 
        decodedToken.role === 'admin'
      );
      
      if (!isAdminEmail) {
        throw new Error("Unauthorized: Generic email sending restricted to admins.");
      }
    }

    try {
      let globalSettings: any = null;

      // 1. Try to fetch from Firestore first (Optional)
      if (firestore) {
        try {
          const settingsDoc = await firestore.collection('communicationSettings').doc('global').get();
          if (settingsDoc.exists) {
            globalSettings = settingsDoc.data();
          }
          
          const siteSettingsDoc = await firestore.collection('settings').doc('general').get();
          if (siteSettingsDoc.exists) {
            const siteData = siteSettingsDoc.data();
            globalSettings = {
              ...globalSettings,
              siteName: siteData.siteName,
              logo: siteData.logoURL,
              officeAddress: siteData.officeAddress,
              supportEmail: siteData.supportEmail,
              supportPhone: siteData.supportPhone,
              primaryColor: siteData.primaryColor,
              secondaryColor: siteData.secondaryColor
            };
          }
        } catch (firestoreError: any) {
          console.error("[Email Handler] Firestore fetch FAILED:", firestoreError.message);
        }
      }

      // 2. Fallback to Environment Variables or provide fallback values
      const envValues = {
        emailProvider: process.env.DEFAULT_EMAIL_PROVIDER || globalSettings?.emailProvider || 'resend',
        emailApiKey: process.env.RESEND_API_KEY || process.env.BREVO_API_KEY || process.env.SENDGRID_API_KEY || globalSettings?.emailApiKey || '',
        senderEmail: process.env.SENDER_EMAIL || globalSettings?.senderEmail || globalSettings?.supportEmail || 'onboarding@resend.dev',
        senderName: process.env.SENDER_NAME || globalSettings?.senderName || globalSettings?.siteName || 'Travel Platform',
        adminNotificationEmail: process.env.PRIMARY_ADMIN_EMAIL || globalSettings?.adminNotificationEmail || 'admin@example.com',
        gmailUser: process.env.GMAIL_USER || globalSettings?.gmailUser || '',
        gmailAppPassword: process.env.GMAIL_APP_PASSWORD || globalSettings?.gmailAppPassword || ''
      };

      // Determine active provider based on which Env Var is set (Priority: Resend first)
      if (process.env.RESEND_API_KEY) envValues.emailProvider = 'resend';
      else if (process.env.BREVO_API_KEY) envValues.emailProvider = 'brevo';
      else if (process.env.SENDGRID_API_KEY) envValues.emailProvider = 'sendgrid';
      else if (process.env.GMAIL_APP_PASSWORD) envValues.emailProvider = 'gmail';

      // Merge results
      const config = {
        ...globalSettings,
        ...envValues
      };

      // If a specific template type is provided, process it server-side
      if (type && booking) {
        const defaultTemplates: any = {
           booking_pending: { subject: "Booking Pending - {{tourTitle}}", body: "Thank you for choosing DayTours! We are currently reviewing your booking request for {{tourTitle}}. You will receive a confirmation email once it's approved.", enabled: true },
           booking_confirmed: { subject: "Booking Confirmed! - {{tourTitle}}", body: "Great news! Your booking for {{tourTitle}} with DayTours is confirmed. We can't wait to show you the best of your destination!", enabled: true },
           booking_cancelled: { subject: "Booking Cancelled - #{{bookingId}}", body: "Your booking for {{tourTitle}} has been cancelled. If you have any questions, please contact our support team.", enabled: true },
           booking_status_updated: { subject: "Booking Update - #{{bookingId}}", body: "Your booking for {{tourTitle}} has been updated with new details. Please review the summary below.", enabled: true },
           booking_date_changed: { subject: "Tour Date Changed - #{{bookingId}}", body: "The date for your tour {{tourTitle}} has been updated. Please check the new schedule below.", enabled: true },
           booking_payment_received: { subject: "Payment Received! - #{{bookingId}}", body: "We've received and verified your payment for #{{bookingId}}. Thank you! Your adventure is fully secured.", enabled: true },
           guide_assigned: { subject: "Your Guide is Assigned! - {{tourTitle}}", body: "We've assigned a guide for your upcoming tour! You can see your guide's details below and contact them directly via WhatsApp for any further discussion.", enabled: true },
           admin_new_booking: { subject: "New Booking Received!", body: "A new booking has been received for {{tourTitle}}. Please log in to the admin panel to review and manage this booking.", enabled: true }
        };

        const template = config.templates?.[type] || defaultTemplates[type];
        if (!template || !template.enabled || config.emailProvider === 'none') {
          return { success: true, skipped: true };
        }

        subject = template.subject;
        let body = template.body;

        to = type.startsWith('admin_') ? config.adminNotificationEmail : (to || booking.customerData.email);

        const participants = booking.participants || booking.guests || { adults: 0, children: 0 };
        const guestsText = `${participants.adults || 0} Adults${participants.children > 0 ? `, ${participants.children} Children` : ""}`;
        
        // Better Date Formatting
        let displayDate = booking.date;
        try {
          const dateObj = new Date(booking.date);
          if (!isNaN(dateObj.getTime())) {
            displayDate = dateObj.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          }
        } catch (e) {}

        // Format Price based on common Bali standards (usually IDR or USD)
        const formatCurrency = (val: number) => {
          if (val > 10000) {
             return val.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
          }
          return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
        };

        // Build detailed price breakdown HTML
        let baseAmount = booking.totalAmount - (booking.selectedAddOns?.reduce((acc: number, curr: any) => acc + (curr.price * (curr.quantity || 1)), 0) || 0) + (booking.discountAmount || 0);
        
        let priceBreakdownHtml = `
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
              <div style="font-weight: 700; color: #1e293b;">${booking.packageName}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                ${booking.participants?.adults > 0 ? `Adult x${booking.participants.adults}` : ""}
                ${booking.participants?.children > 0 ? `<br>Child x${booking.participants.children}` : ""}
              </div>
            </td>
            <td align="right" style="padding: 15px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">
              ${formatCurrency(baseAmount)}
            </td>
          </tr>
        `;

        if (booking.selectedAddOns && booking.selectedAddOns.length > 0) {
          priceBreakdownHtml += `
            <tr>
              <td colspan="2" style="padding: 15px 15px 5px; font-size: 10px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 1px;">ADD-ONS</td>
            </tr>
          `;
          booking.selectedAddOns.forEach((addon: any) => {
            priceBreakdownHtml += `
              <tr>
                <td style="padding: 5px 15px 15px;">
                  <div style="font-weight: 600; color: #1e293b; font-size: 13px;">${addon.name}</div>
                  <div style="font-size: 11px; color: #94a3b8;">${formatCurrency(addon.price)} x ${addon.quantity || 1}</div>
                </td>
                <td align="right" style="padding: 5px 15px 15px; font-weight: 600; color: #1e293b; font-size: 13px;">
                  +${formatCurrency(addon.price * (addon.quantity || 1))}
                </td>
              </tr>
            `;
          });
        }

        if (booking.discountAmount > 0) {
           priceBreakdownHtml += `
            <tr>
              <td style="padding: 15px; border-top: 1px solid #f1f5f9;">
                <div style="font-weight: 700; color: #ef4444;">Discount Applied</div>
                <div style="font-size: 11px; color: #ef4444; margin-top: 2px;">${booking.couponCode || 'Promo Code'}</div>
              </td>
              <td align="right" style="padding: 15px; font-weight: 700; color: #ef4444; border-top: 1px solid #f1f5f9;">
                -${formatCurrency(booking.discountAmount)}
              </td>
            </tr>
          `;
        }

        const placeholders: any = {
          "{{customerName}}": booking.customerData?.fullName || "Guest",
          "{{bookingId}}": booking.id?.substring(0, 8).toUpperCase() || "N/A",
          "{{tourTitle}}": booking.tourTitle || "Selected Tour",
          "{{packageName}}": booking.packageName || "Selected Package",
          "{{date}}": displayDate,
          "{{time}}": booking.time || "09:00",
          "{{guests}}": guestsText,
          "{{totalAmount}}": formatCurrency(booking.totalAmount),
          "{{priceBreakdown}}": priceBreakdownHtml,
          "{{status}}": booking.status,
          "{{phone}}": booking.customerData?.phone || "N/A",
          "{{email}}": booking.customerData?.email || "N/A",
          "{{pickupAddress}}": booking.customerData?.pickupAddress || "Meet at location",
          "{{guideRow}}": (booking.assignedGuideName || extraInfo?.["{{guideName}}"]) ? `
            <tr>
                <td style="padding: 10px 0; color: #94a3b8; border-top: 1px solid #f1f5f9;">Guide</td>
                <td style="padding: 10px 0; font-weight: 700; color: #1e293b; border-top: 1px solid #f1f5f9;">${extraInfo?.["{{guideName}}"] || booking.assignedGuideName}</td>
            </tr>
            ${(booking.assignedGuideWhatsapp || extraInfo?.["{{guideWhatsapp}}"]) ? `
            <tr>
                <td style="padding: 10px 0; color: #94a3b8;">Guide WhatsApp</td>
                <td style="padding: 10px 0; font-weight: 700; color: #ea580c;">${extraInfo?.["{{guideWhatsapp}}"] || booking.assignedGuideWhatsapp}</td>
            </tr>
            ` : ""}
          ` : "",
          ...extraInfo
        };

        // Helper for recursive-like replacement
        const performReplacement = (text: string, data: any) => {
          if (!text) return "";
          let result = text;
          // Run multiple times to handle nested placeholders (e.g. {{tourTitle}} inside {{body}})
          for (let i = 0; i < 3; i++) {
            Object.keys(data).forEach(key => {
              const val = data[key]?.toString() || '';
              result = result.split(key).join(val);
            });
          }
          return result;
        };

        // Pre-process body so it can be safely used in templates
        body = performReplacement(body, placeholders);
        subject = performReplacement(subject, placeholders);
        
        // Add processed body back to placeholders for the final HTML template
        placeholders["{{body}}"] = body;

        // NEW: Standardize visual template
        if (type === 'booking_confirmed' || type === 'booking_pending' || type.startsWith('admin_') || type === 'guide_assigned') {
          const title = type === 'booking_confirmed' ? 'Booking Confirmed!' : 
                        type === 'booking_pending' ? 'Booking Pending' : 
                        type === 'admin_new_booking' ? 'New Booking Received!' : 
                        type === 'guide_assigned' ? 'Guide Assigned!' :
                        'System Notification';
          
          const subtitle = type === 'booking_confirmed' ? 'Your adventure is all set.' : 
                           type === 'booking_pending' ? 'We are reviewing your request.' :
                           type === 'admin_new_booking' ? `New booking from ${booking.customerData?.fullName}` :
                           type === 'guide_assigned' ? `A guide has been assigned to your tour.` :
                           'Important update regarding a booking.';

          const contentHtml = bookingDetailsSection(booking, config);
          html = emailBaseTemplate(title, subtitle, contentHtml, config);
        } else if (type === 'booking_cancelled' || type === 'booking_status_updated' || type === 'booking_date_changed' || type === 'booking_payment_received') {
          const titleMap: any = {
            'booking_cancelled': 'Booking Cancelled',
            'booking_status_updated': 'Status Updated',
            'booking_date_changed': 'Date Changed',
            'booking_payment_received': 'Payment Received'
          };
          const title = titleMap[type] || 'Status Updated';
          const subtitle = `Booking Reference: #${booking.id?.substring(0, 8).toUpperCase()}`;
          const contentHtml = bookingDetailsSection(booking, config);
          html = emailBaseTemplate(title, subtitle, contentHtml, config);
        } else if (type === 'test') {
           html = emailBaseTemplate('Test Notification', 'System check completed successfully.', html || '<p>This is a test notification.</p>', config);
        } else {
           html = html || body || "";
           if (!html.includes('<html>')) {
             html = emailBaseTemplate(subject, "New Notification", html, config);
           }
        }

        // Final replacement pass on the entire generated HTML
        html = performReplacement(html, placeholders);
        subject = performReplacement(subject, placeholders);
      }

      // 3. Validate
      if (config.emailProvider === 'none') {
        return { success: true, skipped: true, reason: 'Provider set to none' };
      }

      // Gmail uses app password, others use emailApiKey
      if (config.emailProvider === 'gmail') {
        if (!config.gmailUser || !config.gmailAppPassword) {
          throw new Error("Gmail credentials missing (GMAIL_USER or GMAIL_APP_PASSWORD)");
        }
      } else {
        if (!config.emailApiKey) {
          throw new Error(`API Key missing for provider: ${config.emailProvider}`);
        }
      }

      if (config.emailProvider === 'resend') {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.emailApiKey}`,
          },
          body: JSON.stringify({
            from: `${config.senderName} <${config.senderEmail}>`,
            to,
            subject,
            html,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Resend error");
        return { success: true, data };
      } 
      
      if (config.emailProvider === 'sendgrid') {
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.emailApiKey}`,
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: config.senderEmail, name: config.senderName },
            subject,
            content: [{ type: "text/html", value: html }],
          }),
        });

        if (!response.ok) {
           const errData = await response.text();
           throw new Error(errData || "SendGrid error");
        }
        return { success: true };
      }

      if (config.emailProvider === 'brevo') {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.emailApiKey,
          },
          body: JSON.stringify({
            sender: { name: config.senderName, email: config.senderEmail },
            to: [{ email: to }],
            subject: subject,
            htmlContent: html,
          }),
        });

        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.message || "Brevo error");
        }
        return { success: true };
      }

      if (config.emailProvider === 'gmail') {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: config.gmailUser,
            pass: config.gmailAppPassword,
          },
        });

        await transporter.sendMail({
          from: `"${config.senderName}" <${config.gmailUser}>`,
          to,
          subject,
          html,
        });

        return { success: true };
      }

      throw new Error(`Provider ${config.emailProvider} not implemented`);

    } catch (error: any) {
      console.error("[Email Handler Error]:", error);
      throw error;
    }
}
