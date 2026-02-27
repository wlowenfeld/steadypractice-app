import { Alert } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Invoice, Client } from './types';

interface SendInvoiceEmailParams {
  invoice: Invoice;
  client: Client;
  businessName: string;
  paymentInstructions: string;
  onSuccess?: () => void;
}

export async function sendInvoiceEmail({
  invoice,
  client,
  businessName,
  paymentInstructions,
  onSuccess,
}: SendInvoiceEmailParams): Promise<void> {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDueDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const fromName = businessName || 'TinyPractice';
  const subject = `Invoice: ${invoice.description} - ${formatCurrency(invoice.amount)}`;

  const paymentSection = paymentInstructions
    ? `Payment Instructions:\n${paymentInstructions}`
    : `Payment Instructions:\nPlease contact me for payment details.`;

  const body = `Dear ${client.name},

Please find below your invoice details:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Description: ${invoice.description}
Amount Due: ${formatCurrency(invoice.amount)}
Due Date: ${formatDueDate(invoice.dueDate)}
Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${paymentSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your business!

Best regards,
${fromName}

---
This invoice was generated using TinyPractice.`;

  const isAvailable = await MailComposer.isAvailableAsync();

  if (isAvailable) {
    try {
      await MailComposer.composeAsync({
        recipients: client.email ? [client.email] : [],
        subject,
        body,
      });
      onSuccess?.();
    } catch {
      // User cancelled or error
    }
  } else {
    Alert.alert(
      'No Email App',
      'No email app is available. Would you like to copy the invoice to clipboard?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: async () => {
            await Clipboard.setStringAsync(`${subject}\n\n${body}`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Copied', 'Invoice copied to clipboard');
            onSuccess?.();
          },
        },
      ]
    );
  }
}
