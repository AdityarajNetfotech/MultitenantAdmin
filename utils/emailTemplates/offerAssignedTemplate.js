export const offerAssignedTemplate = (hrName, jobTitle, priority, dueDate, rmgName) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2 style="color:#4A90E2;">📄 New Offer Assigned</h2>
 
      <p>Hello <strong>${hrName}</strong>,</p>
      <p>An offer has been assigned to you by <strong>${rmgName}</strong>.</p>
 
      <div style="padding:15px; background:#f3f3f3; border-left:4px solid #4A90E2;">
        <p><strong>Job Title:</strong> ${jobTitle}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toDateString()}</p>
      </div>
 
      <p>Please create a JD for this offer as soon as possible.</p>
 
      <br />
      <p>Regards,<br/>RecruiterPro System</p>
    </div>
  `;
};