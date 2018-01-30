(function() {
  console.clear();

  var main = document.getElementById("main");

  var storeProj = (titles, tasks) => {
    var project = new Object();
    titles.map((el, i) => {
      var tsk = tasks[i]
        .filter((el) => el != undefined).filter((el) => el.length > 0);
      project[el] = tsk;
    });
    return project;
  };

  var updateDB = () => {
    var contents = [...document.getElementsByClassName("projectBoard")]
      .filter((el) => el.children.length > 1);

    var titles = contents.map((el) => [...el.children]).map((el) => el[0].firstChild.innerText);

    var rawTasks = contents.map(el => [...el.children]);
    rawTasks.map(el => el.shift());
    rawTasks.map(el => el.pop());

    var cleanTasks = rawTasks.map((el) => {
      return el.map(el => el.firstChild.innerText);
    });

    var latestContents = storeProj(titles, cleanTasks);
    return latestContents;

  };

  // INDEXED DB BELOW

  var db;
  var openRequest = indexedDB.open("myProjects", 1);
  var newDB = false;

  openRequest.onupgradeneeded = (e) => {
    var db = e.target.result;
    if (!db.objectStoreNames.contains('projects')) {
      db.createObjectStore('projects', {
        autoIncrement: true
      });
      console.log("newDB");
      newDB = true;
      createProjBoard(main, false);
    };
  };

  openRequest.onsuccess = (e) => {
    db = e.target.result;
    if (!newDB)
      DB_retrieveProjects();
  };

  openRequest.onerror = (e) => {
    console.log('onerror');
    console.dir(e);
  };

  var DB_saveProjects = () => {
    var transaction = db.transaction(['projects'], 'readwrite');
    var store = transaction.objectStore('projects');
    var projUpdated = updateDB();
    console.log(projUpdated);
    var request = store.put(projUpdated, 1);
    request.onsuccess = (e) => {
      console.log("new DB saved ");
    };
    request.onerror = (e) => {
      console.log("Error", e.target.error.name)
    };
  };

  var DB_retrieveProjects = () => {
    var transaction = db.transaction(["projects"], "readwrite");
    var store = transaction.objectStore("projects");
    var request = store.get(1);
    request.onerror = (e) => {
      console.log('Error', e.target.error.name)
    };
    request.onsuccess = (e) => {
      console.log("DB retrieved");
      createProjBoard(main, request.result);
    };
  };

  // DRAG DROP BELOW

  var dragStart = (ev) => {
    var startEl = ev.target,
      numOfChildren = filterDivs([...startEl.children]).length,
      divList = [...startEl.parentNode.children],
      divIdx = numOfChildren > 0 ? "null" : divList.indexOf(startEl),
      tabIdx = numOfChildren > 0 ? [...main.children].indexOf(startEl) : [...main.children].indexOf(startEl.parentNode);

    ev.dataTransfer.setData("text/plain", `${divIdx}:${tabIdx}`);
    ev.dataTransfer.effectAllowed = "move";
  };

  var filterDivs = (arr) => {
    return arr.filter(el => el.tagName == "DIV");
  };

  var drop = (ev) => {
    var dropElmnt = ev.target.tagName != "DIV" ?
      ev.target.parentNode :
      ev.target;

    if (dropElmnt.classList.contains("addProject")) return;

    var projParent = [...dropElmnt.parentNode.parentNode.children];
    var incoming = ev.dataTransfer.getData("text/plain").split(":"),
      incIdx = incoming[0],
      incTab = incoming[1];

    var replaceWith = incIdx === "null" ? [...projParent][incTab] : [...projParent[incTab].children][incIdx];

    var replace = incIdx === "null" ? dropElmnt.parentNode : dropElmnt;
    var currParent = incIdx === "null" ?
      projParent : [...dropElmnt.parentNode.children];

    currParent.indexOf(replaceWith) < currParent.indexOf(replace) ?
      replace.parentNode.insertBefore(replaceWith, replace.nextSibling) :
      replace.parentNode.insertBefore(replaceWith, replace);

    ev.preventDefault();
    ev.stopPropagation();
  };

  var dragEnterAndOver = (ev) => {
    ev.dataTransfer.dropEffect = "move";
    ev.preventDefault();
    ev.stopPropagation();
  };

  // PROJECT / TASK CREATION 

  // funct below to be re-done
  var removeElement = (el) => {
    var parentTask = el.target.parentNode,
      parentProject = parentTask.parentNode;

    if (el.target.classList == "projRemover") {
      parentProject.remove();
      createProjBoard(main, false); console.log("one");
    }

    if (parentTask.draggable == false) { console.log("two");
      parentProject.remove();
    } else { console.log("three");
      parentTask.remove();
      parentProject.getElementsByClassName("hide_A_Moment")[0]
        .classList.remove("hide_A_Moment");
    }
  };

  var createElement = (el) => {
    var temp = document.createElement(el);
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

  var populateExisCont = (targ, content) => {

    var titles = Object.keys(content);
    var tasks = Object.values(content);

    [...targ.children].forEach((eachProj, idx) => {

      var projTitleDiv = createElement("div")("class", "projTitle")()();
      var projTitleText = createElement("span")()
        (titles[idx])();
      var removeIt = createElement("span")("class", "showEl2")
        ("   x")("click", removeElement);

      [projTitleText, removeIt].forEach(x => projTitleDiv.append(x));

      eachProj.append(projTitleDiv);
      addTaskPlaceHold(eachProj);

      tasks[idx].map((task) => {

        var projTask = newTaskShell(task);

        eachProj.insertBefore(projTask, eachProj.lastChild);
      });
    });

    createProjBoard(main, false);
  };

  var createProjBoard = (target, exist_Content) => {
    if (exist_Content != false) {
      var titles = Object.keys(exist_Content), i = 0;
      while (i < titles.length) {

        var projBoard = createElement("div")("class", "projectBoard")()();
        projBoard.setAttribute("draggable", "true");
        projBoard.ondragstart = dragStart;
        projBoard.ondragenter = dragEnterAndOver;
        projBoard.ondragover = dragEnterAndOver;
        projBoard.ondrop = drop;

        target.append(projBoard);
        i++;
      }
      populateExisCont(target, exist_Content)
      return;
    }

    var createProjBox =(ev)=> { 
      project_Box(ev.target.parentNode);
      ev.target.remove();
    };

    var newProj = createElement("div")("class", "projectBoard")()();
    newProj.setAttribute("draggable", "true");

    newProj.ondragstart = dragStart;
    newProj.ondragenter = dragEnterAndOver;
    newProj.ondragover = dragEnterAndOver;
    newProj.ondrop = drop;

    var pb_Text = createElement("span")("class", "addProject")
      ("Add Project...")('click', createProjBox);

    newProj.append(pb_Text);
    target.append(newProj);
  };

  var noNameChange = (existCont) => {
    return function(el) {
      var parent = el.target.parentNode;
      parent.innerHTML = "";

      var taskName = createElement("span")()(existCont)();
      var removeIt = createElement("span")("class", "showEl")("   x")("click", removeElement);

      [taskName, removeIt].forEach(el => parent.append(el));
    };
  };

  var changeTaskName = (el) => {

    if (el.target.tagName == "SPAN") {
      var existCont = el.target.innerHTML;
      var parent = el.target.parentNode;
      [...parent.children].forEach(el => el.remove());

      var removeIt = createElement("span")
        ("class", "showEl")("  x")("click", noNameChange(existCont));

      var taskName = createElement("input")("style", "width:55px")()
        ("keydown", (el) => {

          var userInput = el.target.value;
          var parentTask = el.target.parentNode;

          if (el.keyCode == 13 && userInput != "") {
            el.target.remove();

            var newInput = createElement("span")()(userInput)();

            [newInput, removeIt].forEach(el => parentTask.append(el));
          }
        });
        
        taskName.setAttribute("value", existCont);

      [taskName, removeIt].forEach(el => parent.append(el));
      taskName.focus();
    } // if    
  };

  var pushTaskName = (el) => {
    var userInput = el.target.value;
    var parentTask = el.target.parentNode;

    if (el.keyCode == 13 && userInput != "") {
      el.target.remove();

      var taskName = createElement("span")()(userInput)();
     
      parentTask.insertBefore(taskName, parentTask.firstChild);

      parentTask.parentNode.getElementsByClassName("hide_A_Moment")[0].classList.remove("hide_A_Moment");

    }
  };

  var newTaskShell = (exist_Cont) => {

    var projTask = createElement("div")("class", "projTask")()
      ("click", changeTaskName);
    projTask.setAttribute("draggable", "true");
    projTask.ondragstart = dragStart;
    projTask.ondragenter = dragEnterAndOver;
    projTask.ondragover = dragEnterAndOver;
    projTask.ondrop = drop;

    var taskName = exist_Cont != false ?
      createElement("span")()(exist_Cont)() :
      createElement("input")("style", "width:55px")()("keydown", pushTaskName);

    var removeIt = createElement("span")("class", "showEl")("  x")
      ("click", removeElement);

    [taskName, removeIt].forEach(el => projTask.append(el));

    return projTask;
  };

  var taskCreater = (el) => {
    var targ = el.target,
      parent = targ.parentNode,
      currentProject = parent.parentNode;

    var projTask = newTaskShell(false);

    currentProject.insertBefore(projTask, parent);
    parent.classList.add("hide_A_Moment");
    projTask.children[0].focus();
  };

  var addTaskPlaceHold = (parent) => {
    var projTask = createElement("div")("class", "addTask")()();
    var placehold = createElement("span")()("Add a task")
      ("click", taskCreater);

    projTask.append(placehold);
    parent.append(projTask);
  }

  var projectTitle = (el) => {
    var targ = el.target;
    var userInput = targ.value;
    var parentProject = targ.parentNode.parentNode;
    if (targ.tagName === "INPUT" &&
      el.keyCode == 13 && userInput != "") {

      targ.parentNode.remove();

      var projTitleDiv = createElement("div")("class", "projTitle")()();
      var projTitleText = createElement("span")()
        (userInput)();
      var removeIt = createElement("span")("class", "showEl2")
        ("  x")("click", removeElement);

      [projTitleText, removeIt].forEach(el => projTitleDiv.append(el));
      parentProject.append(projTitleDiv);

      createProjBoard(main, false);
      addTaskPlaceHold(parentProject);
    };
  };

  var project_Box =(target)=> {
    var projectBox = createElement("div")("class", "projectBox")()();
    var projTitle = createElement("input")
      ("placeholder", "Add Project...")()('keydown', projectTitle);
    projTitle.setAttribute("style", "width:55px");
    var projDelete = createElement("span")("class", "projRemover")("  x")("click", removeElement);

    [projTitle, projDelete].forEach(el => projectBox.append(el));

    target.appendChild(projectBox);
    projTitle.focus();
  };

  	setInterval(DB_saveProjects, 20000);
})();
