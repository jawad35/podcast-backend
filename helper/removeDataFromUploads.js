const fs = require('fs');
exports.removeDataFromUploads = (filename) => {
const filePath = `./uploads/${filename}`;

try {
  fs.unlinkSync(filePath);
  console.log(`File ${filename} was successfully deleted`);
  return true
} catch (err) {
  console.error(`Error deleting file ${filename}:`, err);

  // Check the error code to determine the reason for the failure
  if (err.code === 'ENOENT') {
    console.log(`File ${filename} does not exist.`);
  } else {
    console.log(`Unable to delete file ${filename}.`);
  }
  return false
}

}