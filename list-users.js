"use strict";

require("dotenv").config({
  path: __dirname + "/.env"
});

const Nexmo = require("nexmo");
var nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET,
  applicationId: process.env.NEXMO_APPLICATION_ID,
  privateKey: process.env.NEXMO_APPLICATION_PRIVATE_KEY_PATH
});

nexmo.users.get({}, (error, result) => {
        if(error) {
            console.error(error);
        }
        else {
            console.log(result);
        }
    });