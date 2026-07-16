const searchForm = document.getElementById("search-form");
const wordInput = document.getElementById("word-input");
const searchBtn = document.getElementById("search-btn");
const loadingMessage = document.getElementById("loading-message");
const errorMessage = document.getElementById("error-message");
const resultsContainer = document.getElementById("results-container");
const favoritesList = document.getElementById("favorites-list");
const noFavoritesMessage = document.getElementById("no-favorites-message");

const FAVORITES_KEY = "wordly-favorites";
const API_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

document.addEventListener("DOMContentLoaded", () => {
  displayFavorites();
});
searchForm.addEventListener("submit", handleSearch);
function handleSearch(event) {
  event.preventDefault();
  const word = wordInput.value.trim().toLowerCase();
  clearError();
  clearResults();
  if (word === "") {
    displayError("Please enter a word.");
    return;
  }
  fetchWord(word);
}
async function fetchWord(word) {
  setLoading(true);
  searchBtn.disabled = true;
  try {
    const url = `${API_BASE_URL}${encodeURIComponent(word)}`;
    const response = await fetch(url);

    if (!response.ok) {
      setLoading(false);
      searchBtn.disabled = false;
      displayError("We could not find that word. Check the spelling and try again.");
      return;
    }
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0 || !data[0] || !data[0].word) {
      displayError("We could not find that word. Check the spelling and try again.");
      displayWord(data[0]);
      return;
     }
     displayWord(data[0]);
      } catch (error) {
        displayError("something went wrong. Please try again.");
      } finally {
        setLoading(false);
        searchBtn.disabled = false
      }
      return;
    }
    function displayWord(entry){
      resultsContainer.innerHTML = '';
      window.scrollTo({ top: 0, behavior: 'smooth'})
      const phoneticText =
      entry.phonetic ||
      (Array.isArray(entry.phonetic) && entry.phonetic.find((p) => p.text)?.text) || "";
    }
function displayWord(entry){ 
  const phoneticText =
    entry.phonetic ||
    (Array.isArray(entry.phonetics) && entry.phonetics.find((p) => p.text)?.text) ||
    "";
  const audioUrl = getAudioUrl(entry);
  const card = document.createElement("div");
  card.className = "word-card";
  const heading = document.createElement("h3");
  heading.textContent = entry.word;
  card.appendChild(heading);

  if (phoneticText) {
    const phoneticEl = document.createElement("p");
    phoneticEl.className = "phonetic-text";
    phoneticEl.textContent = phoneticText;
    card.appendChild(phoneticEl);
  }
  if (audioUrl) {
    const audioBtn = document.createElement("button");
    audioBtn.type = "button";
    audioBtn.className = "audio-btn";
    audioBtn.textContent = "▶ Play pronunciation";
    audioBtn.setAttribute("aria-label", `Play pronunciation of ${entry.word}`);
    audioBtn.addEventListener("click", () => playAudio(audioUrl));
    card.appendChild(audioBtn);
  }
  const meanings = Array.isArray(entry.meanings) ? entry.meanings : [];
  meanings.forEach((meaning) => {
    const meaningBlock = document.createElement("div");
    meaningBlock.className = "meaning-block";
    const posHeading = document.createElement("h4");
    posHeading.textContent = meaning.partOfSpeech || "";
    meaningBlock.appendChild(posHeading);
    const definitions = Array.isArray(meaning.definitions) ? meaning.definitions : [];
    definitions.forEach((def) => {
      if (!def || !def.definition) return;
      const defItem = document.createElement("div");
      defItem.className = "definition-item";

      const defText = document.createElement("p");
      defText.textContent = def.definition;
      defItem.appendChild(defText);

      if (def.example) {
        const exampleText = document.createElement("p");
        exampleText.className = "example-text";
        exampleText.textContent = `Example: ${def.example}`;
        defItem.appendChild(exampleText);
      }

      meaningBlock.appendChild(defItem);
    });
    const synonyms = getSynonyms(meaning);
    if (synonyms.length > 0) {
      const synText = document.createElement("p");
      synText.className = "synonyms-text";
      synText.textContent = `Synonyms: ${synonyms.join(", ")}`;
      meaningBlock.appendChild(synText);
    }
    card.appendChild(meaningBlock);
  });
  const sourceUrl = Array.isArray(entry.sourceUrls) ? entry.sourceUrls[0] : null;
  if (sourceUrl) {
    const sourceLink = document.createElement("a");
    sourceLink.className = "source-link";
    sourceLink.href = sourceUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    sourceLink.textContent = "Source";
    card.appendChild(sourceLink);
  }
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "save-btn";
  updateSaveButton(saveBtn, isFavorite(entry.word));
  saveBtn.addEventListener("click", () => {
    if (isFavorite(entry.word)) {
      removeFavorite(entry.word);
      updateSaveButton(saveBtn, false);
    } else {
      saveFavorite(entry.word, phoneticText);
      updateSaveButton(saveBtn, true);
    }
  });

  card.appendChild(saveBtn);
  resultsContainer.appendChild(card);
}
function updateSaveButton(button, saved) {
  if (saved) {
    button.textContent = "★ Saved";
    button.classList.add("saved");
  } else {
    button.textContent = "☆ Save word";
    button.classList.remove("saved");
  }
}

function getAudioUrl(entry) {
  const phonetics = Array.isArray(entry.phonetics) ? entry.phonetics : [];
  const found = phonetics.find((p) => p && p.audio && p.audio.trim() !== "");
  return found ? found.audio : null;
}

function playAudio(url) {
  const audio = new Audio(url);
  audio.play().catch(() => {
    displayError("The audio could not be played right now.");
  });
}

function getSynonyms(meaning) {
  const meaningLevel = Array.isArray(meaning.synonyms) ? meaning.synonyms : [];
  const definitions = Array.isArray(meaning.definitions) ? meaning.definitions : [];
  const definitionLevel = definitions.flatMap((d) => (Array.isArray(d.synonyms) ? d.synonyms : []));

  const combined = [...meaningLevel, ...definitionLevel];
  return [...new Set(combined)];
}

function setLoading(isLoading) {
  loadingMessage.classList.toggle("hidden", !isLoading);
}

function displayError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}
function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");
}
function clearResults() {
  resultsContainer.innerHTML = "";
}
function getFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}
function isFavorite(word) {
  return getFavorites().some((fav) => fav.word.toLowerCase() === word.toLowerCase());
}
function saveFavorite(word, phoneticText) {
  if (isFavorite(word)) return; 

  const favorites = getFavorites();
  favorites.push({ word, phoneticText: phoneticText || "" });
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

  displayFavorites();
}

function removeFavorite(word) {
  const favorites = getFavorites().filter(
    (fav) => fav.word.toLowerCase() !== word.toLowerCase()
  );
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

  displayFavorites();

  const saveBtn = resultsContainer.querySelector(".save-btn");
  const heading = resultsContainer.querySelector(".word-card h3");
  if (saveBtn && heading && heading.textContent.toLowerCase() === word.toLowerCase()) {
    updateSaveButton(saveBtn, false);
  }
}
function displayFavorites() {
  const favorites = getFavorites();
  favoritesList.innerHTML = "";
  noFavoritesMessage.classList.toggle("hidden", favorites.length > 0);

  favorites.forEach((fav) => {
    const item = document.createElement("li");
    item.className = "favorite-item";
    const wordBtn = document.createElement("button");
    wordBtn.type = "button";
    wordBtn.className = "favorite-word-btn";
    wordBtn.textContent = fav.phoneticText ? `${fav.word} ${fav.phoneticText}` : fav.word;
    wordBtn.addEventListener("click", () => {
      wordInput.value = fav.word;
      clearError();
      fetchWord(fav.word);
    });
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.setAttribute("aria-label", `Remove ${fav.word} from favorites`);
    removeBtn.addEventListener("click", () => removeFavorite(fav.word));
    item.appendChild(wordBtn);
    item.appendChild(removeBtn);
    favoritesList.appendChild(item);
  });
}
document.addEventListener('DOMContentLoaded', displayFavorites);
function displayError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

function clearError() {
  errorMessage.textContent = ""
  errorMessage.style.display = "none";

}
function clearResults() {
  resultsContainer.innerHTML = "";

}
function setLoading(isLoading) {
  loadingMessage.style.display = isLoading ? "block" : "none";
  searchBtn.disabled = isLoading;
}
