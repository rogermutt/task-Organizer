'use strict';

export default function(titles, tasks) {
    var project = new Object();
    titles.map((el, i) => {
      var tsk = tasks[i]
        .filter(el => el != undefined).filter((el) => el.length > 0);
      project[el] = tsk;
    });
    return project;
};
