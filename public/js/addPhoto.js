let input, hashtagArray, container, t;

input = document.querySelector("#desc");
container = document.querySelector(".tag-container");
hashtagArray = [];
let valArray = [];

input.addEventListener("keyup", () => {
  if (event.which == 13 && input.value.length > 0) {
    var text = document.createTextNode(input.value);
    var p = document.createElement("p");
    container.appendChild(p);
    p.appendChild(text);
    p.classList.add("tagonform");
    valArray.push(input.value);
    console.log(valArray);
    input.value = "";
    let deleteTags = document.querySelectorAll(".tagonform");

    for (let i = 0; i < deleteTags.length; i++) {
      deleteTags[i].addEventListener("click", () => {
        valArray.splice(i, 1);
        console.log(valArray);
        container.removeChild(deleteTags[i]);
      });
    }
  }
});

window.addEventListener("load", function () {
  function sendData() {
    const XHR = new XMLHttpRequest();
    const FD = new FormData(form);
    FD.append("tags", valArray);
    XHR.addEventListener("load", function (event) {
      alert("Photo has been uploaded :)");
    });
    XHR.addEventListener("error", function (event) {
      console.log(FD);
    });
    XHR.open("POST", "http://localhost:3000/addPhoto");
    XHR.send(FD);
  }

  const form = document.querySelector("form");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendData();
  });
});
