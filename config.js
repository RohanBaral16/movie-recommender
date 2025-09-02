// import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai'


import { createClient } from "@supabase/supabase-js";

/** OpenAI config */
// if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API key is missing or invalid.");
// export const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true
// });

if(!import.meta.env.VITE_GEMINI_API) throw new Error("OpenAI API key is missing or invalid.");
export const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API,
})

/** Supabase config */
const privateKey = import.meta.env.VITE_SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_API_KEY`);
const url = import.meta.env.VITE_SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);
export const supabase = createClient(url, privateKey);