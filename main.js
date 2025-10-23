if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js') // ✅ ruta relativa
      .then(reg => console.log('Registro SW exitoso: ', reg))
      .catch(err => console.error('Error de registro SW: ', err));
  });
}
