function loadHTML(file, elementId, callback) {
  fetch(file)
    .then(response => response.text())
    .then(data => {
      document.getElementById(elementId).innerHTML = data;
      if (callback) callback(); 
    })
  .catch(error => console.error('Error loading the file:', error));
}
      
function loadHeader() {
  loadHTML('header.html', 'header-placeholder', function() {
    const menuOpen = document.querySelector('#menu-open');
    const menuClose = document.querySelector('#menu-close');

    if (menuOpen && menuClose) {
      const toggleMenu = () => {
        document.body.classList.toggle("show-mobile-menu");
      };

      menuOpen.addEventListener('click', toggleMenu);
      menuClose.addEventListener('click', toggleMenu);
    }
  });
}

function loadFooter() {
  loadHTML('footer.html', 'footer-placeholder');
}
      
window.onload = function() {
  loadHeader();
  loadFooter();
};
      