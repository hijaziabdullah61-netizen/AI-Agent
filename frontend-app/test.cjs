const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:8081/api/chat/ask', {
      sessionId: "test-node-1",
      question: "ايش هو اخر موديل من تويوتا افالون",
      language: "ar",
      role: "user"
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}

test();
