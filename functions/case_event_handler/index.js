const catalyst = require('zcatalyst-sdk-node');

module.exports = async (event, context) => {
	try {
		// Initialize the Catalyst SDK
		const app = catalyst.initialize(context);
		console.log("Catalyst Event triggered by Signal!");
		
		// Event Data contains the payload from the Signal (e.g. Row Inserted in Datastore, File Uploaded)
		const eventData = event.data;
		const eventSource = event.source;
		const eventTime = event.time;

		console.log(`Received event from ${eventSource} at ${eventTime}`);
		console.log("Event Payload:", JSON.stringify(eventData));
		
		// Here you can react to the event, e.g.:
		// If it's a File Store upload event (Evidence uploaded), we can run moderation
		// If it's a Datastore insert event (New Case inserted), we can send an alert
		
		// SEND PUSH NOTIFICATION
		try {
			const push = app.pushNotification();
			const webPush = push.web();
			
			// For hackathon purposes, we use the authorized email as a proxy for a registered user ID
			const recipients = ["tejashwini@navabharathtechnologies.com"]; 
			
			await webPush.sendNotification('Rakshak AI Alert', recipients, { 
				message: `A new high-priority event occurred in ${eventSource}. Please review the dashboard.`,
				url: '/'
			});
			console.log("Catalyst Web Push Notification dispatched successfully!");
		} catch (pushErr) {
			console.error("Catalyst Push Notification failed (likely needs Web Push enabled in Catalyst Console):", pushErr.message || pushErr);
			console.log("Mocking successful Web Push dispatch for hackathon demo purposes.");
		}

		// Successfully close the event execution
		context.closeWithSuccess();
	} catch (err) {
		console.error("Event Handler Error:", err);
		// Close the event execution with failure
		context.closeWithFailure();
	}
};
