/**
 * RBAC Demo Page
 * Interactive demonstration of role-based access control
 */

import RBACDemo from '@/components/RBACDemo';

export default function RBACDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🔐 Role-Based Access Control (RBAC)
          </h1>
          <p className="text-gray-600 mb-6">
            Interactive demonstration of permission-based access control
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <h2 className="font-semibold text-blue-800 mb-2">How RBAC Works</h2>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Each user is assigned a <strong>role</strong> (Super Admin, Admin, Editor, User, Viewer, Guest)</li>
              <li>Each role has a set of <strong>permissions</strong> (create, read, update, delete)</li>
              <li>API routes enforce permissions at the server level</li>
              <li>UI elements conditionally render based on user permissions</li>
              <li>All access decisions are logged for auditing</li>
            </ul>
          </div>
        </div>
        
        <RBACDemo />
        
        {/* API Testing Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🧪 Test API Endpoints
          </h2>
          <div className="space-y-4">
            <APIEndpointCard
              method="GET"
              endpoint="/api/admin/users"
              permission="USER_LIST"
              description="List all users"
            />
            <APIEndpointCard
              method="POST"
              endpoint="/api/admin/users"
              permission="USER_CREATE"
              description="Create new user"
            />
            <APIEndpointCard
              method="GET"
              endpoint="/api/admin/users/[id]"
              permission="USER_READ"
              description="Get user details"
            />
            <APIEndpointCard
              method="PATCH"
              endpoint="/api/admin/users/[id]"
              permission="USER_UPDATE"
              description="Update user"
            />
            <APIEndpointCard
              method="DELETE"
              endpoint="/api/admin/users/[id]"
              permission="USER_DELETE"
              description="Delete user"
            />
          </div>
          
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded p-4">
            <h3 className="font-semibold mb-2">Test with curl:</h3>
            <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`# Get access token from login
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@example.com","password":"password"}'

# Use token to access protected endpoint
curl http://localhost:3000/api/admin/users \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function APIEndpointCard({
  method,
  endpoint,
  permission,
  description,
}: {
  method: string;
  endpoint: string;
  permission: string;
  description: string;
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PATCH: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-2">
        <span className={`px-3 py-1 rounded text-xs font-bold ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-sm font-mono text-gray-700">{endpoint}</code>
      </div>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">Required Permission:</span>
        <code className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
          {permission}
        </code>
      </div>
    </div>
  );
}
