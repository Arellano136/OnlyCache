if ('serviceWorker' in navigator) {
window.addEventListener('load', () => {
navigator.serviceWorker.register('/only-cache/sw.js')
.then(reg => console.log('Registro SW exitoso: ', reg))
.catch(err => console.error('Error de registro SW: ', err));
});
}