import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

// Helper function to load image from URL and convert to base64
const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    throw error;
  }
};

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
  agent_signature?: { 
    name?: string; 
    fileName?: string; 
    url?: string; 
    type?: string; 
    size?: number; 
  };
}

export const generateStandardizedCPVPDF = async (
  merchant: MerchantInfo,
  formData: CPVFormData,
  completedData?: CompletedFormData
): Promise<Blob> => {
  try {
    console.log('=== PDF GENERATION DEBUG ===');
    console.log('Merchant:', merchant);
    console.log('Form Data:', formData);
    console.log('Completed Data:', completedData);
    
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

      for (const section of sections) {
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
        for (const field of fields) {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          let value = '';
          let shouldSkipTextRendering = false;
          
          console.log(`PDF Field Processing - ID: ${field.id}, Title: ${field.title}`);
          console.log(`PDF Field Processing - Available in completedData:`, completedData ? Object.keys(completedData) : 'No completed data');
          
          // CRITICAL: Always prioritize completed data - ensure single source of truth
          if (completedData && completedData.hasOwnProperty(field.id) && completedData[field.id] !== null && completedData[field.id] !== '') {
            value = completedData[field.id];
            console.log(`PDF Field Processing - Found value for ${field.id}:`, value);
            
            // Handle special field types
            if (field.id === 'visit_date' && completedData.visit_date) {
              value = format(new Date(completedData.visit_date), 'PPP');
            } else if (field.id === 'visit_time' && completedData.visit_time) {
              value = completedData.visit_time;
            } else if (field.id === 'agent_signature' && completedData.agent_signature) {
              if (typeof completedData.agent_signature === 'object') {
                if (completedData.agent_signature.name) {
                  value = completedData.agent_signature.name;
                } else if (completedData.agent_signature.fileName) {
                  value = completedData.agent_signature.fileName;
                }
              } else {
                value = String(completedData.agent_signature);
              }
            }
          } else {
            console.log(`PDF Field Processing - No direct value found for ${field.id}, checking alternatives...`);
            
            // Only use stored CPV agent name from merchant data if no completed data exists
            if (field.id === 'agent_name' || (field.title && field.title.toLowerCase().includes('agent'))) {
              value = completedData?.cpv_agent_name || merchant.cpv_agent_name || 'Not provided';
            } else if (field.id === 'visit_date' && completedData?.visit_date) {
              value = format(new Date(completedData.visit_date), 'PPP');
            } else if (field.id === 'visit_time' && completedData?.visit_time) {
              value = completedData.visit_time;
            } else if (field.id === 'agent_signature' && completedData?.agent_signature) {
              if (typeof completedData.agent_signature === 'object') {
                if (completedData.agent_signature.name) {
                  value = completedData.agent_signature.name;
                } else if (completedData.agent_signature.fileName) {
                  value = completedData.agent_signature.fileName;
                }
              } else {
                value = String(completedData.agent_signature);
              }
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
          
          console.log(`PDF Field Processing - Final value for ${field.id}:`, value);

          // Handle file/image fields - display uploaded images with actual images in PDF
          if ((field.type === 'image' || field.type === 'file') && completedData) {
            console.log(`Processing image field: ${field.id}, type: ${field.type}`);
            console.log(`Available keys in completedData:`, Object.keys(completedData));
            
            // Strategy 1: Look for exact pattern matches (fieldId-0, fieldId-1, etc.)
            const exactImageKeys = Object.keys(completedData).filter(key => 
              key.startsWith(`${field.id}-`) && key.match(new RegExp(`^${field.id}-\\d+$`))
            ).sort();
            console.log(`Exact image keys for ${field.id}:`, exactImageKeys);
            
            // Strategy 2: Look for timestamp-based keys (like 1756466562039-0)
            const timestampImageKeys = Object.keys(completedData).filter(key => 
              key.includes('-') && completedData[key] && 
              typeof completedData[key] === 'object' && 
              completedData[key].url && 
              completedData[key].fileName &&
              (key.includes(field.id) || 
               (field.title && (
                 key.toLowerCase().includes(field.title.toLowerCase().replace(/\s+/g, '')) ||
                 field.title.toLowerCase().includes('photo') && key.includes('photo') ||
                 field.title.toLowerCase().includes('business') && key.includes('business') ||
                 field.title.toLowerCase().includes('person') && key.includes('person') ||
                 field.title.toLowerCase().includes('office') && key.includes('office')
               )))
            ).sort();
            console.log(`Timestamp image keys for ${field.id}:`, timestampImageKeys);
            
            // Strategy 3: Look for any keys that contain image data and might be related
            const allImageKeys = Object.keys(completedData).filter(key => {
              const data = completedData[key];
              return data && typeof data === 'object' && data.url && data.fileName && data.type && data.type.startsWith('image/');
            });
            console.log(`All available image keys:`, allImageKeys);
            
            // Choose the best strategy
            let imageKeysToUse = exactImageKeys.length > 0 ? exactImageKeys : 
                               timestampImageKeys.length > 0 ? timestampImageKeys : 
                               allImageKeys.filter(key => key.includes('-')); // Use any indexed images as fallback
            
            console.log(`Using image keys for ${field.id}:`, imageKeysToUse);
            
            if (imageKeysToUse.length > 0) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              pdf.text(`${field.title}:`, 25, yPosition);
              yPosition += 6;
              
              for (let index = 0; index < imageKeysToUse.length; index++) {
                const key = imageKeysToUse[index];
                const imageData = completedData[key];
                console.log(`Processing image key ${key}:`, imageData);
                
                if (imageData && typeof imageData === 'object' && (imageData.url || imageData.fileName)) {
                  pdf.setFont('helvetica', 'normal');
                  pdf.text(`  ${index + 1}. ${imageData.fileName || 'Image uploaded'}`, 30, yPosition);
                  yPosition += 5;
                  
                  // Try to embed the actual image
                  if (imageData.url && imageData.type && imageData.type.startsWith('image/')) {
                    try {
                      console.log(`Loading image from URL: ${imageData.url}`);
                      const base64Image = await loadImageAsBase64(imageData.url);
                      const imgWidth = 80;
                      const imgHeight = 60;
                      
                      // Check if we need a new page
                      if (yPosition + imgHeight > pageHeight - 20) {
                        pdf.addPage();
                        yPosition = 20;
                      }
                      
                      pdf.addImage(base64Image, 'JPEG', 35, yPosition, imgWidth, imgHeight);
                      yPosition += imgHeight + 5;
                      console.log(`Successfully added image to PDF`);
                    } catch (imgError) {
                      console.error('Error adding image to PDF:', imgError);
                      pdf.setFontSize(8);
                      pdf.text(`     URL: ${imageData.url}`, 30, yPosition);
                      pdf.setFontSize(10);
                      yPosition += 5;
                    }
                  } else if (imageData.url) {
                    pdf.setFontSize(8);
                    pdf.text(`     URL: ${imageData.url}`, 30, yPosition);
                    pdf.setFontSize(10);
                    yPosition += 5;
                  }
                }
              }
              shouldSkipTextRendering = true;
            }
            // Check if the main field contains image data
            else if (completedData[field.id]) {
              const fileData = completedData[field.id];
              console.log(`Processing main field data for ${field.id}:`, fileData);
              
              // Handle array of images
              if (Array.isArray(fileData)) {
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${field.title}:`, 25, yPosition);
                yPosition += 6;
                
                for (let index = 0; index < fileData.length; index++) {
                  const image = fileData[index];
                  if (image && typeof image === 'object' && (image.url || image.fileName)) {
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(`  ${index + 1}. ${image.fileName || 'Image uploaded'}`, 30, yPosition);
                    yPosition += 5;
                    
                    // Try to embed the actual image
                    if (image.url && image.type && image.type.startsWith('image/')) {
                      try {
                        console.log(`Loading image from array URL: ${image.url}`);
                        const base64Image = await loadImageAsBase64(image.url);
                        const imgWidth = 80;
                        const imgHeight = 60;
                        
                        // Check if we need a new page
                        if (yPosition + imgHeight > pageHeight - 20) {
                          pdf.addPage();
                          yPosition = 20;
                        }
                        
                        pdf.addImage(base64Image, 'JPEG', 35, yPosition, imgWidth, imgHeight);
                        yPosition += imgHeight + 5;
                        console.log(`Successfully added array image to PDF`);
                      } catch (imgError) {
                        console.error('Error adding array image to PDF:', imgError);
                        pdf.setFontSize(8);
                        pdf.text(`     URL: ${image.url}`, 30, yPosition);
                        pdf.setFontSize(10);
                        yPosition += 5;
                      }
                    }
                  } else if (image) {
                    // Handle simple string filenames
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(`  ${index + 1}. ${String(image)}`, 30, yPosition);
                    yPosition += 5;
                  }
                }
                shouldSkipTextRendering = true;
              }
              // Handle single image/file
              else if (typeof fileData === 'object' && (fileData.url || fileData.fileName)) {
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${field.title}:`, 25, yPosition);
                yPosition += 6;
                
                pdf.setFont('helvetica', 'normal');
                pdf.text(`  ${fileData.fileName || 'File uploaded'}`, 30, yPosition);
                yPosition += 5;
                
                // Try to embed the actual image
                if (fileData.url && fileData.type && fileData.type.startsWith('image/')) {
                  try {
                    console.log(`Loading single image from URL: ${fileData.url}`);
                    const base64Image = await loadImageAsBase64(fileData.url);
                    const imgWidth = 80;
                    const imgHeight = 60;
                    
                    // Check if we need a new page
                    if (yPosition + imgHeight > pageHeight - 20) {
                      pdf.addPage();
                      yPosition = 20;
                    }
                    
                    pdf.addImage(base64Image, 'JPEG', 35, yPosition, imgWidth, imgHeight);
                    yPosition += imgHeight + 5;
                    console.log(`Successfully added single image to PDF`);
                  } catch (imgError) {
                    console.error('Error adding single image to PDF:', imgError);
                    pdf.setFontSize(8);
                    pdf.text(`  URL: ${fileData.url}`, 30, yPosition);
                    pdf.setFontSize(10);
                    yPosition += 5;
                  }
                } else if (fileData.url) {
                  pdf.setFontSize(8);
                  pdf.text(`  URL: ${fileData.url}`, 30, yPosition);
                  pdf.setFontSize(10);
                  yPosition += 5;
                }
                shouldSkipTextRendering = true;
              }
            }
          }

          if (!shouldSkipTextRendering) {
            // Convert value to string and handle arrays/objects for human readability
            if (Array.isArray(value)) {
              value = value.join(', ');
            } else if (typeof value === 'object' && value !== null) {
              // Handle objects more gracefully for human readability
              const objValue = value as any;
              if (objValue.fileName) {
                value = objValue.fileName;
              } else if (objValue.name) {
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
          }
        }

        yPosition += 8; // Extra space between sections
      }
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