const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());

const path = require('path');

// Serve frontend's dist folder
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});


app.get('/', (req, res) => {
  res.send('Backend is running!');
});

const PORT = process.env.PORT || 3000;
const FASTAPI_BACKEND_URL = process.env.FASTAPI_BACKEND_URL || "http://localhost:8000/execute";

const documents = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_document', (documentId) => {
    socket.join(documentId);
    console.log(`User ${socket.id} joined ${documentId}`);
  });

  socket.on('leave_document', (documentId) => {
    socket.leave(documentId);
  });

  socket.on('code_change', (data) => {
    const { documentId, newContent, senderId, fileName } = data;
    documents.set(documentId, newContent);
    socket.to(documentId).emit('code_change', { newContent, senderId, fileName });
  });

  socket.on('cursor_update', (data) => {
    const { documentId, fileName, userId, position, selection } = data;
    socket.to(documentId).emit('cursor_update', { userId, position, selection, fileName });
  });

  socket.on('run_code', async (documentId) => {
    const codeToExecute = documents.get(documentId);
    if (!codeToExecute) {
      socket.emit('code_output', { output: 'No code to run.', error: false });
      return;
    }

    try {
      const response = await axios.post(FASTAPI_BACKEND_URL, { code: codeToExecute });
      socket.emit('code_output', {
        output: response.data.output || '',
        error: response.data.error
      });
    } catch (err) {
      socket.emit('code_output', { output: `Error: ${err.message}`, error: true });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
