const express = require("express");
const path = require("path");
const app = express();
const id= require("./routes/index.js");
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const axios = require('axios');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/analyze', async (req, res) => {
  const { resumeText, jobRole } = req.body;

const prompt = `
You are a resume reviewer. Analyze this resume for the following 3 parameters:

1. Projects – Are they technically relevant and demonstrate impact?
2. Data Structures & Algorithms (DSA) – Is there any mention of solving problems, DSA skills, etc.?
3. Competitive Programming (CP) – Is there any experience with platforms like Codeforces, Leetcode, etc.?

For each parameter, provide:
- A score (number) out of 5 (decimals allowed)
- A short explanation

Also, based on the analysis, give a concise recommendation to improve the resume.

Respond ONLY with a valid JSON object with keys "Projects", "DSA", "CP", and "Recommendation", like this:

{
  "Projects": { "score": <number>, "explanation": "<text>" },
  "DSA": { "score": <number>, "explanation": "<text>" },
  "CP": { "score": <number>, "explanation": "<text>" },
  "Recommendation": "<concise recommendation here>"
}

Resume for role: ${jobRole}
Resume Content:
${resumeText}
`;

  try {
    const response = await axios.post('https://api.deepinfra.com/v1/openai/chat/completions', {
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    const jsonStart = aiResponse.indexOf('{');
    const jsonEnd = aiResponse.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON found in AI response');
    }
    const jsonString = aiResponse.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);

    const scores = ['Projects', 'DSA', 'CP'].map(key => parsed[key]?.score || 0);
    const overallRating = scores.reduce((sum, val) => sum + val, 0) / scores.length;

    const evaluation = `
Projects (${parsed.Projects.score}/5): ${parsed.Projects.explanation}

DSA (${parsed.DSA.score}/5): ${parsed.DSA.explanation}

Competitive Programming (${parsed.CP.score}/5): ${parsed.CP.explanation}
    `.trim();

    res.json({
      evaluation,
      rating: overallRating,
      recommendation: parsed.Recommendation || "No recommendations provided."
    });

  } catch (err) {
    console.error('Error parsing AI response or requesting AI:', err.message || err);
    res.json({
      evaluation: response?.data?.choices?.[0]?.message?.content || 'No evaluation available.',
      rating: 0,
      recommendation: 'No recommendations available.'
    });
  }
});

app.set("view engine","ejs");
app.set("views" ,path.join(__dirname,"/views"));


app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({extended : true}));  

app.use("/" , id );



app.listen(3000 , ()=>{
    console.log("server working");
})