"use strict";
require("nexmo-client");
require("dotenv").config({
  path: __dirname + "/.env"
});

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 9000; // change port number as required

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// create order
app.get("/order/:username", (req, res) => {
  // code that checks user account
  let username = req.params.username;
  console.log("Order being created for user: ", username);

  // set order details (probably would have order_id too)
  let order = {};
  order.text =
    "Dear " +
    username +
    ", You purchased a widget for $4.99! Thanks for your order!";
  order.id = 1234;

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
          console.error(error);
        } else {
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
          // send confirmation email (using sendinblue)
          // must contain at least username, conversation id and order id
          // and order text and order id
          console.log("send confirmation email with following details...");
          console.log("username: ", username);
          console.log("conversation id: ", conversation.uuid);
          console.log("order text: ", order.text);
          console.log("order id: ", order.id);
        } // end else
      }); // end get conversation
    } // end if
  }); // end get all conversations
  res.status(200).end();
});

// create user and corresponding convo and add member while we're at it
app.get("/user/:username", (req, res) => {
  let username = req.params.username;
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
                }
              }
            ); // end member.add
          } // end if conversation
        } // end callback body
      ); // end conversations.create
    } // end callback body
  }); // end user create
  res.status(200).end();
});


function convEvents(conversation) {
  console.log(conversation.me);

  // Bind to events on the conversation
  conversation.on("member:joined", (sender, message) => {
    console.log("conversation.on.member:joined");
  });

  // Bind to events on the conversation
  conversation.on("text", (sender, message) => {
    console.log("conversation.on.text");
  });
}

// log user into conversation
app.get("/chat/:username/:conversation_id/:order_id", (req, res) => {
  let username = req.params.username;
  let conv_id = req.params.conversation_id;
  let order_id = req.params.order_id;
  console.log("Conv: ", conv_id);

  // get JWT
  let userToken = genJWT(username);

  new NexmoClient({
    debug: true
  })
    .login(userToken)
    .then(app => {
      return app.getConversation(conv_id);
    })
    .then(convEvents.bind(this))
    .catch(console.error);

  // TODO

  res.status(200).end();
});

// log agent into conversation - username is client username for now (used to identify conv id)
app.get("/agent/:username", (req, res) => {
  let username = req.params.username;
  console.log("User: ", username);
  res.status(200).end();
});

app.post("/webhooks/rtcevent", (req, res) => {
  console.log("RTC_EVENT:");
  console.log(req.body);
  res.status(200).end();
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
