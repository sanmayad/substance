'use strict';

function deleteFromArray(array, value) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === value) {
      array.splice(i, 1);
      i--;
    }
  }
}

export default deleteFromArray;
