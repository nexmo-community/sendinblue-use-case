"use strict";

let username = document.getElementById("username").innerHTML;
let conv_id = document.getElementById("conv_id").innerHTML;
let jwt = document.getElementById("jwt").innerHTML;

function addOrderConfirmEvent(event) {
  let text = order_history.innerHTML;
  text = text + event.body.text + "</br>";
  order_history.innerHTML = text;
}

function addMessage(sender, message, me) {
  const rawDate = new Date(Date.parse(message.timestamp));
  const formattedDate = moment(rawDate).calendar();
  let text = "";
  if (message.from !== me.id) {
    text = `<span style="color:red">${sender.user.name} <span style="color:red">(${formattedDate}): <b>${message.body.text}</b></span><br>`;
  } else {
    text = `me (${formattedDate}): <b>${message.body.text}</b><br>`;
  }
  messageFeed.innerHTML = messageFeed.innerHTML + text;
}

function convEvents(conversation) {
  sessionName.innerHTML = conversation.me.user.name + "'s Message History";

  conversation.getEvents({ page_size: 100 }).then(events => {
    events.items.forEach(event => {
      if (event.type == "order-confirm-event") {
        addOrderConfirmEvent(event);
      } else if (event.type == "text") {
        addMessage(
          conversation.members.get(event.from),
          event,
          conversation.me
        );
      }
    });
  });

  send.addEventListener("click", async () => {
    await conversation.sendText(messageTextarea.value);
    messageTextarea.value = "";
  });

  conversation.on("text", (sender, event) => {
    addMessage(sender, event, conversation.me);
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
