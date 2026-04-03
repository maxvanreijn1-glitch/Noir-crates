'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface Role {
  id: number;
  name: string;
  permissions: string[];
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
}

const ALL_PERMISSIONS = [
  'products:read', 'products:write',
  'orders:read', 'orders:write',
  'customers:read', 'customers:write',
  'payments:read',
  'shipping:read', 'shipping:write',
  'discounts:read', 'discounts:write',
  'cms:read', 'cms:write',
  'admins:read', 'admins:write',
  'settings:read', 'settings:write',
  'reports:read',
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Role form
  const [roleName, setRoleName] = useState('');
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState('');

  // Admin form
  const [adminForm, setAdminForm] = useState({ email: '', name: '', password: '', role_id: '' });
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');

  function load() {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/roles').then(r => r.json()),
      fetch('/api/admin/admins').then(r => r.json()),
    ]).then(([r, a]) => {
      if (!r.error) setRoles(r.data ?? []);
      if (!a.error) setAdmins(a.data ?? []);
    }).catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function togglePerm(perm: string) {
    setRolePerms((prev) =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  }

  async function handleAddRole(e: React.FormEvent) {
    e.preventDefault();
    setRoleError('');
    setSavingRole(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roleName, permissions: rolePerms }),
      });
      const data = await res.json();
      if (!res.ok) { setRoleError(data.error ?? 'Error'); return; }
      setRoleName('');
      setRolePerms([]);
      load();
    } finally {
      setSavingRole(false);
    }
  }

  async function handleDeleteRole(id: number) {
    if (!confirm('Delete this role?')) return;
    await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' });
    load();
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminError('');
    setSavingAdmin(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminForm.email,
          name: adminForm.name,
          password: adminForm.password,
          role_id: adminForm.role_id ? parseInt(adminForm.role_id) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAdminError(data.error ?? 'Error'); return; }
      setAdminForm({ email: '', name: '', password: '', role_id: '' });
      load();
    } finally {
      setSavingAdmin(false);
    }
  }

  async function toggleAdminActive(admin: AdminUser) {
    await fetch(`/api/admin/admins/${admin.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !admin.is_active }),
    });
    load();
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Roles & Admins</h1>
          <p className={styles.sub}>Manage access control and admin accounts</p>
        </div>
      </div>

      {/* Roles section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Roles</h2>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Add Role</h3>
          <form onSubmit={handleAddRole} className={styles.roleForm}>
            {roleError && <div className={styles.error}>{roleError}</div>}
            <input
              type="text"
              required
              placeholder="Role name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className={styles.input}
            />
            <div className={styles.permsGrid}>
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm} className={styles.permLabel}>
                  <input
                    type="checkbox"
                    checked={rolePerms.includes(perm)}
                    onChange={() => togglePerm(perm)}
                    className={styles.checkbox}
                  />
                  {perm}
                </label>
              ))}
            </div>
            <button type="submit" disabled={savingRole} className={styles.btnPrimary}>
              {savingRole ? 'Saving…' : 'Add Role'}
            </button>
          </form>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr><td colSpan={3} className={styles.centered}>No roles.</td></tr>
              ) : roles.map((r) => (
                <tr key={r.id}>
                  <td className={styles.bold}>{r.name}</td>
                  <td>
                    <div className={styles.permTags}>
                      {r.permissions.map((p) => (
                        <span key={p} className={styles.permTag}>{p}</span>
                      ))}
                      {r.permissions.length === 0 && <span className={styles.none}>None</span>}
                    </div>
                  </td>
                  <td>
                    <button onClick={() => handleDeleteRole(r.id)} className={styles.deleteBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admins section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Admin Users</h2>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Add Admin User</h3>
          <form onSubmit={handleAddAdmin} className={styles.adminForm}>
            {adminError && <div className={styles.error}>{adminError}</div>}
            <div className={styles.grid2}>
              <input type="text" required placeholder="Name *" value={adminForm.name} onChange={(e) => setAdminForm(f => ({ ...f, name: e.target.value }))} className={styles.input} />
              <input type="email" required placeholder="Email *" value={adminForm.email} onChange={(e) => setAdminForm(f => ({ ...f, email: e.target.value }))} className={styles.input} />
              <input type="password" required placeholder="Password *" value={adminForm.password} onChange={(e) => setAdminForm(f => ({ ...f, password: e.target.value }))} className={styles.input} />
              <select value={adminForm.role_id} onChange={(e) => setAdminForm(f => ({ ...f, role_id: e.target.value }))} className={styles.select}>
                <option value="">Default role</option>
                {roles.map((r) => (
                  <option key={r.id} value={String(r.id)}>{r.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={savingAdmin} className={styles.btnPrimary}>
              {savingAdmin ? 'Adding…' : 'Add Admin'}
            </button>
          </form>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan={5} className={styles.centered}>No admin users.</td></tr>
              ) : admins.map((a) => (
                <tr key={a.id}>
                  <td className={styles.bold}>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{a.role}</td>
                  <td>
                    <span className={a.is_active ? styles.badgeGreen : styles.badgeGrey}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => toggleAdminActive(a)} className={styles.toggleBtn}>
                      {a.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
