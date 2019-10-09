"use strict";

const nexmoclient = require("nexmo-client");
const SibApiV3Sdk = require("sib-api-v3-sdk");

require("dotenv").config({
  path: __dirname + "/.env"
});

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT;

const Nexmo = require("nexmo");
var nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET,
  applicationId: process.env.NEXMO_APPLICATION_ID,
  privateKey: process.env.NEXMO_APPLICATION_PRIVATE_KEY_PATH
});

const acl = {
  paths: {
    "/*/users/**": {},
    "/*/conversations/**": {},
    "/*/sessions/**": {},
    "/*/devices/**": {},
    "/*/image/**": {},
    "/*/media/**": {},
    "/*/applications/**": {},
    "/*/push/**": {},
    "/*/knocking/**": {}
  }
};

app.set("view engine", "pug");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/modules", express.static("node_modules/nexmo-client/dist/"));
app.use("/moment", express.static("node_modules/moment"));

// send email using sendinblue
function send_email(username, order_id, order_text, url) {
  var defaultClient = SibApiV3Sdk.ApiClient.instance;
  var apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = process.env.SENDINBLUE_API_KEY;
  var apiInstance = new SibApiV3Sdk.SMTPApi();

  var sendSmtpEmail = {
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

// create order /order/:username
app.post("/order", (req, res) => {
  let username = req.body.username;
  console.log("Order being created for user: ", username);

  let order = {
    text: `Dear ${username}, You purchased a widget for $4.99! Thanks for your order!`,
    id: 1234
  };

  let conv_name = "send-in-blue-" + username;
  console.log("Conv_name: ", conv_name);
  // we have conversation name so get the ID
  nexmo.conversations.get({}, (error, result) => {
    if (error) console.error(error);
    if (result) {
      console.log(result._embedded.conversations);
      let conversation = result._embedded.conversations.find(
        o => o.name === conv_name
      );
      console.log("DEBUG: conversation.uuid", conversation.uuid);
      // get member id from a conversation for username (there will be multiple members)
      nexmo.conversations.get(conversation.uuid, (error, result) => {
        if (error) {
          return console.error(error);
        }
        console.log(result);
        let member = result.members.find(
          o => o.name === username && o.state === "JOINED"
        );
        console.log("DEBUG: member id: ", member.member_id);
        // send custom event (need `member.id`)
        nexmo.conversations.events.create(conversation.uuid, {
          type: "custom:order-confirm-event",
          from: member.member_id,
          body: {
            text: order.text,
            id: order.id
          }
        }); // end custom event create
        let url = `http://localhost:9000/chat/${username}/${conversation.uuid}/${order.id}`;
        send_email(username, order.id, order.text, url);
      }); // end get conversation
    } // end if
  }); // end get all conversations
  res.status(200).end();
});

// create user and corresponding convo and add member while we're at it
app.post("/user", (req, res) => {
  username = req.body.username;
  console.log("DEBUG username: -->", username);
  // create user
  nexmo.users.create({ name: username }, (error, user) => {
    if (error) console.error(error);
    if (user) {
      console.log("User: ", user.id);
      // create support conversation for user
      nexmo.conversations.create(
        { name: "send-in-blue-" + username, display_name: "Client Chat" },
        (error, conversation) => {
          if (error) console.error(error);
          if (conversation) {
            console.log("Conversation created: ", conversation.id);
            nexmo.conversations.members.add(
              conversation.id,
              {
                action: "join",
                user_name: username,
                channel: {
                  type: "app"
                }
              },
              (error, member) => {
                if (error) console.error(error);
                if (member) {
                  console.log("member added...", member.id);
                  // add agent
                  console.log("add agent to conversation...");
                  nexmo.conversations.members.add(
                    conversation.id,
                    {
                      action: "join",
                      user_name: "agent",
                      channel: {
                        type: "app"
                      }
                    },
                    (error, member) => {
                      if (error) console.error(error);
                      if (member) {
                        console.log("member added...", member.id);
                      } // end if
                    } // end callback body
                  ); // end member.add
                }
              } // end callback body
            ); // end member.add
          } // end if conversation
        } // end callback body
      ); // end conversations.create
    } // end callback body
  }); // end user create
  res.status(200).end();
});

function genJWT(username) {
  const jwt = Nexmo.generateJwt(
    process.env.NEXMO_APPLICATION_PRIVATE_KEY_PATH,
    {
      application_id: process.env.NEXMO_APPLICATION_ID,
      sub: username,
      exp: new Date().getTime() + 86400,
      acl: acl
    }
  );
  return jwt;
}

// log user into conversation
app.get("/chat/:username/:conversation_id/:order_id", (req, res) => {
  let username = req.params.username;
  let conv_id = req.params.conversation_id;
  let order_id = req.params.order_id;
  let jwt = genJWT(username);

  res.render("chat", {
    username: username,
    conv_id: conv_id,
    order_id: order_id,
    jwt: jwt
  });
});

app.get("/", (req, res) => {
  res.render("index", { title: "Sendinblue demo", message: "Sendinblue demo" });
});

app.post("/webhooks/rtcevent", (req, res) => {
  console.log("RTC_EVENT:");
  console.log(req.body);
  res.status(200).end();
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
