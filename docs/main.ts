import { 
  isValidNif, 
  DNI_CONTROL_LETTERS,
  CIF_CONTROL_LETTERS
} from 'nif-dni-nie-cif-validation';

// UI Elements
const validateTab = document.querySelector('[data-tab="validate"]') as HTMLButtonElement;
const generateTab = document.querySelector('[data-tab="generate"]') as HTMLButtonElement;
const validatePane = document.getElementById('validate-pane') as HTMLDivElement;
const generatePane = document.getElementById('generate-pane') as HTMLDivElement;

const idInput = document.getElementById('id-input') as HTMLInputElement;
const validationResult = document.getElementById('validation-result') as HTMLDivElement;

const idTypeSelect = document.getElementById('id-type') as HTMLSelectElement;
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const generationResult = document.getElementById('generation-result') as HTMLDivElement;

// Tab Switching
validateTab.addEventListener('click', () => {
  validateTab.classList.add('active');
  generateTab.classList.remove('active');
  validatePane.classList.add('active');
  generatePane.classList.remove('active');
});

generateTab.addEventListener('click', () => {
  generateTab.classList.add('active');
  validateTab.classList.remove('active');
  generatePane.classList.add('active');
  validatePane.classList.remove('active');
});

// Live Validator
idInput.addEventListener('input', (e) => {
  const val = (e.target as HTMLInputElement).value.trim();
  
  if (val.length === 0) {
    validationResult.className = 'result neutral';
    validationResult.textContent = 'Awaiting input...';
    return;
  }

  // Use the library to validate
  const isValid = isValidNif(val);
  
  if (isValid) {
    validationResult.className = 'result valid';
    validationResult.textContent = '✅ Valid Document ID';
  } else {
    validationResult.className = 'result invalid';
    validationResult.textContent = '❌ Invalid Document ID';
  }
});

// Generator Logic
function generateRandomNumberString(length: number): string {
  let res = '';
  for(let i=0; i<length; i++) {
    res += Math.floor(Math.random() * 10).toString();
  }
  return res;
}

function generateDNI(): string {
  const numStr = generateRandomNumberString(8);
  const letter = DNI_CONTROL_LETTERS[parseInt(numStr, 10) % 23];
  return `${numStr}${letter}`;
}

function generateNIE(): string {
  const startLetters = ['X', 'Y', 'Z'];
  const start = startLetters[Math.floor(Math.random() * startLetters.length)];
  const numStr = generateRandomNumberString(7);
  
  const prefixMap = { 'X': 0, 'Y': 1, 'Z': 2 };
  const numericValue = parseInt(`${prefixMap[start as keyof typeof prefixMap]}${numStr}`, 10);
  const letter = DNI_CONTROL_LETTERS[numericValue % 23];
  
  return `${start}${numStr}${letter}`;
}

// CIF Generation is complex. We'll implement a basic valid CIF.
// Organizations A, B, C, D, E, F, G, H, J, N, P, Q, R, S, U, V, W
function generateCIF(): string {
  const orgChars = "ABCDEFGHJNPQRSUVW";
  const start = orgChars[Math.floor(Math.random() * orgChars.length)];
  const numStr = generateRandomNumberString(7);
  
  // CIF control code logic is simplified here to use the library later, 
  // but for now, generate a number that works. We will just use a known valid one for simplicity 
  // or brute force until isValidNif passes (since library is fast).
  let attempts = 0;
  while (attempts < 100) {
    const candidateStr = generateRandomNumberString(7);
    const candidateChars = "ABCDEFGHIJ";
    const controlChar = candidateChars[Math.floor(Math.random() * candidateChars.length)];
    const controlNum = Math.floor(Math.random() * 10).toString();
    
    // Try both letter and number endings
    const test1 = `${start}${candidateStr}${controlChar}`;
    const test2 = `${start}${candidateStr}${controlNum}`;
    
    if (isValidNif(test1)) return test1;
    if (isValidNif(test2)) return test2;
    attempts++;
  }
  return "A12345674"; // fallback known valid
}

generateBtn.addEventListener('click', () => {
  const type = idTypeSelect.value;
  let result = '';
  
  if (type === 'DNI') result = generateDNI();
  else if (type === 'NIE') result = generateNIE();
  else if (type === 'CIF') result = generateCIF();

  generationResult.className = 'result valid';
  generationResult.innerHTML = `<strong>Generated ${type}:</strong> ${result} <br/><small style="color:var(--text-muted)">(Copied to clipboard!)</small>`;
  
  navigator.clipboard.writeText(result).catch(()=>console.log("Clipboard write failed"));
});
