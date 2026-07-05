const axios = require('axios');
const fs = require('fs');

async function check() {
  const res = await axios.get('http://localhost:8081/api/faqs');
  const faqs = res.data;
  
  const matches = faqs.filter(f => 
    (f.questionAr && f.questionAr.includes('افالون')) ||
    (f.answerAr && f.answerAr.includes('افالون')) ||
    (f.questionAr && f.questionAr.includes('تويوتا')) ||
    (f.answerAr && f.answerAr.includes('تويوتا'))
  );
  
  console.log("Matches found:", matches.length);
  console.log(JSON.stringify(matches, null, 2));
  
  if (matches.length > 0) {
     console.log("Deleting matches...");
     for (let m of matches) {
        await axios.delete(`http://localhost:8081/api/faqs/${m.id}`);
        console.log(`Deleted FAQ ID: ${m.id}`);
     }
  }
}
check();
