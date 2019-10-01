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

// user database
let users = ["client", "agent"];

// checks if user in database
function authenticate(username) {
  console.log("Authenticating user against database...");
  if (users.indexOf(username) > -1) {
    return genJWT(username);
  } else {
    return null;
  }
}

function genJWT(username) {
  const jwt = Nexmo.generateJwt(process.env.NEXMO_APPLICATION_PRIVATE_KEY_PATH, {
    application_id: process.env.NEXMO_APPLICATION_ID,
    sub: username,
    exp: new Date().getTime() + 86400,
    acl: acl
  });
  return jwt;
}



app.get("/login/:user", (req, res) => {
  let username = req.params.user;
  console.log("User: ", username);
  let jwt = authenticate(username);
  if (jwt) {
    nexmo.users.create({ name: username }, (error, user) => {
      if (error) console.error(error);
      if (user) {
        nexmo.conversations.create(
          { name: "send-in-blue-" + username, display_name: "Client Chat" },
          (error, conversation) => {
            if (error) console.error(error);
            if (conversation) {
              nexmo.conversations.members.add(
                conversation.id,
                {
                  action: "join",
                  user_id: user.id,
                  channel: {
                    type: "app"
                  }
                },
                (error, member) => {
                  if (error) console.error(error);
                  console.log("member added");
                }
              ); // end member.add
            } // end if conversation
          }
        ); // end conversations.create
      } // end if user
    }); // end nexmo.users.create
  } // end if jwt
  res.status(200).end();
}); //end app.get

app.post("/webhooks/rtcevent", (req, res) => {
  console.log("RTC_EVENT:");
  console.log(req.body);
  res.status(200).end();
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
