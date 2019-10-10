"use strict";

const messageTextarea = document.getElementById("messageTextarea");
const messageFeed = document.getElementById("messageFeed");
const sendButton = document.getElementById("send");
const status = document.getElementById("status");
const order_text = document.getElementById("order_text");

let username = document.getElementById("username").innerHTML;
let conv_id = document.getElementById("conv_id").innerHTML;
let jwt = document.getElementById("jwt").innerHTML;

/////////////////////////////////////////////////////////////////

function convEvents(conversation) {
  document.getElementById("sessionName").innerHTML =
    conversation.me.user.name + "'s messages";

  sendButton.addEventListener("click", () => {
    conversation
      .sendText(messageTextarea.value)
      .then(() => {
        messageTextarea.value = "";
      })
      .catch(error => {
        console.log(error);
      });
  });

  conversation
    .getEvents({ event_type: "custom:order-confirm-event" })
    .then(events_page => {
      events_page.items.forEach(event => {
        order_text.innerHTML = event.body.text;
      });
    });

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

/////////////////////////////////////////////////////////////////

async function main() {
  const client = new NexmoClient({ debug: true });
  const application = await client.login(jwt);
  const conversation = await application.getConversation(conv_id);
  convEvents(conversation);
}

main();
