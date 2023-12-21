const mongoose = require('mongoose');

mongoose
  .connect('mongodb://localhost:27017/podcast', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('our db is connected');
  })
  .catch(err => console.log(err.message));
