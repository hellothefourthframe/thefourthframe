/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');

https.get('https://cloudflare-dns.com/dns-query?name=_mongodb._tcp.thefourthframe.ivm4g4z.mongodb.net&type=SRV', {
  headers: { 'accept': 'application/dns-json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.Answer) {
        const nodes = json.Answer.map(a => {
          // answer is something like "0 0 27017 cluster0-shard-00-00.abc.mongodb.net."
          const parts = a.data.split(' ');
          const port = parts[2];
          const host = parts[3].replace(/\.$/, '');
          return `${host}:${port}`;
        });
        
        console.log(`\n\n\n=== REPLACEMENT URI ===\nmongodb://ting33497_db_user:viYkqo9nyjAdEtfL@${nodes.join(',')}/thefourthframe?ssl=true&replicaSet=atlas-dksome-shard-0&authSource=admin&retryWrites=true&w=majority`);
      } else {
        console.log('No Answer found:', json);
      }
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', console.error);
