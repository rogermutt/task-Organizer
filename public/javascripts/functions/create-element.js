'use strict';

export default function(el_type) {
  var temp = document.createElement(el_type);
  return (type, attr) => {
    if (type || attr) temp.setAttribute(type, attr);
    return (txt) => {
      if (txt) temp.innerText = txt;
      return (event, func) => {
        temp.addEventListener(event, func);
        return temp;
      };
    };
  };
};




