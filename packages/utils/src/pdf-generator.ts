import jsPDF from 'jspdf';

export interface ReceiptData {
  paymentId: string;
  parentName: string;
  studentName: string;
  tripTitle: string;
  venueName: string;
  tripDate: string;
  amountCents: number;
  paymentDate: string;
  paymentMethod: string;
  currency?: string;
}

interface ReceiptTranslations {
  title: string;
  receiptNumber: string;
  date: string;
  parent: string;
  student: string;
  trip: string;
  venue: string;
  tripDate: string;
  amount: string;
  paymentMethod: string;
  footer: string;
}

const translations: Record<string, ReceiptTranslations> = {
  en: {
    title: 'Payment Receipt',
    receiptNumber: 'Receipt #:',
    date: 'Date:',
    parent: 'Parent:',
    student: 'Student:',
    trip: 'Trip:',
    venue: 'Venue:',
    tripDate: 'Trip Date:',
    amount: 'Amount:',
    paymentMethod: 'Payment Method:',
    footer: 'Thank you for using TripSlip!'
  },
  es: {
    title: 'Recibo de Pago',
    receiptNumber: 'Recibo #:',
    date: 'Fecha:',
    parent: 'Padre/Madre:',
    student: 'Estudiante:',
    trip: 'Viaje:',
    venue: 'Lugar:',
    tripDate: 'Fecha del Viaje:',
    amount: 'Monto:',
    paymentMethod: 'Método de Pago:',
    footer: '¡Gracias por usar TripSlip!'
  },
  ar: {
    title: 'إيصال الدفع',
    receiptNumber: 'رقم الإيصال:',
    date: 'التاريخ:',
    parent: 'ولي الأمر:',
    student: 'الطالب:',
    trip: 'الرحلة:',
    venue: 'المكان:',
    tripDate: 'تاريخ الرحلة:',
    amount: 'المبلغ:',
    paymentMethod: 'طريقة الدفع:',
    footer: 'شكراً لاستخدامك TripSlip!'
  }
};

export function generateReceipt(
  data: ReceiptData,
  language: 'en' | 'es' | 'ar' = 'en'
): jsPDF {
  const doc = new jsPDF();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';
  
  // Set up for RTL if Arabic
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = isRTL ? pageWidth - 20 : 20;
  const labelX = isRTL ? pageWidth - 20 : 20;
  const valueX = isRTL ? pageWidth - 80 : 80;
  
  // Add TripSlip branding
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TripSlip', isRTL ? pageWidth - 20 : 20, 20, { align: isRTL ? 'right' : 'left' });
  
  // Add receipt title
  doc.setFontSize(18);
  doc.text(t.title, isRTL ? pageWidth - 20 : 20, 40, { align: isRTL ? 'right' : 'left' });
  
  // Add horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 45, pageWidth - 20, 45);
  
  // Format currency
  const currencySymbol = data.currency === 'EUR' ? '€' : '$';
  const formattedAmount = `${currencySymbol}${(data.amountCents / 100).toFixed(2)}`;
  
  // Add payment details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const details: Array<[string, string]> = [
    [t.receiptNumber, data.paymentId],
    [t.date, data.paymentDate],
    [t.parent, data.parentName],
    [t.student, data.studentName],
    [t.trip, data.tripTitle],
    [t.venue, data.venueName],
    [t.tripDate, data.tripDate],
    [t.amount, formattedAmount],
    [t.paymentMethod, data.paymentMethod]
  ];
  
  let y = 60;
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, labelX, y, { align: isRTL ? 'right' : 'left' });
    doc.setFont('helvetica', 'normal');
    doc.text(value, valueX, y, { align: isRTL ? 'right' : 'left' });
    y += 10;
  });
  
  // Add footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(t.footer, pageWidth / 2, 280, { align: 'center' });
  
  return doc;
}

export function downloadReceipt(pdf: jsPDF, paymentId: string): void {
  pdf.save(`receipt-${paymentId}.pdf`);
}
