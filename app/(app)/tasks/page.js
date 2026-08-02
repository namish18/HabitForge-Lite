'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import styles from './tasks.module.css';
import {
  encryptWithSession,
  decryptWithSession,
  isEncryptedPayload,
  hasSessionPassword,
} from '@/lib/crypto';

const PRIORITIES = ['low', 'medium', 'high'];
const PRIORITY_LABELS = { low: '🟢 Low', medium: '🟡 Medium', high: '🔴 High' };

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSub, setFilterSub] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [form, setForm] = useState({
    title: '', description: '', subcategoryId: '', targetMinutes: 60, priority: 'medium',
  });

  useEffect(() => {
    if (!hasSessionPassword()) { router.push('/login'); return; }
    loadData();
  }, []);

  async function safeDecrypt(payload, fallback) {
    if (payload === null || payload === undefined) return fallback;
    if (!isEncryptedPayload(payload)) return fallback;
    return decryptWithSession(payload);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [tPayload, cPayload, sPayload] = await Promise.all([
        fetch('/api/tasks').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/subcategories').then((r) => r.json()),
      ]);
      setTasks(await safeDecrypt(tPayload, []));
      setCategories(await safeDecrypt(cPayload, []));
      setSubcategories(await safeDecrypt(sPayload, []));
    } catch (e) {
      if (e.message?.includes('No active session')) { router.push('/login'); return; }
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (search) result = result.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority);
    if (filterSub !== 'all') result = result.filter((t) => t.subcategoryId === filterSub);
    result.sort((a, b) => {
      if (sortBy === 'priority') { const o = { high: 0, medium: 1, low: 2 }; return o[a.priority] - o[b.priority]; }
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return result;
  }, [tasks, search, filterPriority, filterSub, sortBy]);

  function openCreate() {
    setEditing(null);
    setForm({ title: '', description: '', subcategoryId: subcategories[0]?.id || '', targetMinutes: 60, priority: 'medium' });
    setShowModal(true);
  }

  function openEdit(task) {
    setEditing(task);
    setForm({ title: task.title, description: task.description || '', subcategoryId: task.subcategoryId, targetMinutes: task.targetMinutes, priority: task.priority });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.subcategoryId) return toast.error('Select a subcategory');
    setSaving(true);
    try {
      let updated;
      if (editing) {
        updated = tasks.map((t) =>
          t.id === editing.id
            ? { ...t, ...form, title: form.title.trim(), targetMinutes: parseInt(form.targetMinutes) || 60 }
            : t
        );
      } else {
        const newTask = {
          id: uuidv4(),
          subcategoryId: form.subcategoryId,
          title: form.title.trim(),
          description: form.description?.trim() || '',
          targetMinutes: parseInt(form.targetMinutes) || 60,
          priority: ['low', 'medium', 'high'].includes(form.priority) ? form.priority : 'medium',
          createdAt: new Date().toISOString(),
        };
        updated = [...tasks, newTask];
      }

      const encryptedPayload = await encryptWithSession(updated);

      if (editing) {
        const res = await fetch(`/api/tasks/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encryptedPayload }),
        });
        if (!res.ok) throw new Error();
        toast.success('Task updated');
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encryptedPayload }),
        });
        if (!res.ok) throw new Error();
        toast.success('Task created');
      }

      setShowModal(false);
      await loadData();
    } catch { toast.error('Failed to save task'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return;
    try {
      const filtered = tasks.filter((t) => t.id !== id);
      const encryptedPayload = await encryptWithSession(filtered);
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedPayload }),
      });
      toast.success('Task deleted');
      setTasks(filtered);
    } catch { toast.error('Failed to delete'); }
  }

  function getSubCategory(id) { return subcategories.find((s) => s.id === id); }
  function getCategory(subId) {
    const sub = getSubCategory(subId);
    return sub ? categories.find((c) => c.id === sub.categoryId) : null;
  }

  if (loading) return <div className="page-wrapper"><div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} total · {filteredTasks.length} shown</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="create-task-btn">+ New Task</button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input className={styles.search} placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} id="task-search" />
        </div>
        <select className="form-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ width: 140 }} id="filter-priority">
          <option value="all">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>
        <select className="form-select" value={filterSub} onChange={(e) => setFilterSub(e.target.value)} style={{ width: 160 }} id="filter-sub">
          <option value="all">All Subcategories</option>
          {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 140 }} id="sort-by">
          <option value="createdAt">Newest First</option>
          <option value="priority">By Priority</option>
          <option value="title">Alphabetical</option>
        </select>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <p className="empty-state-title">{tasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}</p>
          <p className="empty-state-description">
            {tasks.length === 0 ? 'Create your first task to start tracking your progress.' : 'Try adjusting your search or filters.'}
          </p>
          {tasks.length === 0 && subcategories.length === 0 && (
            <Link href="/categories" className="btn btn-secondary" style={{ marginTop: 16 }}>
              Create a Category First
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.taskList}>
          {filteredTasks.map((task) => {
            const sub = getSubCategory(task.subcategoryId);
            const cat = getCategory(task.subcategoryId);
            return (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.taskLeft}>
                  <div className={`priority-dot ${task.priority}`} />
                  <div className={styles.taskInfo}>
                    <div className={styles.taskTitle}>{task.title}</div>
                    {task.description && <div className={styles.taskDesc}>{task.description}</div>}
                    <div className={styles.taskMeta}>
                      {cat && (
                        <span className={styles.metaTag} style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}>
                          {cat.icon} {cat.name}
                        </span>
                      )}
                      {sub && <span className={styles.metaTag}>{sub.name}</span>}
                      <span className={styles.metaTag}>⏱️ {task.targetMinutes}m target</span>
                      <span className={`badge badge-${task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'green'}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.taskActions}>
                  <Link href={`/timer?taskId=${task.id}`} className="btn btn-ghost btn-sm" title="Start Timer">⏱️</Link>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Task' : 'New Task'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="What do you want to accomplish?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus id="task-title-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Optional description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Subcategory</label>
                  <select className="form-select" value={form.subcategoryId} onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })} id="task-sub-select">
                    <option value="">Select subcategory...</option>
                    {subcategories.map((s) => {
                      const c = categories.find((c) => c.id === s.categoryId);
                      return <option key={s.id} value={s.id}>{c?.icon} {c?.name} / {s.name}</option>;
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} id="task-priority-select">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Target Duration (minutes)</label>
                <input className="form-input" type="number" min={1} max={480} value={form.targetMinutes} onChange={(e) => setForm({ ...form, targetMinutes: e.target.value })} id="task-target-input" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-task-btn">
                {saving ? 'Saving...' : editing ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
