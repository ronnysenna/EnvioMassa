'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import InstanceManager from '@/components/InstanceManager';

export default function InstanciasPage() {
    return (
        <ProtectedRoute>
            <main className="flex-1 bg-transparent min-h-screen p-4 sm:p-6">
                <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center sm:text-left">
                        Gerenciar Instâncias WhatsApp
                    </h1>

                    <InstanceManager />
                </div>
            </main>
        </ProtectedRoute>
    );
}
