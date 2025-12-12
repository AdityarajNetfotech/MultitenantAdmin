export const ticketCreatedTemplate = (adminName, userName, role, subject, description, priority) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #333;">🚨 New Ticket Raised</h2>
      
      <p>Hello <strong>${adminName}</strong>,</p>
      <p>A new ticket has been raised by <strong>${userName}</strong> (${role}).</p>
 
      <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #4A90E2; margin: 15px 0;">
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Priority:</strong> <span style="color:#d9534f">${priority}</span></p>
      </div>
 
      <p>Please review the ticket in your admin dashboard.</p>
 
      <br/>
      <p>Regards,</p>
      <strong>RecruiterPro System</strong>
    </div>
  `;
};