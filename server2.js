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

function getValidUsersWrapper() {
  return new Promise(resolve => {
    nexmo.users.get({}, (error, users) => {
      if (error) {
        console.error(error);
      } else {
        return users;
      }
    });
  });
}

async function getValidUsers(){
  return await getValidUsersWrapper();
}

let users = getValidUsers();
console.log("AWAIT: --> ", users);

function getUserId(users, username) {
  return users.find(o => o.name === username);
}

// create user
app.get("/user/:username", (req, res) => {
  nexmo.users.create({ name: req.params.username }, (error, user) => {
    if (error) console.error(error);
    if (user) {
      console.log("User created: ", user.id);
    }
  });
  res.status(200).end();
});

// log user into conversation
app.get("/login/:username", (req, res) => {
  let username = req.params.username;
  console.log("User: ", username);
  let jwt = genJWT(username);
  if (jwt) {
    nexmo.conversations.create(
      { name: "send-in-blue-" + username, display_name: "Client Chat" },
      (error, conversation) => {
        if (error) console.error(error);
        if (conversation) {
          nexmo.conversations.members.add(
            conversation.id,
            {
              action: "join",
              user_id: getUserId(username),
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
  } // end if jwt
  res.status(200).end();
}); //end app.get

app.post("/webhooks/rtcevent", (req, res) => {
  console.log("RTC_EVENT:");
  console.log(req.body);
  res.status(200).end();
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
