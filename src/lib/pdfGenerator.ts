import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export interface CPVFormData {
  sections: any; // Allow Json type from Supabase
  form_preview_data?: any;
  name: string;
  initiative: string;
}

export interface MerchantInfo {
  id: string;
  merchant_name: string;
  merchant_phone: string;
  merchant_address: string;
  city: string;
  state: string;
  pincode: string;
  verification_status: string;
  cpv_agent_name?: string;
  cpv_agent_assigned_on?: string;
  verification_file_url?: string;
}

export interface CompletedFormData {
  [key: string]: any;
  visit_date?: Date;
  visit_time?: string;
  agent_signature?: { name: string };
}

export const generateStandardizedCPVPDF = async (
  merchant: MerchantInfo,
  formData: CPVFormData,
  completedData?: CompletedFormData
): Promise<Blob> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CPV Verification Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Form details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Form: ${formData.name}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Initiative: ${formData.initiative}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, yPosition);
    yPosition += 15;

    // Merchant Information Section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Merchant Information', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${merchant.merchant_name}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Phone: ${merchant.merchant_phone}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Address: ${merchant.merchant_address}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`City: ${merchant.city}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`State: ${merchant.state}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Pincode: ${merchant.pincode}`, 20, yPosition);
    yPosition += 15;

    // Verification Status Section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Verification Status', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Status: ${merchant.verification_status.toUpperCase()}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`CPV Agent: ${merchant.cpv_agent_name || 'Not Assigned'}`, 20, yPosition);
    yPosition += 8;
    
    if (merchant.cpv_agent_assigned_on) {
      pdf.text(`Assignment Date: ${format(new Date(merchant.cpv_agent_assigned_on), 'MMM dd, yyyy')}`, 20, yPosition);
      yPosition += 8;
    }
    yPosition += 10;

    // Form Sections with Completed Data
    const sections = Array.isArray(formData.sections) ? formData.sections : [];
    if (sections.length > 0) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Form Details', 20, yPosition);
      yPosition += 15;

      sections.forEach((section: any) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }

        // Section heading
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.name, 20, yPosition);
        yPosition += 10;

        // Section fields
        const fields = Array.isArray(section.fields) ? section.fields : [];
        fields.forEach((field: any) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          let value = '';
          
          console.log(`Processing field ${field.id}, title: ${field.title}`); // Debug log
          
          // CRITICAL: Always prioritize completed data - no fallbacks to preview/dummy data
          if (completedData && completedData[field.id] !== undefined && completedData[field.id] !== null && completedData[field.id] !== '') {
            value = completedData[field.id];
            console.log(`Found completed data for ${field.id}:`, value); // Debug log
            
            // Handle special field types
            if (field.id === 'visit_date' && completedData.visit_date) {
              value = format(new Date(completedData.visit_date), 'PPP');
            } else if (field.id === 'visit_time' && completedData.visit_time) {
              value = completedData.visit_time;
            } else if (field.id === 'agent_signature' && completedData.agent_signature) {
              value = typeof completedData.agent_signature === 'object' && completedData.agent_signature.name 
                ? completedData.agent_signature.name 
                : String(completedData.agent_signature);
            }
          } else {
            console.log(`No completed data for ${field.id}, checking alternatives...`); // Debug log
            
            // Only use stored CPV agent name from merchant data if no completed data exists
            if (field.id === 'agent_name' || (field.title && field.title.toLowerCase().includes('agent'))) {
              value = completedData?.cpv_agent_name || merchant.cpv_agent_name || 'Not provided';
            } else if (field.id === 'visit_date' && completedData?.visit_date) {
              value = format(new Date(completedData.visit_date), 'PPP');
            } else if (field.id === 'visit_time' && completedData?.visit_time) {
              value = completedData.visit_time;
            } else if (field.id === 'agent_signature' && completedData?.agent_signature) {
              value = typeof completedData.agent_signature === 'object' && completedData.agent_signature.name 
                ? completedData.agent_signature.name 
                : String(completedData.agent_signature);
            } else {
              // Check if field has a default value or if it's in the form preview data
              if (formData.form_preview_data && formData.form_preview_data[field.id]) {
                value = formData.form_preview_data[field.id];
              } else if (field.value !== undefined) {
                value = field.value;
              } else {
                // Mark as explicitly not provided rather than using dummy data
                value = '';
              }
            }
          }
          
          console.log(`Final value for ${field.id}:`, value); // Debug log

          // Convert value to string and handle arrays/objects for human readability
          if (Array.isArray(value)) {
            value = value.join(', ');
          } else if (typeof value === 'object' && value !== null) {
            // Handle objects more gracefully for human readability
            const objValue = value as any;
            if (objValue.name) {
              value = objValue.name;
            } else if (objValue.label && objValue.value) {
              value = `${objValue.label}: ${objValue.value}`;
            } else {
              // Convert object to readable key-value pairs
              value = Object.entries(value)
                .map(([key, val]) => `${key}: ${val}`)
                .join(', ');
            }
          } else {
            value = String(value || '');
          }

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          
          // Ensure consistent display for all users - show exactly what was filled
          const displayValue = value || 'Not provided during verification';
          
          // Split long text to prevent overflow
          const maxLineLength = 60;
          if (displayValue.length > maxLineLength) {
            const lines = pdf.splitTextToSize(`${field.title}: ${displayValue}`, pageWidth - 50);
            lines.forEach((line: string) => {
              if (yPosition > pageHeight - 10) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(line, 25, yPosition);
              yPosition += 5;
            });
          } else {
            pdf.text(`${field.title}: ${displayValue}`, 25, yPosition);
            yPosition += 6;
          }
        });

        yPosition += 8; // Extra space between sections
      });
    }

    // Add completion timestamp if this is a completed form
    if (completedData || merchant.verification_status.toLowerCase() === 'verified') {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Completion Information', 20, yPosition);
      yPosition += 10;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Report Generated: ${format(new Date(), 'PPP')} at ${format(new Date(), 'pp')}`, 25, yPosition);
      yPosition += 8;
      
      if (merchant.verification_status.toLowerCase() === 'verified') {
        pdf.text(`Verification Completed: ${merchant.verification_status.toUpperCase()}`, 25, yPosition);
      }
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating standardized PDF:', error);
    throw new Error('Failed to generate PDF: ' + (error as Error).message);
  }
};

export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};