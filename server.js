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

//////////////////////////////////////////////////////

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

function createUser(username) {
  return new Promise(function(resolve, reject) {
    nexmo.users.create({ name: username }, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result);
    });
  });
}

function createConversation(name, display_name) {
  return new Promise(function(resolve, reject) {
    nexmo.conversations.create(
      { name: name, display_name: display_name },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      }
    );
  });
}

// add user to conversation(id)
function addMember(id, username) {
  return new Promise(function(resolve, reject) {
    nexmo.conversations.members.add(
      id,
      {
        action: "join",
        user_name: username,
        channel: {
          type: "app"
        }
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      }
    );
  });
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

//////////////////////////////////////////////////////

// create order /order/:username
app.post("/order", async (req, res) => {
  let username = req.body.username;
  let conv_name = "send-in-blue-" + username;
  let order = {
    text: `Dear ${username}, You purchased a widget for $4.99! Thanks for your order!`,
    id: 1234
  };

  let conversations = await getConversations().catch(error =>
    console.error(error)
  );
  let conversation = await getConversation(conv_name, conversations).catch(
    error => console.error(error)
  );
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

// create user and corresponding convo and add users while we're at it
// Agent must be created first
app.post("/user", async (req, res) => {
  let username = req.body.username;
  let user = await createUser(username).catch(error => console.error(error));
  let conversation = await createConversation(
    "send-in-blue-" + username,
    "The display name",
    "Client Chat"
  ).catch(error => console.error(error));
  await addMember(conversation.id, username).catch(error =>
    console.error(error)
  );
  await addMember(conversation.id, "agent").catch(error =>
    console.error(error)
  );
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

app.post("/webhooks/rtcevent", (req, res) => {
  console.log("RTC_EVENT:");
  console.log(req.body);
  res.status(200).end();
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
