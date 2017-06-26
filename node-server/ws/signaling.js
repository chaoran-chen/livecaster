const express = require('express');

const router = express.Router();


router.ws('/', (ws) => {
  ws.on('message', (msg) => {
    console.log(msg);
    ws.send(msg);
  });
});


module.exports = router;
