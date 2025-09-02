import { ai, supabase } from './config.js'
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import movieList from "./content.js"



const appForm = document.getElementById('app-input')

console.log('working')
// main()

appForm.addEventListener('submit', function(e){
    e.preventDefault()
    const formElement = document.getElementById('app-input')
    const form = new FormData(formElement)
    const answer1 = form.get('query-1')
    const answer2 = form.get('query-2')
    const answer3 = form.get('query-3')
    const answer = `
      My favorite movie is ${answer1}. 
      I am in mood for something ${answer2}. 
      I want a movie that is somewhat ${answer3}
    `
    searchMovie(answer)
    // call different functions here
  })

async function searchMovie(query){
  console.log(`
    the query is 
    ${query}`)
    // const splitedDoc = await splitQuery(query)
    const queryEmbedding = await createQueryEmbeddings(query)
    const match = await findNearestMatch(queryEmbedding.embedding)
    const outputText = await getChatCompletion(match, query)
    document.getElementById('output-here').innerText = outputText
    // console.log(queryEmbedding.embedding)
}

async function storeMovieData(){
  const splitedDoc = await splitDocument()
  const embeddingMapping = await createEmbeddings(splitedDoc)

  // await supabase.from('documents').insert(embeddingMapping);

  console.log(embeddingMapping)
  console.log("stored in database") 
}

/* Split movies.txt into text chunks.
Return LangChain's "output" – the array of Document objects. */
async function splitQuery(query) {

  // working above this
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 330, 
    chunkOverlap: 33,
  })
  const output = await splitter.createDocuments([query])
  return output
}

async function createQueryEmbeddings(query) {
  // create embedding map
  const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: query
    })

  return {
        content: query,
        embedding: response.embeddings[0].values
      }
  // const chunkData = await splitDocument("movies.txt");
  
}



async function splitDocument(document) {
  let movieText = ''
  movieList.forEach((movie)=>{
    movieText += `
    title: ${movie.title}
    release year: ${movie.releaseYear}
    content: ${movie.content}
    `
  })

  // working above this
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 330, 
    chunkOverlap: 33,
  })
  const output = await splitter.createDocuments([movieText])
  return output
}

/* Create an embedding from each text chunk.
Store all embeddings and corresponding text in Supabase. */
async function createEmbeddings(splitedDoc) {
  const content = splitedDoc.map((doc)=>{
    return doc.pageContent
  })
  // create embedding map
  const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: content
    })
    
    const embeddingMapping = content.map((content, index)=>{
      return {
        content: content,
        embedding: response.embeddings[index].values
      }
    })
    return embeddingMapping
  // const chunkData = await splitDocument("movies.txt");
  
}

async function findNearestMatch(embedding) {
  const { data } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.50,
    match_count: 1
  });
  return data[0].content;
}

const chatMessages = [{
    role: 'model',
    parts: [{text: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some context about movies and a question. Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the answer in the context, say, "Sorry, I don't know the answer." Please do not make up the answer. Limit your answer under 200 words.`} ]
}];

async function getChatCompletion(text, query) {
  chatMessages.push({
    role: 'user',
    parts: [{text: `Context: ${text} Question: ${query}`}]
  });
  
  // const response = await openai.chat.completions.create({
  //   model: 'gpt-4',
  //   messages: chatMessages,
  //   temperature: 0.5,
  //   frequency_penalty: 0.5
  // });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: chatMessages,
  });
  return response.text
}




