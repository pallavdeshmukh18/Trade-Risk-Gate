import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#0A0A0F] text-white p-8">
                <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
                <p className="text-gray-400">Welcome to your dashboard! You are now logged in.</p>
            </div>
        </ProtectedRoute>
    );
}
