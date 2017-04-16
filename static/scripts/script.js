function getQueryURL() {
  var queryURL = document.getElementById("tagSite").value;
  return queryURL;
}

function fetchURL() {
  var object = document.getElementById("tagFetchSite");
  object.setAttribute("data", "/proxy?url=" + getQueryURL());
}