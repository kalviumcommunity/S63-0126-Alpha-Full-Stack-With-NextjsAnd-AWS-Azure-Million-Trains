/**
 * RBAC Demo Component
 * Demonstrates role-based UI rendering
 */

'use client';

import { useRBAC, Protected } from '@/hooks/useRBAC';
import { Permission, Role, getRoleDescription } from '@/lib/rbac-config';

export default function RBACDemo() {
  const rbac = useRBAC();
  
  if (!rbac.user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          🔒 Authentication Required
        </h3>
        <p className="text-yellow-700">
          Please login to see role-based access control in action.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          👤 Current User
        </h3>
        <div className="space-y-2 text-sm">
          <p><strong>Email:</strong> {rbac.user.email}</p>
          <p><strong>Role:</strong> {rbac.role}</p>
          <p className="text-gray-600">{rbac.role && getRoleDescription(rbac.role)}</p>
        </div>
      </div>
      
      {/* Permissions */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-3">
          ✅ Your Permissions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {rbac.permissions.map(permission => (
            <div
              key={permission}
              className="bg-white px-3 py-2 rounded border border-green-300 text-xs font-mono"
            >
              {permission}
            </div>
          ))}
        </div>
      </div>
      
      {/* Role Checks */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">
          🎭 Role Checks
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <RoleCheck label="Super Admin" value={rbac.isSuperAdmin} />
          <RoleCheck label="Admin" value={rbac.isAdmin} />
          <RoleCheck label="Editor" value={rbac.isEditor} />
          <RoleCheck label="User" value={rbac.isUser} />
          <RoleCheck label="Viewer" value={rbac.isViewer} />
          <RoleCheck label="Guest" value={rbac.isGuest} />
        </div>
      </div>
      
      {/* Conditional UI Elements */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          🎨 Conditional UI Rendering
        </h3>
        <div className="space-y-3">
          {/* Everyone sees this */}
          <button className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
            👁️ View (Everyone)
          </button>
          
          {/* Only users with UPDATE permission */}
          <Protected permission={Permission.TRAIN_UPDATE}>
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              ✏️ Edit (Requires TRAIN_UPDATE)
            </button>
          </Protected>
          
          {/* Only users with DELETE permission */}
          <Protected permission={Permission.TRAIN_DELETE}>
            <button className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              🗑️ Delete (Requires TRAIN_DELETE)
            </button>
          </Protected>
          
          {/* Only admins */}
          <Protected role={Role.ADMIN}>
            <button className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              ⚙️ Admin Settings (Admin+ only)
            </button>
          </Protected>
          
          {/* Only super admin */}
          <Protected role={Role.SUPER_ADMIN}>
            <button className="w-full bg-yellow-500 text-gray-900 px-4 py-2 rounded hover:bg-yellow-600">
              👑 Super Admin Panel (SUPER_ADMIN only)
            </button>
          </Protected>
        </div>
      </div>
      
      {/* Permission Tests */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-orange-800 mb-3">
          🧪 Permission Tests
        </h3>
        <div className="space-y-2 text-sm">
          <PermissionTest
            rbac={rbac}
            permission={Permission.USER_CREATE}
            label="Create Users"
          />
          <PermissionTest
            rbac={rbac}
            permission={Permission.USER_DELETE}
            label="Delete Users"
          />
          <PermissionTest
            rbac={rbac}
            permission={Permission.TRAIN_UPDATE}
            label="Update Trains"
          />
          <PermissionTest
            rbac={rbac}
            permission={Permission.AUDIT_VIEW}
            label="View Audit Logs"
          />
          <PermissionTest
            rbac={rbac}
            permission={Permission.SETTINGS_MANAGE}
            label="Manage Settings"
          />
        </div>
      </div>
    </div>
  );
}

function RoleCheck({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center space-x-2">
      <span className={`text-2xl ${value ? '✅' : '❌'}`}>
        {value ? '✅' : '❌'}
      </span>
      <span className="text-sm">{label}</span>
    </div>
  );
}

function PermissionTest({
  rbac,
  permission,
  label,
}: {
  rbac: ReturnType<typeof useRBAC>;
  permission: Permission;
  label: string;
}) {
  const hasIt = rbac.can(permission);
  
  return (
    <div className="flex items-center justify-between bg-white px-4 py-2 rounded border">
      <span className="font-medium">{label}</span>
      <span className={`px-3 py-1 rounded text-xs font-semibold ${
        hasIt
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {hasIt ? 'ALLOWED' : 'DENIED'}
      </span>
    </div>
  );
}
