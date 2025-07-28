// src/api/spellCorrectionAPI.js

import axios from 'axios';

const SPELL_CORRECT_API = 'http://127.0.0.1:8000/spell-correct';

export async function fetchSpellCorrection(query) {
  // query: string
  console.log("spell correction api called!");
  
  const res = await axios.get(SPELL_CORRECT_API, { params: { query } });
  return res.data; // expects { correction: "..."} or { correction: null }
}
