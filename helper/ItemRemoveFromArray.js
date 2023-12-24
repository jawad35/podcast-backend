exports.removeItemByName = (array, itemName) => {
    const index = array.indexOf(itemName);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }