SENDINBLUE_API_KEY="..."
EMAIL=""
curl -X "POST" "https://api.sendinblue.com/v3/smtp/email" \
     -H 'Accept: application/json' \
     -H 'api-key: '$SENDINBLUE_API_KEY \
     -H 'Content-Type: application/json' \
     -d $'{
  "sender": {
    "name": "Convo API test",
    "email": "convo_api@nexmo.com"
  },
  "to": [
    {
      "email": '$EMAIL'
    }
  ],
  "templateId": 1,
  "params": {
    "order_id": "123456",
    "order_text": "You ordered qty 1 widget at $4.99.",
    "url": "this is the link",
    "name": "Tony"
  }
}'
