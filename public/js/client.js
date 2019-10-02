"use strict";

function convEvents(conversation) {
  console.log(conversation.me);

  // Bind to events on the conversation
  conversation.on("text", (sender, message) => {
    console.log("conversation.on.text");
  });
}

function logIntoConversation(id, userToken) {
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

let username = document.getElementById("username");
let conv_id = document.getElementById("conv_id");
let order_id = document.getElementById("order_id");
console.log(username.innerHTML);
console.log(conv_id.innerHTML);
console.log(order_id.innerHTML);
console.log(jwt.innerHTML);

//let jwt = genJWT(username);
//logIntoConversation(conv_id, jwt);
