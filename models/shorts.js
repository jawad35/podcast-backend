const mongoose = require('mongoose');

const shortsSchema = new mongoose.Schema({
    shorts:[],
    createdAt: {
        type: Date,
        default: Date.now
      }
})

const Short = mongoose.model('Short', shortsSchema);
Short.createCollection();

async function insertRecordOnServerStart() {
  try {
      // Create a new document
      const newShort = new Short({
          shorts: ['example1', 'example2'], // Add your data here
          query: 'your_query_here', // Add your data here
      });

      // Save the document to the database
      await newShort.save();
      console.log('Record inserted successfully');
  } catch (error) {
      console.error('Error inserting record:', error.message);
  } finally {
      // Close the MongoDB connection
      mongoose.connection.close();
  }
}
insertRecordOnServerStart()
module.exports = Short;