const express = require('express');
const GlobalDataService = require('../GlobalDataService');

const router = express.Router();
const dataService = GlobalDataService.getInstance();


router.get('/', (req, res) => {
  res.json({ message: 'Welcome to Livecaster!' });
});


router.get('/rooms', (req, res) => {
  res.json(dataService.getRooms().map(({ id, name, participants }) => ({
    id,
    name,
    numberParticipants: participants.length,
  })));
});


router.post('/rooms', (req, res) => {
  const created = dataService.addRoom();
  res.json(created);
});


module.exports = router;
