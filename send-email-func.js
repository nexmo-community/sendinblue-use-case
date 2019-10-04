require("dotenv").config({
  path: __dirname + "/.env"
});


function send_email(username, order_id, order_text, url) {
  var SibApiV3Sdk = require("sib-api-v3-sdk");
  var defaultClient = SibApiV3Sdk.ApiClient.instance;

  var apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = process.env.SENDINBLUE_API_KEY;
  console.log("DEBUG: ", process.env.SENDINBLUE_API_KEY);

  var apiInstance = new SibApiV3Sdk.SMTPApi();
  var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email

  sendSmtpEmail = {
    sender: {
      name: process.env.SENDINBLUE_FROM_NAME,
      email: process.env.SENDINBLUE_FROM_EMAIL
    },
    to: [
      {
        name: process.env.SENDINBLUE_TO_NAME,
        email: process.env.SENDINBLUE_TO_EMAIL
      }
    ],
    templateId: parseInt(process.env.SENDINBLUE_TEMPLATE_ID),
    params: {
      order_id: order_id,
      order_text: order_text,
      url: url,
      name: username
    }
  };

  apiInstance.sendTransacEmail(sendSmtpEmail).then(
    function(data) {
      console.log("API called successfully. Returned data: " + data);
    },
    function(error) {
      console.error(error);
    }
  );
}

send_email("fred bloggs", "123-ABC-456", "Qty 4 - widgets at $2.00 each.", "localhost:3000/a/b/c");