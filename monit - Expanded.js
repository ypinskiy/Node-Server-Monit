	const axios = require("axios");
	const nodemailer = require("nodemailer");
	const {
		IncomingWebhook
	} = require('@slack/webhook');
	// const {
	// 	WebClient
	// } = require('@slack/web-api');
	// const {
	// 	createMessageAdapter
	// } = require('@slack/interactive-messages');

	const url = "https://hooks.slack.com/services/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";
	// const token = "xoxb-98515945203-1352925103298-RTmU8F6h4u10C6oxNASmtoGZ";

	// const web = new WebClient(token);
	const webhook = new IncomingWebhook(url);

	// const slackInteractions = createMessageAdapter("cefb5eedd058520e8436b43a4acd8d72");
	// const port = process.env.PORT || 3000;

	// slackInteractions.action({
	// 	actionId: 'logs'
	// }, (payload, respond) => {
	// 	// `payload` contains information about the action
	// 	// see: https://api.slack.com/docs/interactive-message-field-guide#action_url_invocation_payload
	// 	console.log(payload);

	// 	// `respond` is a function that can be used to follow up on the action with a message
	// 	respond({
	// 		text: 'Success!',
	// 	});

	// 	// The return value is used to update the message where the action occurred immediately.
	// 	// Use this to items like buttons and menus that you only want a user to interact with once.
	// 	return {
	// 		text: 'Processing...',
	// 	}
	// });

	// slackInteractions.start(port).then(() => {
	// 	// Listening on path '/slack/actions' by default
	// 	console.log(`server listening on port ${port}`);
	// });

	// (async () => {
	// 	const res = await web.chat.postMessage({
	// 		channel: 'baldordev',
	// 		"blocks": [{
	// 				"type": "section",
	// 				"text": {
	// 					"type": "mrkdwn",
	// 					"text": "*Email Server on 57* has been up for 10 mins!"
	// 				}
	// 			},
	// 			{
	// 				"type": "divider"
	// 			},
	// 			{
	// 				"type": "actions",
	// 				"elements": [{
	// 						"type": "button",
	// 						"text": {
	// 							"type": "plain_text",
	// 							"text": "Restart Email Server",
	// 							"emoji": true
	// 						},
	// 						"value": "restart"
	// 					},
	// 					{
	// 						"type": "button",
	// 						"text": {
	// 							"type": "plain_text",
	// 							"text": "View Last Logs",
	// 							"emoji": true
	// 						},
	// 						"value": "logs"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	});
	// 	console.log('Message sent: ', res);
	// })();

	async function sendmail() {
		let transporter = nodemailer.createTransport({
			host: "mbx.baldorfood.com",
			port: 25,
			debug: false,
			secure: false
		});

		let info = await transporter.sendMail({
			from: 'nodeservermonitor@baldorfood.com',
			bcc: [],
			replyTo: [],
			to: 'IT@baldorfood.com',
			subject: 'Email Server on 57 is down!',
			html: 'The Node Server Monitor was unable to reach the email server on 57. Retrying in 10 minutes...'
		});
	}

	sendmail();

	// (async () => {
	// 	await webhook.send({
	// 	  text: 'Test message from Node Server Monitor. DONT WORRY 57 is ok for now.',
	// 	});
	//   })();

	async function SendWarnings() {
		sendmail();

		webhook.send({
			text: 'I was unable to contact the email server on 57. I will try again in 10 minutes.',
		});
	}

	setInterval(function () {
		console.log("Trying to reach server...");
		axios.get('http://10.0.0.57:4000/health-check')
			.then(function (response) {
				console.log("Response gotten from server check:", response.data);
				if (response.status != 200) {
					console.log("Error!", response);
					if (response.status == 503) {
						SendWarnings();
					}
				}
			})
			.catch(function (error) {
				console.log("Error:", error);
			});
	}, 600000);