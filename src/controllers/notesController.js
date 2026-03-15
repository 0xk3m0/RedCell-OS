const db = require('../config/db');
exports.getCategories = async (req,res) => {
  const cats = await db.pAll('SELECT * FROM note_categories WHERE user_id=? ORDER BY sort_order,name',[req.session.userId]);
  const map={},roots=[];
  cats.forEach(c=>{map[c.id]={...c,children:[]};});
  cats.forEach(c=>{c.parent_id?map[c.parent_id]?.children.push(map[c.id]):roots.push(map[c.id]);});
  res.json(roots);
};
exports.createCategory = async (req,res) => {
  const {name,icon='📁',color='blue',parent_id=null} = req.body; if(!name) return res.status(400).json({error:'Name required'});
  const maxRow = await db.pGet('SELECT MAX(sort_order) as m FROM note_categories WHERE user_id=?',[req.session.userId]);
  const r = await db.pRun('INSERT INTO note_categories (user_id,name,icon,color,parent_id,sort_order) VALUES (?,?,?,?,?,?)',[req.session.userId,name,icon,color,parent_id||null,(maxRow?.m||0)+1]);
  res.json({id:r.lastID,name,icon,color,parent_id,children:[]});
};
exports.updateCategory = async (req,res) => {
  const {name,icon,color,parent_id} = req.body;
  await db.pRun('UPDATE note_categories SET name=COALESCE(?,name),icon=COALESCE(?,icon),color=COALESCE(?,color),parent_id=? WHERE id=? AND user_id=?',[name,icon,color,parent_id!==undefined?parent_id:undefined,req.params.id,req.session.userId]);
  res.json({success:true});
};
exports.deleteCategory = async (req,res) => {
  await db.pRun('UPDATE notes SET category_id=NULL WHERE category_id=? AND user_id=?',[req.params.id,req.session.userId]);
  await db.pRun('UPDATE note_categories SET parent_id=NULL WHERE parent_id=? AND user_id=?',[req.params.id,req.session.userId]);
  await db.pRun('DELETE FROM note_categories WHERE id=? AND user_id=?',[req.params.id,req.session.userId]);
  res.json({success:true});
};
exports.getNotes = async (req,res) => {
  const {category_id,q,parent_id} = req.query;
  let sql='SELECT * FROM notes WHERE user_id=?'; const p=[req.session.userId];
  if(category_id!==undefined){sql+=category_id==='null'?' AND category_id IS NULL':' AND category_id=?';if(category_id!=='null')p.push(category_id);}
  if(parent_id!==undefined){sql+=parent_id==='null'?' AND parent_id IS NULL':' AND parent_id=?';if(parent_id!=='null')p.push(parent_id);}
  if(q){sql+=' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';const s=`%${q}%`;p.push(s,s,s);}
  sql+=' ORDER BY pinned DESC,updated_at DESC';
  res.json(await db.pAll(sql,p));
};
exports.getNote = async (req,res) => {
  const note = await db.pGet('SELECT * FROM notes WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!note) return res.status(404).json({error:'Not found'});
  const children = await db.pAll('SELECT id,title,updated_at,word_count,pinned FROM notes WHERE parent_id=? AND user_id=? ORDER BY sort_order,title',[note.id,req.session.userId]);
  res.json({...note,children});
};
exports.createNote = async (req,res) => {
  const {title,content='',category_id=null,tags='',parent_id=null} = req.body; if(!title) return res.status(400).json({error:'Title required'});
  const words=(content||'').trim().split(/\s+/).filter(Boolean).length;
  const r = await db.pRun('INSERT INTO notes (user_id,title,content,category_id,tags,parent_id,word_count) VALUES (?,?,?,?,?,?,?)',[req.session.userId,title,content,category_id||null,tags,parent_id||null,words]);
  res.json({id:r.lastID,title,content,category_id,tags,parent_id,word_count:words});
};
exports.updateNote = async (req,res) => {
  const n = await db.pGet('SELECT * FROM notes WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!n) return res.status(404).json({error:'Not found'});
  const {title,content,category_id,tags,pinned,parent_id} = req.body;
  const nc=content!==undefined?content:n.content;
  const words=nc.trim().split(/\s+/).filter(Boolean).length;
  await db.pRun('UPDATE notes SET title=?,content=?,category_id=?,tags=?,pinned=?,parent_id=?,word_count=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [title||n.title,nc,category_id!==undefined?category_id:n.category_id,tags??n.tags,pinned??n.pinned,parent_id!==undefined?parent_id:n.parent_id,words,n.id]);
  res.json({success:true,word_count:words});
};
exports.deleteNote = async (req,res) => {
  const n = await db.pGet('SELECT * FROM notes WHERE id=? AND user_id=?',[req.params.id,req.session.userId]); if(!n) return res.status(404).json({error:'Not found'});
  await db.pRun('UPDATE notes SET parent_id=? WHERE parent_id=? AND user_id=?',[n.parent_id,n.id,req.session.userId]);
  await db.pRun('DELETE FROM notes WHERE id=? AND user_id=?',[n.id,req.session.userId]);
  res.json({success:true});
};
