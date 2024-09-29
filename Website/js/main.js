// Toggle navigation menu on burger click
const burger = document.querySelector('.burger');
const navLinks = document.querySelector('.nav-links');

burger.addEventListener('click', () => {
    navLinks.classList.toggle('active');

    // Animate burger lines
    burger.classList.toggle('toggle');
});
