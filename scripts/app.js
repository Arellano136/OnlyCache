document.getElementById("searchButton").addEventListener("click", fetchCocktail);

function fetchCocktail() {
  const inputElement = document.getElementById("cocktailName");
  const cocktailName = inputElement.value.trim();
  const resultDiv = document.getElementById("result");

  if (!cocktailName) {
    alert("🍸 Por favor escribe el nombre de un cóctel");
    return;
  }

  resultDiv.innerHTML = "<p class='loading'>Cargando...</p>";

  const url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${cocktailName}`;

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Error en la respuesta del servidor");
      return response.json();
    })
    .then(data => {
      const cocktail = data.drinks ? data.drinks[0] : null;
      if (!cocktail) {
        resultDiv.innerHTML = `<p>No se encontró el cóctel: <strong>${cocktailName}</strong></p>`;
        return;
      }

      // Renderiza la card
      resultDiv.innerHTML = `
        <div class="cocktail-card">
          <img src="${cocktail.strDrinkThumb}" alt="${cocktail.strDrink}" />
          <div class="cocktail-info">
            <h2>${cocktail.strDrink}</h2>
            <p><strong>Categoría:</strong> ${cocktail.strCategory}</p>
            <p><strong>Tipo:</strong> ${cocktail.strAlcoholic}</p>
            <p><strong>Instrucciones:</strong> ${cocktail.strInstructions}</p>
            <h4>Ingredientes:</h4>
            <ul>
              ${[1,2,3,4,5].map(i => cocktail[`strIngredient${i}`] ? `<li>${cocktail[`strIngredient${i}`]}</li>` : '').join('')}
            </ul>
          </div>
        </div>
      `;
    })
    .catch(error => {
      resultDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    });
}
