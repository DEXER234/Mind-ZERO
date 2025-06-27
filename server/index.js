const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;
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

// In-memory comments per file: groupFilesComments[groupCode][filename] = [ { username, text, timestamp } ]
let groupFilesComments = {};

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
    // Support nested folders
    let folder = req.body.folder || '';
    // Sanitize folder (prevent path traversal)
    folder = folder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '');
    const dir = folder
      ? path.join(__dirname, 'uploads', groupCode, folder)
      : path.join(__dirname, 'uploads', groupCode);
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
    size: req.file.size,
    folder: req.body.folder || ''
  };
  groupFiles[groupCode].push(fileMeta);
  res.json({ success: true, file: fileMeta });
});

// List files in group
app.get('/api/groups/:code/files', (req, res) => {
  const groupCode = req.params.code;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  // Always return folder info for each file
  res.json({ files: groupFiles[groupCode] || [] });
});

// Download file from group
app.get('/api/groups/:code/files/:filename', (req, res) => {
  const groupCode = req.params.code;
  const filename = req.params.filename;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  // Find the file's folder
  const fileMeta = (groupFiles[groupCode] || []).find(f => f.filename === filename);
  let folder = fileMeta && fileMeta.folder ? fileMeta.folder : '';
  folder = folder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '');
  const dir = folder
    ? path.join(__dirname, 'uploads', groupCode, folder)
    : path.join(__dirname, 'uploads', groupCode);
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.download(filePath);
});

// Delete file from group
app.delete('/api/groups/:code/files/:filename', (req, res) => {
  const groupCode = req.params.code;
  const filename = req.params.filename;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  // Find the file's folder
  const fileMeta = (groupFiles[groupCode] || []).find(f => f.filename === filename);
  let folder = fileMeta && fileMeta.folder ? fileMeta.folder : '';
  folder = folder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '');
  const dir = folder
    ? path.join(__dirname, 'uploads', groupCode, folder)
    : path.join(__dirname, 'uploads', groupCode);
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

// Kick member from group (admin only)
app.post('/api/groups/kick', (req, res) => {
  const { code, member } = req.body;
  if (!code || !member) return res.status(400).json({ error: 'Missing code or member' });
  const group = groups[code];
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const creator = group.members[0];
  // Only creator can kick, and cannot kick themselves
  if (req.body.requester !== creator || member === creator) return res.status(403).json({ error: 'Not allowed' });
  group.members = group.members.filter(u => u !== member);
  if (userGroups[member]) userGroups[member] = userGroups[member].filter(c => c !== code);
  res.json({ success: true });
});

// Add a comment to a file
app.post('/api/groups/:code/files/:filename/comments', (req, res) => {
  const groupCode = req.params.code;
  const filename = req.params.filename;
  const { username, text } = req.body;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  if (!username || !text) return res.status(400).json({ error: 'Missing username or text' });
  if (!groupFilesComments[groupCode]) groupFilesComments[groupCode] = {};
  if (!groupFilesComments[groupCode][filename]) groupFilesComments[groupCode][filename] = [];
  groupFilesComments[groupCode][filename].push({ username, text, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Get comments for a file
app.get('/api/groups/:code/files/:filename/comments', (req, res) => {
  const groupCode = req.params.code;
  const filename = req.params.filename;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  const comments = (groupFilesComments[groupCode] && groupFilesComments[groupCode][filename]) || [];
  res.json({ comments });
});

// --- New: Move File to Another Folder ---
app.post('/api/groups/:code/files/move', (req, res) => {
  const groupCode = req.params.code;
  const { filename, toFolder } = req.body;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  if (!filename) return res.status(400).json({ error: 'Missing filename' });
  const fileMeta = (groupFiles[groupCode] || []).find(f => f.filename === filename);
  if (!fileMeta) return res.status(404).json({ error: 'File not found' });
  let fromFolder = fileMeta.folder || '';
  let toFolderSan = (toFolder || '').replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '');
  let fromFolderSan = fromFolder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '');
  const fromDir = fromFolderSan
    ? path.join(__dirname, 'uploads', groupCode, fromFolderSan)
    : path.join(__dirname, 'uploads', groupCode);
  const toDir = toFolderSan
    ? path.join(__dirname, 'uploads', groupCode, toFolderSan)
    : path.join(__dirname, 'uploads', groupCode);
  fs.mkdirSync(toDir, { recursive: true });
  const fromPath = path.join(fromDir, filename);
  const toPath = path.join(toDir, filename);
  if (!fs.existsSync(fromPath)) return res.status(404).json({ error: 'File not found on disk' });
  try {
    fs.renameSync(fromPath, toPath);
    fileMeta.folder = toFolderSan;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to move file' });
  }
});

// --- New: Rename Folder ---
app.post('/api/groups/:code/folders/rename', (req, res) => {
  const groupCode = req.params.code;
  const { fromFolder, toFolder } = req.body;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  if (!fromFolder || !toFolder) return res.status(400).json({ error: 'Missing folder names' });
  let fromSan = fromFolder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '');
  let toSan = toFolder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '');
  const fromDir = path.join(__dirname, 'uploads', groupCode, fromSan);
  const toDir = path.join(__dirname, 'uploads', groupCode, toSan);
  if (!fs.existsSync(fromDir)) return res.status(404).json({ error: 'Source folder not found' });
  try {
    fs.mkdirSync(path.dirname(toDir), { recursive: true });
    fs.renameSync(fromDir, toDir);
    // Update metadata for all files in this folder and subfolders
    (groupFiles[groupCode] || []).forEach(f => {
      if (f.folder && (f.folder === fromSan || f.folder.startsWith(fromSan + '/'))) {
        f.folder = f.folder.replace(fromSan, toSan);
      }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to rename folder' });
  }
});

// --- New: Delete Folder ---
app.post('/api/groups/:code/folders/delete', (req, res) => {
  const groupCode = req.params.code;
  const { folder } = req.body;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  if (!folder) return res.status(400).json({ error: 'Missing folder name' });
  let folderSan = folder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '');
  const dir = path.join(__dirname, 'uploads', groupCode, folderSan);
  if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Folder not found' });
  try {
    // Recursively delete folder
    fs.rmSync(dir, { recursive: true, force: true });
    // Remove all files in this folder and subfolders from metadata
    if (groupFiles[groupCode]) {
      groupFiles[groupCode] = groupFiles[groupCode].filter(f => !(f.folder && (f.folder === folderSan || f.folder.startsWith(folderSan + '/'))));
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// --- New: Rename File ---
app.post('/api/groups/:code/files/rename', (req, res) => {
  const groupCode = req.params.code;
  const { filename, newName } = req.body;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  if (!filename || !newName) return res.status(400).json({ error: 'Missing filename or newName' });
  const fileMeta = (groupFiles[groupCode] || []).find(f => f.filename === filename);
  if (!fileMeta) return res.status(404).json({ error: 'File not found' });
  let folder = fileMeta.folder || '';
  folder = folder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '');
  const dir = folder
    ? path.join(__dirname, 'uploads', groupCode, folder)
    : path.join(__dirname, 'uploads', groupCode);
  const oldPath = path.join(dir, filename);
  // Keep the timestamp prefix, but change the original name
  const newFilename = Date.now() + '-' + newName;
  const newPath = path.join(dir, newFilename);
  if (!fs.existsSync(oldPath)) return res.status(404).json({ error: 'File not found on disk' });
  try {
    fs.renameSync(oldPath, newPath);
    fileMeta.filename = newFilename;
    fileMeta.originalname = newName;
    res.json({ success: true, file: fileMeta });
  } catch (e) {
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

// --- New: Create Folder ---
app.post('/api/groups/:code/folders/create', (req, res) => {
  const groupCode = req.params.code;
  const { parentFolder, folderName } = req.body;
  if (!groups[groupCode]) return res.status(404).json({ error: 'Group not found' });
  if (!folderName) return res.status(400).json({ error: 'Missing folderName' });
  let parentSan = parentFolder ? parentFolder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '') : '';
  let folderSan = folderName.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\//, '').replace(/\/$/, '');
  const dir = parentSan
    ? path.join(__dirname, 'uploads', groupCode, parentSan, folderSan)
    : path.join(__dirname, 'uploads', groupCode, folderSan);
  try {
    fs.mkdirSync(dir, { recursive: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 