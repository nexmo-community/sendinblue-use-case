# sendinblue-use-case

> **STATUS** - Working.

## Overview

This code allows you to demonstrate a two way chat use case using the
Client SDK and Sendinblue. The base scenario is as follows:

A user creats an order. An order confirmation email is sent to the
user via [Sendinblue](https://www.sendinblue.com). The order email
contains a link the user can click if he wishes to chat with an agent
about the order.

A chat screen is loaded that contains order data (and optionally order
and message history). Two way chat can then take place between the
customer and a support agent.

> **NOTE:** It is assumed you have both a Nexmo account and a Sendinblue account, and associated API keys and secrets.

## Installation

The following assumes you have the `git` and `npm` commands available
on the command line.

1. Clone the repo:

``` bash
git clone https://github.com/nexmo-community/sendinblue-use-case.git
```

2. Change into the cloned project directory.

3. Install required npm modules:

``` bash
npm install
```

4. Copy `example.env` to `.env`.

5. Create a Nexmo application.

``` bash
nexmo app:create
```

This enters interactive mode. You can give your app a name and also
select RTC capabilities. A private key will be written out to
`private.key`. A file `.nexmo-app` will also be created in the project
directory containing the Application ID and the private key. Make a
note of the Application ID as you will need this later.

## Configuration

Open the `.env` file in your project directory with an editor. Set the
following information:

``` bash
NEXMO_APPLICATION_ID=
NEXMO_API_KEY=
NEXMO_API_SECRET=
NEXMO_APPLICATION_PRIVATE_KEY_PATH=private.key
CONVERSATION_ID=
PORT=3000
SENDINBLUE_API_KEY=
SENDINBLUE_FROM_NAME=
SENDINBLUE_FROM_EMAIL=
SENDINBLUE_TO_NAME=
SENDINBLUE_TO_EMAIL=
SENDINBLUE_TEMPLATE_ID=
```

Add in your application ID from the installation section. You can
obtain your API key and secret from the [Nexmo
Dashboard](https://dashboard.nexmo.com). 

The private key file will typically be `private.key`.

The Conversation ID is only used if you want to use the utilities in
the `utils` directory.

### Sendinblue configuration

Most importantly you must have a Sendinblue API key.

For testing this use case it is assumed you have Sendinblue "sender" information. This is the email address and name you are sending emails from. You will also want to specify a user name and email address that will receive the order confirmation emails. Usually this information would be available on a per-customer basis in the user database, but for testing convenience it is set in the environment file in this use case.

The last piece of configuration information you need is the ID of the template you are using. The template is created in the Sendinblue UI. When you ahve created a template and activated it you can make a note of its ID in the UI. This is the number that is used here.

## Usage

There are several stages required to get things set up.

1. In the project directory start the server:

``` bash
npm start
```

This starts up the server using `node.js`.

2. Create the support agent user. Point your browser at (this assumes you are using port 3000):

```
localhost:3000/user/agent
```

This creates the user 'agent'.

> **IMPORTANT:** It is necessary to create the support agent before
> any other user in this simple demo.

3. Create a customer user:

```
localhost:3000/user/user-123
```

This creates the user 'user-123'. You will notice from the server
console logging that a conversation is created for the user. 

4. Create a customer order:

```
localhost:3000/order/user-123
```

This creates an order for user 'user-123'. For simplicity this is a
simple pre-defined text.

This step will also generate a custom event of type
`custom:order-confirm-event` contain the order details.

In addition a confirmation email is sent via Sendinblue. This email
contains a link the user would select to chat if they wanted support
with order.

5. Check you have received the order email! Go to the inbox defined in your configuration to read the confirmation email. Click the link in the email.

6. **Customer login**. You are now at the customer chat screen.

7. **Agent login**. It is recommended you start an 'incognito' tab in your
   browser for this step (or use a new browser instance).

For simplicity the support agent logs into the chat using a method similar to the customer:

```
localhost:3000/chat/agent/CON-ID/ORDER-ID
```

The user and support agent can now engage in a two-way chat messaging session.

