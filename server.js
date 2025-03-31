// Set up Next.js and Express

const express = require("express");
const { createServer } = require("http");
const next = require("next");
const WebSocket = require("ws");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

const server = express();
const httpServer = createServer(server);

//Set up WebSocket Server
const wss = new WebSocket.Server({ server: httpServer });
const watchers = new Map();

wss.on("connection", (ws, res) => {
  const productId = req.url && req.url.split("/").pop();
  if (!productId) return;

  //Increment watcher count
  const currentCount = (watchers.get(productId) || 0) + 1;
  watchers.set(productId, currentCount);
  console.log(`Product ${productId} now has ${currentCount} watchers`);

  //Notify all connected clients about the new watcher count
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ productId, count: currentCount }));
    }
  });

  //Handle disconnection
  ws.on("close", () => {
    const updatedCount = Math.max(0, (watchers.get(productId) || 0) - 1);

    if (updatedCount === 0) {
      watchers.delete(productId); //Remove entry if there's no watcher left
    } else {
      watchers.set(productId, updatedCount);
    }

    console.log(
      `Connection closed for product ${productId}. Now has ${updatedCount} watchers`
    );

    //Notify all connected clients about the updated watcher count
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ productId, count: updatedCount }));
      }
    });
  });

  //Send initial message
  ws.send(
    JSON.stringify({ message: "connected", productId, count: currentCount })
  );
});

//Handle Next.js Routing
server.all("*", (req, res) => {
  return handler(req, res);
});

//Start the Server
httpServer.listen(4000, (err) => {
  if (err) throw err;
  console.log("Server is running on port 4000");
});
