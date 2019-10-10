"use strict";

require("dotenv").config({
  path: __dirname + "/.env"
});

const Nexmo = require("nexmo");
const SibApiV3Sdk = require("sib-api-v3-sdk");
const express = require("express");
const bodyParser = require("body-parser");
const port = process.env.PORT;

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

const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET,
  applicationId: process.env.NEXMO_APPLICATION_ID,
  privateKey: process.env.NEXMO_APPLICATION_PRIVATE_KEY_PATH
});

const app = express();
app.set("view engine", "pug");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/modules", express.static("node_modules/nexmo-client/dist/"));
app.use("/moment", express.static("node_modules/moment"));

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

// get all conversations
function getConversations() {
  return new Promise(function(resolve, reject) {
    nexmo.conversations.get({}, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result._embedded.conversations);
    });
  });
}

// gets conversation object from conversation name
function getConversation(name, conversations) {
  return new Promise(function(resolve, reject) {
    let conversation = conversations.find(o => o.name === name);
    nexmo.conversations.get(conversation.uuid, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
}

// gets a member object from a username and conversation object
function getMember(username, conversation) {
  return conversation.members.find(
    o => o.name === username && o.state === "JOINED"
  );
}

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
app.post("/order", async (req, res) => {
  let username = req.body.username;
  let conv_name = "send-in-blue-" + username;
  let order = {
    text: `Dear ${username}, You purchased a widget for $4.99! Thanks for your order!`,
    id: 1234
  };
 
  let conversations = await getConversations();
  let conversation = await getConversation(conv_name, conversations);
  let member = getMember(username, conversation);

  nexmo.conversations.events.create(conversation.uuid, {
    type: "custom:order-confirm-event",
    from: member.member_id,
    body: {
      text: order.text,
      id: order.id
    }
  });

  let url = `http://localhost:9000/chat/${username}/${conversation.uuid}/${order.id}`;
  send_email(username, order.id, order.text, url);

  res.status(200).end();
});

// create user and corresponding convo and add member while we're at it
app.post("/user", (req, res) => {
  let username = req.body.username;
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

app.listen(port, () => console.log(`Server listening on port ${port}!`));
