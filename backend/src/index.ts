// C:\Users\hemant\Downloads\synapse\backend\src\index.ts
// Temporary simple content for build testing
console.log("Minimal index.ts running");

const port = process.env.PORT || 3001;

// Minimal HTTP server to keep process alive
const http = require('http'); // Using require for simplicity in this minimal file
const server = http.createServer((req: any, res: any) => { // Using any for simplicity here
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Minimal server running\n');
});

server.listen(port, () => {
    console.log(`Minimal server listening on port ${port}`);
});