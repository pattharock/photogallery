// alert("Connected");

// searchByName
// dynamically matches input string as a substring of the Image Name
let searchByName = document.querySelector("#nameSearch");
let namesList = document.querySelectorAll(".card .container b");
let namesDivList = document.querySelectorAll(".card");
searchByName.addEventListener("input", (event) => {
  let query = searchByName.value.toLowerCase();
  for (let i = 0; i < namesList.length; i++) {
    if (namesList[i].innerHTML.toLowerCase().includes(query)) {
      namesDivList[i].style.display = "block";
    } else {
      namesDivList[i].style.display = "none";
    }
  }
});
searchByName.addEventListener("blur", (event) => {
  if (searchByName.value === "") {
    for (let i = 0; i < namesDivList.length; i++) {
      namesDivList[i].style.display = "block";
    }
  }
});

