const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

app.use(cors());
app.use(express.json());

// In-memory storage for demo
let groups = {};
let userGroups = {};

// File metadata storage (in-memory for demo)
let groupFiles = {};

// Helper to generate a random group code
function generateGroupCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Create Group
app.post('/api/groups/create', (req, res) => {
  const { groupName, username } = req.body;
  if (!groupName || !username) return res.status(400).json({ error: 'Missing groupName or username' });
  const code = generateGroupCode();
  groups[code] = { name: groupName, code, members: [username] };
  if (!userGroups[username]) userGroups[username] = [];
  userGroups[username].push(code);
  res.json({ code, group: groups[code] });
});

// Join Group
app.post('/api/groups/join', (req, res) => {
  const { code, username } = req.body;
  if (!code || !username) return res.status(400).json({ error: 'Missing code or username' });
  const group = groups[code];
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (!group.members.includes(username)) group.members.push(username);
  if (!userGroups[username]) userGroups[username] = [];
  if (!userGroups[username].includes(code)) userGroups[username].push(code);
  res.json({ group });
});

// List Groups for a user
app.get('/api/groups/list', (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'Missing username' });
  const codes = userGroups[username] || [];
  const userGroupList = codes.map(code => groups[code]).filter(Boolean);
  res.json({ groups: userGroupList });
});

// Leave Group
app.post('/api/groups/leave', (req, res) => {
  const { code, username } = req.body;
  if (!code || !username) return res.status(400).json({ error: 'Missing code or username' });
  const group = groups[code];
  if (!group) return res.status(404).json({ error: 'Group not found' });
  group.members = group.members.filter(u => u !== username);
  if (userGroups[username]) userGroups[username] = userGroups[username].filter(c => c !== code);
  // Optionally delete group if empty
  if (group.members.length === 0) delete groups[code];
  res.json({ success: true });
});

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const groupCode = req.params.code;
    const dir = path.join(__dirname, 'uploads', groupCode);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Upload file to group
app.post('/api/groups/:code/files', upload.single('file'), (req, res) => {
  const groupCode = req.params.code;
  const username = req.body.username;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!groupFiles[groupCode]) groupFiles[groupCode] = [];
  const fileMeta = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    uploader: username,
    uploadDate: new Date().toISOString(),
    size: req.file.size
  };
  groupFiles[groupCode].push(fileMeta);
  res.json({ success: true, file: fileMeta });
});

// List files in group
app.get('/api/groups/:code/files', (req, res) => {
  const groupCode = req.params.code;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  res.json({ files: groupFiles[groupCode] || [] });
});

// Download file from group
app.get('/api/groups/:code/files/:filename', (req, res) => {
  const groupCode = req.params.code;
  const filename = req.params.filename;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  const dir = path.join(__dirname, 'uploads', groupCode);
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.download(filePath);
});

// Delete file from group
app.delete('/api/groups/:code/files/:filename', (req, res) => {
  const groupCode = req.params.code;
  const filename = req.params.filename;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  const dir = path.join(__dirname, 'uploads', groupCode);
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  try {
    fs.unlinkSync(filePath);
    if (groupFiles[groupCode]) {
      groupFiles[groupCode] = groupFiles[groupCode].filter(f => f.filename !== filename);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 