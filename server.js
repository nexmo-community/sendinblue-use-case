"use strict";

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

  // send confirmation email (using sendinblue)
  console.log("send confirmation email");

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
      nexmo.conversations.members.add(
        conversation.uuid,
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
            // send custom event (need `member.id`)
            nexmo.conversations.events.create(conversation.uuid, {
              type: "custom:order-confirm-event",
              from: member.id,
              body: {
                text: order.text,
                id: order.id
              }
            });
          }
        }
      ); // end member.add
    }
  });
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
          } // end if conversation
        } // end callback body
      ); // end conversations.create
    } // end callback body
  }); // end user create
  res.status(200).end();
});

// log user into conversation
app.get("/login/:username", (req, res) => {
  let username = req.params.username;
  console.log("User: ", username);
  res.status(200).end();
}); //end app.get

app.post("/webhooks/rtcevent", (req, res) => {
  console.log("RTC_EVENT:");
  console.log(req.body);
  res.status(200).end();
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
