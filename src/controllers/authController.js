const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { HABITS, ROADMAP, PROJECTS, NOTE_CATS } = require('../config/seed');

exports.register = async (req, res) => {
  const { username, email, password, mission } = req.body;
  if (!username||!email||!password) return res.status(400).json({error:'All fields required'});
  if (password.length < 6) return res.status(400).json({error:'Password min 6 characters'});
  try {
    const hash = await bcrypt.hash(password, 12);
    const { lastID: uid } = await db.pRun(
      'INSERT INTO users (username,email,password,mission,avatar_letter) VALUES (?,?,?,?,?)',
      [username, email.toLowerCase(), hash, mission||'Web Penetration Tester', username[0].toUpperCase()]
    );
    for (const [name,icon,cat,color,order] of HABITS)
      await db.pRun('INSERT INTO habits (user_id,name,icon,category,color,sort_order) VALUES (?,?,?,?,?,?)',[uid,name,icon,cat,color,order]);
    const { lastID: mapId } = await db.pRun(
      'INSERT INTO roadmap_maps (user_id,name,description,icon,color,is_default) VALUES (?,?,?,?,?,1)',
      [uid,ROADMAP.name,ROADMAP.description,ROADMAP.icon,ROADMAP.color]
    );
    for (const grp of ROADMAP.groups) {
      const { lastID: gId } = await db.pRun(
        'INSERT INTO roadmap_groups (map_id,user_id,name,description,icon,color,sort_order) VALUES (?,?,?,?,?,?,?)',
        [mapId,uid,grp.name,grp.description,grp.icon,grp.color,grp.order]
      );
      for (const item of grp.items) {
        const { lastID: iId } = await db.pRun(
          'INSERT INTO roadmap_items (group_id,user_id,name,description,difficulty,estimated_hours,resources,labs,tags,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [gId,uid,item.name,item.description,item.diff,item.hours,JSON.stringify(item.resources),JSON.stringify(item.labs),item.tags,item.subs.length]
        );
        for (let j = 0; j < item.subs.length; j++)
          await db.pRun('INSERT INTO roadmap_subtopics (item_id,user_id,name,sort_order) VALUES (?,?,?,?)',[iId,uid,item.subs[j],j+1]);
      }
    }
    for (const p of PROJECTS)
      await db.pRun('INSERT INTO projects (user_id,name,description,status,stage,tags,tech_stack,color,progress) VALUES (?,?,?,?,?,?,?,?,?)',
        [uid,p.name,p.description,p.status,p.stage,p.tags,p.tech,p.color,p.progress]);
    const catMap = {};
    for (const cat of NOTE_CATS) {
      const parentId = cat.parent ? catMap[cat.parent] : null;
      const { lastID: cId } = await db.pRun(
        'INSERT INTO note_categories (user_id,name,icon,color,parent_id,sort_order) VALUES (?,?,?,?,?,?)',
        [uid,cat.name,cat.icon,cat.color,parentId,cat.order]
      );
      catMap[cat.name] = cId;
    }
    req.session.userId = uid; req.session.username = username;
    res.json({ success: true, redirect: '/dashboard' });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(400).json({error:'Username or email already taken'});
    console.error(err); res.status(500).json({error:'Server error'});
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email||!password) return res.status(400).json({error:'Email and password required'});
  try {
    const user = await db.pGet('SELECT * FROM users WHERE email=?',[email.toLowerCase()]);
    if (!user) return res.status(401).json({error:'Invalid credentials'});
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({error:'Invalid credentials'});
    req.session.userId = user.id; req.session.username = user.username;
    res.json({ success: true, redirect: '/dashboard' });
  } catch(e){ console.error(e); res.status(500).json({error:'Server error'}); }
};
exports.logout = (req,res) => req.session.destroy(()=>res.json({success:true}));
exports.me = async (req,res) => {
  if (!req.session.userId) return res.status(401).json({error:'Not authenticated'});
  const u = await db.pGet('SELECT id,username,email,mission,bio,focus_duration,daily_focus_target,theme,accent_color,timezone,notifications_enabled,sound_enabled,avatar_letter,created_at FROM users WHERE id=?',[req.session.userId]);
  res.json(u);
};
