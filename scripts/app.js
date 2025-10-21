document
  .getElementById("searchButton")
  .addEventListener("click", fetchCocktail);
function fetchCocktail() {
  const inputElement = document.getElementById("cocktailName");
  const cocktailName = inputElement.value.trim();
  const resultDiv = document.getElementById("result");
  if (!cocktailName) {
    alert("¡No olvides escribir el nombre de un cóctel!");
    return;
  }
  // La URL de la API utiliza el nombre del cóctel ingresado por el usuario
  const url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${cocktailName} `;
  resultDiv.innerHTML = "<h2>Cargando...</h2>";
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        // Esta línea maneja errores HTTP 4xx/5xx, no el fallo de red (que lo maneja el SW).
        throw new Error("Respuesta del servidor no válida");
      }
      return response.json();
    })
    .then((data) => {
      console.log("respuesta",data)
      const cocktail = data.drinks ? data.drinks[0] : null;
      if (!cocktail) {
        resultDiv.innerHTML = `<p>No se encontró el cóctel: <strong>${cocktailName}</strong ></p > `;
        return;
      }
      // Renderiza el resultado, incluyendo el fallback JSON si es el que se recibió;
      resultDiv.innerHTML = `
                < h2 > ${cocktail.strDrink}</h2 >
                    <img src="${cocktail.strDrinkThumb}" alt="${cocktail.strDrink}" wid
                        th="200" height="300">
                        <p><strong>Categoría:</strong> ${cocktail.strCategory}</p>
                        <p><strong>Instrucciones:</strong> ${cocktail.strInstructions}</p>
                        <p><strong>Ingrediente 1:</strong> ${cocktail.strIngredient1}</p>
                        `;
    })
    .catch((error) => {
      // Este catch solo debe atrapar errores del lado del cliente (ej. fallo enel JSON parseo)
      resultDiv.innerHTML = `<p style="color: red;">Error al procesar la respuesta: ${error.message}</p>`;
    });
}
