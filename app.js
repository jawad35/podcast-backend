const express = require('express');
const app = express();
require('dotenv').config();
app.use(express.json());
// app.use('/uploads', express.static('uploads'));
const userRoute = require('./routes/user')
const mediaRoute = require('./routes/media')
const Port = process.env.PORT || 8000
require('./db/database')
app.use('/api/user',userRoute)
app.use('/api/media',mediaRoute)


app.listen(Port, () => {
  console.log(`Server is running on port ${Port}`);
});