	const axios = require("axios");
	const nodemailer = require("nodemailer");
	const {
		IncomingWebhook
	} = require('@slack/webhook');

	let transporter = nodemailer.createTransport({
		host: "mbx.baldorfood.com",
		port: 25,
		debug: false,
		secure: false
	});

	let sites = require("./sites.json");

	sites.forEach(function (site) {
		console.log(`Setting up monitoring for site "${site.name}"...`)
		console.log(site);
		site.timesFailed = 0;
		let slackWebHooks = [];
		for (let i = 0; i < site.slackChannelWebhooks.length; i++) {
			slackWebHooks.push(new IncomingWebhook(site.slackChannelWebhooks[i]));
		}

		setInterval(
			function () {
				console.log(`Checking ${site.name}...`);
				axios.get(site.url)
					.then(function (response) {
						console.log(`Completed check for ${site.name}:`, response.data);
						if (response.status != 200) {
							console.log(`Invalid HTTP code when checking ${site.name}:`, response);
							if (response.status == 503) {
								site.timesFailed++;
								if (site.timesFailed >= site.tries) {
									console.log(`${site.name} is probably down!`);
									console.log(`Should send email? ${site.emailAddresses.length > 0}`);
									console.log(`Should send Slack message? ${site.slackChannelWebhooks.length > 0}`);
									console.log(`Should send Teams message? ${site.teamsChannelWebhooks.length > 0}`);
									if (site.emailAddresses.length > 0) {
										transporter.sendMail({
											from: 'nodeservermonitor@baldorfood.com',
											bcc: [],
											replyTo: [],
											to: site.emailAddresses,
											subject: `${site.name} might be down!`,
											html: `The Node Server Monitor was unable to reach ${site.name} ${site.timesFailed} times. Retrying in ${site.interval} minutes...`
										});
									}

									slackWebHooks.forEach(function (webhook) {
										webhook.send({
											text: `I was unable to reach ${site.name} ${site.timesFailed} times. I will retry in ${site.interval} minutes...`,
										});
									});

									let teamsCard = {
										'@type': 'MessageCard',
										'@context': 'http://schema.org/extensions',
										'themeColor': "0078D7",
										summary: 'Server Monitor detected an outage',
										sections: [{
											activityTitle: `The Server Monitor was unable to reach ${site.name}`,
											text: `I was unable to reach ${site.name} ${site.timesFailed} times. I will retry in ${site.interval} minutes...`,
										}, ],
									};
									site.teamsChannelWebhooks.forEach(function (webhookURL) {
										axios.post(webhookURL, teamsCard, {
											headers: {
												'content-type': 'application/vnd.microsoft.teams.card.o365connector',
												'content-length': `${teamsCard.toString().length}`,
											}
										})
									});
								}
							}
						} else {
							site.timesFailed = 0;
						}
					})
					.catch(function (error) {
						console.log(`Error checking ${site.name}:`, error);
					});
			}, site.interval * 60000
		);
	});