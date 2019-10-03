"use strict";

let conversation = null; // global conversation object

function convEvents(conv) {
  conversation = conv; // store in global variable
  
  console.log("DEBUG: --> ", conversation.me);

  document.getElementById("sessionName").innerHTML =
    conversation.me.user.name + "'s messages";

  // Bind to events on the conversation
  conversation.on("text", (sender, message) => {
    const rawDate = new Date(Date.parse(message.timestamp));
    const formattedDate = moment(rawDate).calendar();
    let text = "";
    if (message.from !== conversation.me.id) {
      text = `<span style="color:red">${sender.user.name} <span style="color:red">(${formattedDate}): <b>${message.body.text}</b></span><br>`;
    } else {
      text = `me (${formattedDate}): <b>${message.body.text}</b><br>`;
    }
    messageFeed.innerHTML = messageFeed.innerHTML + text;
  });
}

function setupButtonEvent() {
  console.log("Button event...");
  sendButton.addEventListener("click", () => {
    conversation
      .sendText(messageTextarea.value)
      .then(() => {
        eventLogger("text")();
        messageTextarea.value = "";
      })
      .catch(error => {
        console.log(error);
      });
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

const messageTextarea = document.getElementById("messageTextarea");
const messageFeed = document.getElementById("messageFeed");
const sendButton = document.getElementById("send");
const status = document.getElementById("status");

setupButtonEvent();
logIntoConversation(conv_id, jwt);

// TODO
// - need to improve the UI and add button and text box to send messages
// - get all events and filter to find order with order_id
// - get the order text from the event and display in UI
// - agent needs to be added to the conversation
