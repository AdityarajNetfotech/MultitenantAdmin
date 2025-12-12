export const ticketUpdateTemplate = (userName, ticketId, newStatus, assignedToName) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #4A90E2;">🔔 Ticket Update Notification</h2>
 
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your ticket has been updated by the admin.</p>
 
      <div style="
        background: #f9f9f9;
        padding: 15px;
        border-radius: 6px;
        border-left: 4px solid #4A90E2;
        margin: 15px 0;
      ">
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>New Status:</strong> ${newStatus}</p>
        ${
          assignedToName
            ? `<p><strong>Assigned To:</strong> ${assignedToName}</p>`
            : ""
        }
      </div>
 
      <p>You can check updated ticket details in your dashboard.</p>
 
      <br />
      <p>Regards,</p>
      <strong>RecruiterPro System</strong>
    </div>
  `;
};