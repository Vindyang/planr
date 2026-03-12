const fs = require('fs');
const pdf = require('pdf-parse');

async function extract() {
  const buffer = fs.readFileSync('../reference/Project Proposal G4-T6.pdf');
  try {
    const data = await pdf(buffer);
    console.log(data.text);
  } catch (error) {
    console.error(error);
  }
}

extract();
