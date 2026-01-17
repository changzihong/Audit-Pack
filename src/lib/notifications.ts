import { supabase } from './supabase';

interface EmailNotification {
    to_email: string; // Ideally we'd have this. For now we might simulate or require it.
    subject: string;
    html: string;
}

/**
 * Simulates sending an email notification.
 * In a real production app, this would call a Supabase Edge Function
 * or an API like Resend/SendGrid.
 */
export const sendEmailNotification = async (
    userId: string,
    status: string,
    requestTitle: string
) => {
    console.log(`Preparing to email user ${userId} about '${status}'...`);

    // 1. Try to get user details (email isn't in public profile by default)
    // We can't access auth.users emails from here. 
    // So we'll simulate the "sending" process.

    const timestamp = new Date().toLocaleTimeString();

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // 2. Insert In-App Notification (So they see it in the dropdown)
    await supabase.from('notifications').insert({
        user_id: userId,
        title: `Request ${status === 'changes_requested' ? 'Update Required' : status === 'approved' ? 'Approved' : 'Rejected'}`,
        content: `Your request "${requestTitle}" has been ${status.replace('_', ' ')}.`,
        is_read: false
    });

    // In a real implementation:
    // await fetch('https://api.resend.com/emails', { ... })

    console.log(`[${timestamp}] 📧 EMAIL SENT to owner of request: "${requestTitle}"`);
    console.log(`Subject: Update on your Audit Request: ${status.toUpperCase()}`);

    return true;
};

/**
 * Notifies Admins and Managers about a new or updated request.
 */
export const notifyAdminsAndManagers = async (
    department: string,
    action: 'created' | 'updated' | 'resubmitted',
    requestTitle: string,
    requestId: string,
    employeeName: string
) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🔔 Notifying Admins/Managers about "${requestTitle}" (${action})...`);

    try {
        // 1. Find target users (Admins + Managers of that department)
        const { data: recipients, error } = await supabase
            .from('profiles')
            .select('id, role, department, full_name')
            .or(`role.eq.admin,and(role.eq.manager,department.eq.${department})`);

        if (error || !recipients) {
            console.error('Error finding notification recipients:', error);
            return;
        }

        console.log(`Found ${recipients.length} recipients for notification:`, recipients.map(r => r.full_name));

        // 2. Send Notifications (In-App + Email Simulation)
        const notifications = recipients.map(recipient => ({
            user_id: recipient.id,
            title: `Request ${action === 'created' ? 'New' : 'Updated'}: ${requestTitle.slice(0, 20)}...`,
            content: `${employeeName} has ${action} a request in ${department}.`,
            is_read: false,
            // resource_id: requestId // If we added the column, we'd use this.
        }));

        if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
        }

        // 3. Simulate Emails
        recipients.forEach(recipient => {
            console.log(`\n--- 📧 SIMULATED EMAIL TO ${recipient.role.toUpperCase()}: ${recipient.full_name} ---`);
            console.log(`To: [${recipient.role}@company.com]`); // Placeholder
            console.log(`Subject: Action Required: ${action.toUpperCase()} Request from ${employeeName}`);
            console.log(`Body: A request titled "${requestTitle}" requires your review in the Audit Pack dashboard.`);
            console.log(`Link: /request/${requestId}`);
            console.log('-----------------------------------------------------\n');
        });

    } catch (err) {
        console.error('Notification logic failed:', err);
    }
};
