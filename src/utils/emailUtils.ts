/**
 * Utility for sending payout notifications.
 * In a production environment, this would call a backend API (Vercel/Supabase Function)
 * which uses a service like Resend or SendGrid.
 */

export interface PayoutEmailData {
  recipientName: string;
  recipientEmail: string;
  amount: string;
  invoiceId: string;
  payoutMethod: string;
}

export const sendPayoutNotification = async (data: PayoutEmailData) => {
  console.log('--- EMAIL NOTIFICATION SIMULATION ---');
  console.log(`To: ${data.recipientEmail}`);
  console.log(`Subject: Your Upshift Payout is on its way! 💸`);
  console.log(`Body: 
    Hi ${data.recipientName},
    
    Great news! We've just processed your payout of ${data.amount}.
    The funds are being sent via ${data.payoutMethod}.
    
    You can view and download your invoice (${data.invoiceId.substring(0, 8)}) in your Creator Portal settings.
    
    Keep up the great work!
    - The Upshift Team
  `);
  console.log('--------------------------------------');

  // Example of how to call a real API:
  /*
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: data.recipientEmail,
      type: 'payout_processed',
      data: data
    })
  });
  return response.ok;
  */
  
  return true;
};
