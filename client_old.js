const request = require("request");
require("nexmo-client");

/////////////   FUNCTIONS

function convEvents(conversation) {
  console.log(conversation.me);

  // Bind to events on the conversation
  conversation.on("text", (sender, message) => {
    console.log("conversation.on.text");
  });
}

function logIntoConversation(id, userToken) {
  console.log("joinConversation()");
  new NexmoClient({
    debug: true
  })
    .login(userToken)
    .then(app => {
      return app.getConversation(id);
    })
    .then(convEvents.bind(this))
    .catch(console.error);
}

function authenticateUser(username) {
  let userToken = null;

  console.log("Calling server to authenticate user...");
  url = "http://localhost:9000/login/" + username;

  request(url, { json: true }, (err, res, body) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    userToken = res.body;
    //console.log(userToken);
    if (!userToken) {
      console.log("Exiting, as you are not a valid user...");
      process.exit(1);
    }
    //console.log("DEBUG: ---> ", userToken);
    joinConversation(userToken);
  });
}

function joinConversation(userToken) {
  url = "http://localhost:9000/getConversationID";
  request(url, { json: true }, (err, res, body) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    if (res.body) {
      console.log("Server has a conversation...");
      logIntoConversation(res.body, userToken);
    } else {
      console.log("Client requesting conversation creation...");
      let name = "test-room-102";
      url = "http://localhost:9000/createConversation/" + name;

      request(url, { json: true }, (err, res, body) => {
        if (err) {
          console.log(err);
          process.exit(1);
        }
        console.log(res.body);
        if (res.body) {
          logIntoConversation(res.body, userToken);
        } else {
          console.log("Error conversation was: ", res.body);
        }
      });
    }
  });
}

/////////////   MAIN

authenticateUser("tonyb");
