"use strict";

function convEvents(conversation) {
  console.log(conversation.me);

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

let username = document.getElementById("username").innerHTML;
let conv_id = document.getElementById("conv_id").innerHTML;
let order_id = document.getElementById("order_id").innerHTML;
let jwt = document.getElementById("jwt").innerHTML;
console.log(username);
console.log(conv_id);
console.log(order_id);
console.log(jwt);

logIntoConversation(conv_id, jwt);

// TODO
// - need to improve the UI and add button and text box to send messages
// - get all events and filter to find order with order_id
// - get the order text from the event and display in UI

