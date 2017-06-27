const express = require('express');
const GlobalDataService = require('../GlobalDataService');

const router = express.Router();
const dataService = GlobalDataService.getInstance();


router.get('/', (req, res) => {
  res.json({ message: 'Welcome to Livecaster!' });
});


router.get('/rooms', (req, res) => {
  res.json(dataService.getRooms().map(({ id, name }) => ({ id, name })));
});


router.post('/rooms', (req, res) => {
  console.log(req.body);
  const created = dataService.addRoom({
    name: req.body.name,
  });
  res.json(created);
});


module.exports = router;
