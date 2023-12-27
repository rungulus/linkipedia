async function fetchContent() {
    const pageTitle = document.getElementById('pageTitle').value;
    console.log("Fetching content for:", pageTitle); // Log the requested page title

    try {
      const response = await fetch(`http://cors-anywhere.herokuapp.com/https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${pageTitle}&origin=*&formatversion=2`);
      //console.log("Response received:", response); // Log the raw response

      const contentType = response.headers.get('content-type');
      let data;
  
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        //console.log("JSON data:", data); // Log the JSON data

        if (data.error) {
          throw new Error(data.error.info);
        }
        const pageTitle = data.parse.title;
        const pageContent = data.parse.text;
        //console.log("Page content:", pageContent); // Log the page content

        displayContent(pageContent, pageTitle);
      } else {
        throw new Error('Unexpected response from Wikipedia API');
      }
    } catch (error) {
      console.error('Error:', error); // Log any errors
      displayError('Error fetching Wikipedia page: ' + error.message);
    }
}
  
function displayContent(htmlContent, title) {
    // Create a new DOMParser instance
    const parser = new DOMParser();
    // Parse the HTML content into a document
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Display the content
    document.getElementById('contentDisplay').innerHTML = doc.documentElement.innerHTML;

    // Apply styling to the title
    const titleElement = document.getElementById('contentTitle');
    titleElement.innerHTML = `<h1 style="font-size: 32px; font-weight: bold;">${title}</h1>`;

    //once that's done, let's check some words
    extractUniqueWords(doc.documentElement.innerHTML);
}
  
function displayError(message) {
document.getElementById('contentDisplay').innerHTML = `<p>${message}</p>`;
}

function extractUniqueWords(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const uniqueWords = new Set();
    let processedWordsCount = 0; // Counter for processed words

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const words = node.textContent.match(/\b(\w+)\b/g);
            if (words) {
                words.forEach(async (word) => {
                    if (processedWordsCount < 5 && !uniqueWords.has(word.toLowerCase())) {
                        uniqueWords.add(word.toLowerCase());
                        await checkIfPageExists(word);
                        processedWordsCount++; // Increment the counter
                    }
                });
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
            node.childNodes.forEach(processNode);
        }
    }

    doc.body.childNodes.forEach(processNode);
}

async function checkIfPageExists(word) {
    try {
        const response = await fetch(`http://cors-anywhere.herokuapp.com/https://en.wikipedia.org/w/api.php?action=query&titles=${word}&format=json&origin=*`);
        const data = await response.json();
        console.log(data);
        return !data.query.pages[-1]; // If page exists, 'pages' object doesn't have '-1' key
    } catch (error) {
        console.error('Error checking Wikipedia page:', error);
        return false;
    }
}
  
  