require("dotenv").config({
  path: __dirname + "/.env"
});

var SibApiV3Sdk = require('sib-api-v3-sdk');
var defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
var apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

var apiInstance = new SibApiV3Sdk.SMTPApi();
var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email

sendSmtpEmail = {
    sender: {
        name: process.env.SENDINBLUE_FROM_NAME,
        email: process.env.SENDINBLUE_FROM_EMAIL
    },
    to: [{
        name: process.env.SENDINBLUE_TO_NAME,
		email: process.env.SENDINBLUE_TO_EMAIL
	}],
	templateId: parseInt(process.env.SENDINBLUE_TEMPLATE_ID),
	params: {
        "order_id": "123456-ABCDEF",
        "order_text": "You ordered qty 1 widget at $4.99.",
        "url": "this is the link",
        "name": "Tony"
	}
};

apiInstance.sendTransacEmail(sendSmtpEmail).then(function(data) {
  console.log('API called successfully. Returned data: ' + data);
}, function(error) {
  console.error(error);
});
