"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 9000; // change port number as required
let convID = null;

const API_KEY = "...";
const API_SECRET = "...";
const APP_ID = "43ff2672-d734-406c-b26c-82c76bf7af82";
const PRIV_KEY_PATH = "private.key";

const Nexmo = require("nexmo");
var nexmo = new Nexmo({
  apiKey: API_KEY,
  apiSecret: API_SECRET,
  applicationId: APP_ID,
  privateKey: PRIV_KEY_PATH
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
let users = ["tonyb", "fred"];

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
  const jwt = Nexmo.generateJwt(PRIV_KEY_PATH, {
    application_id: APP_ID,
    sub: username,
    exp: new Date().getTime() + 86400,
    acl: acl
  });

  return jwt;
}

app.get("/createConversation/:name", (req, res) => {
  console.log("/createConversation/:name");
  let name = req.params.name;
  // create a conversation and display conversation ID
   nexmo.conversations.create(
    {
      name: name,
      display_name: "Testing Conversation"
    }, function(error, data) {
    if (error) {
      console.error(error);
      res.status(400).end();
    } else {
      convID = data.id; // store in server
      res.json(data.id);
    }
  });
});

app.get("/getConversationID", (req, res) => {
  console.log("/getConversation");
  res.json(convID);
});

app.get("/login/:user", (req, res) => {
  console.log("/login");
  console.log(req.params.user);
  let jwt = authenticate(req.params.user);
  if (!jwt) {
    console.log("Error: user not found.");
    res.status(404).end();
    return; // does this make sense?
  }
  console.log("User found");
  res.json(jwt);
});

app.post("/webhooks/rtcevent", (req, res) => {
  console.log("RTC_EVENT:");
  console.log(req.body);
  res.status(200).end();
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
