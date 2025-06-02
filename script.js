const dropdowns = document.querySelectorAll(".dropdown-container"),
  inputLanguageDropdown = document.querySelector("#input-language"),
  outputLanguageDropdown = document.querySelector("#output-language");

/**
 * Populates a dropdown menu with language options,
 * with an optional search term to filter results.
 * @param {HTMLElement} dropdown The dropdown container element.
 * @param {Array<Object>} options An array of language objects.
 * @param {string} searchTerm An optional search term to filter languages.
 */
function populateDropdown(dropdown, options, searchTerm = "") {
  const ul = dropdown.querySelector("ul");
  ul.innerHTML = `<input type="text" class="language-search" placeholder="Search language..." />`; // Re-add search input

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.native.toLowerCase().includes(searchTerm.toLowerCase())
  );

  filteredOptions.forEach((option) => {
    const li = document.createElement("li");
    const title = option.name + " (" + option.native + ")";
    li.innerHTML = title;
    li.dataset.value = option.code;
    li.classList.add("option");
    ul.appendChild(li);
  });

  // Attach click listeners to newly populated options
  dropdown.querySelectorAll(".option").forEach((item) => {
    item.addEventListener("click", (e) => {
      // Remove active class from all options in this dropdown
      dropdown.querySelectorAll(".option").forEach((opt) => {
        opt.classList.remove("active");
      });
      // Add active class to the clicked option
      item.classList.add("active");
      // Update the selected span with the chosen language
      const selected = dropdown.querySelector(".selected");
      selected.innerHTML = item.innerHTML;
      selected.dataset.value = item.dataset.value;
      dropdown.classList.remove("active"); // Close dropdown after selection
      translate(); // Trigger translation after language selection
    });
  });

  // Re-attach search input listener (if the input was re-added)
  const searchInput = ul.querySelector(".language-search");
  if (searchInput) {
    searchInput.value = searchTerm; // Keep search term in input
    searchInput.addEventListener("input", (e) => {
      const currentDropdown = e.target.closest(".dropdown-container");
      populateDropdown(currentDropdown, languages, e.target.value);
    });
  }
}


// Initial population of dropdowns
populateDropdown(inputLanguageDropdown, languages);
populateDropdown(outputLanguageDropdown, languages);

// Event listeners for dropdown toggling and option selection
dropdowns.forEach((dropdown) => {
  dropdown.addEventListener("click", (e) => {
    // Only toggle the dropdown active state if the click is not on the search input
    if (!e.target.classList.contains("language-search") && !e.target.closest(".language-search")) {
      dropdown.classList.toggle("active");
    }
  });
});

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
  dropdowns.forEach((dropdown) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
});

const swapBtn = document.querySelector(".swap-position"),
  inputLanguage = inputLanguageDropdown.querySelector(".selected"),
  outputLanguage = outputLanguageDropdown.querySelector(".selected"),
  inputTextElem = document.querySelector("#input-text"),
  outputTextElem = document.querySelector("#output-text");

// Swap button functionality
swapBtn.addEventListener("click", (e) => {
  // Swap displayed language names
  const tempLangName = inputLanguage.innerHTML;
  inputLanguage.innerHTML = outputLanguage.innerHTML;
  outputLanguage.innerHTML = tempLangName;

  // Swap language codes (data-value)
  const tempLangValue = inputLanguage.dataset.value;
  inputLanguage.dataset.value = outputLanguage.dataset.value;
  outputLanguage.dataset.value = tempLangValue;

  // Swap text content in text areas
  const tempInputText = inputTextElem.value;
  inputTextElem.value = outputTextElem.value;
  outputTextElem.value = tempInputText;

  translate(); // Re-translate with new language settings
});

/**
 * Fetches translation from Google Translate API and updates the output text area.
 */
function translate() {
  const inputText = inputTextElem.value;
  const inputLangCode = inputLanguage.dataset.value;
  const outputLangCode = outputLanguage.dataset.value;

  // Clear output if input is empty
  if (inputText.trim() === "") {
    outputTextElem.value = "";
    return;
  }

  // Construct Google Translate API URL
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${inputLangCode}&tl=${outputLangCode}&dt=t&q=${encodeURI(
    inputText,
  )}`;

  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      // The API response is an array of arrays; join the translated segments
      outputTextElem.value = json[0].map((item) => item[0]).join("");
    })
    .catch((error) => {
      console.error("Translation error:", error);
      outputTextElem.value = "Translation error. Please try again.";
    });
}

// Input text area event listener for real-time translation and character count
inputTextElem.addEventListener("input", (e) => {
  // Limit input to 5000 characters
  if (inputTextElem.value.length > 5000) {
    inputTextElem.value = inputTextElem.value.slice(0, 5000);
  }
  translate(); // Translate as user types
});

const uploadDocument = document.querySelector("#upload-document"),
  uploadTitle = document.querySelector("#upload-title"); // Element to display uploaded file name

// Document upload functionality
uploadDocument.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return; // Exit if no file selected

  // Check for allowed file types
  const allowedTypes = [
    "application/pdf",
    "text/plain",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ];

  if (allowedTypes.includes(file.type)) {
    if (uploadTitle) {
      uploadTitle.innerHTML = file.name; // Display file name
    }
    const reader = new FileReader();
    reader.readAsText(file); // Read file content as text
    reader.onload = (e) => {
      inputTextElem.value = e.target.result; // Set text area value
      translate(); // Translate uploaded text
    };
  } else {
    alert("Please upload a valid file (PDF, TXT, DOC, DOCX).");
    if (uploadTitle) {
      uploadTitle.innerHTML = "Upload Document"; // Reset upload title
    }
    e.target.value = null; // Clear the file input
  }
});

const downloadBtn = document.querySelector("#download-btn");

// Download button functionality
downloadBtn.addEventListener("click", (e) => {
  const outputText = outputTextElem.value;
  const outputLanguageCode = outputLanguage.dataset.value;

  if (outputText) {
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob); // Create a URL for the blob
    const a = document.createElement("a");
    a.download = `translated-to-${outputLanguageCode}.txt`; // Set download file name
    a.href = url;
    document.body.appendChild(a); // Append to body (required for Firefox)
    a.click(); // Programmatically click to trigger download
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url); // Release the object URL
  }
});

const darkModeCheckbox = document.getElementById("dark-mode-btn");

// Dark mode toggle functionality
darkModeCheckbox.addEventListener("change", () => {
  document.body.classList.toggle("dark"); // Toggle 'dark' class on body
});

const inputChars = document.querySelector("#input-chars");

// Update input character count
inputTextElem.addEventListener("input", (e) => {
  inputChars.innerHTML = inputTextElem.value.length;
});

// Text-to-speech (Listen) functionality
const inputListenBtn = document.querySelector("#input-listen-btn");
const outputListenBtn = document.querySelector("#output-listen-btn");

/**
 * Uses the Web Speech API to speak the given text in the specified language.
 * @param {string} text The text to speak.
 * @param {string} lang The language code for the speech (e.g., 'en', 'es').
 */
function speakText(text, lang) {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang; // Set the language
    speechSynthesis.speak(utterance); // Speak the text
  } else {
    alert("Sorry, your browser does not support text-to-speech.");
  }
}

// Event listener for input text listen button
inputListenBtn.addEventListener("click", () => {
  const textToSpeak = inputTextElem.value;
  // Get the actual language code from the input dropdown's selected value
  const languageCode = inputLanguageDropdown.querySelector(".selected").dataset.value;
  if (textToSpeak) {
    speakText(textToSpeak, languageCode);
  }
});

// Event listener for output text listen button
outputListenBtn.addEventListener("click", () => {
  const textToSpeak = outputTextElem.value;
  // Get the actual language code from the output dropdown's selected value
  const languageCode = outputLanguageDropdown.querySelector(".selected").dataset.value;
  if (textToSpeak) {
    speakText(textToSpeak, languageCode);
  }
});