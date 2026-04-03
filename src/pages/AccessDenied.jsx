import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-2xl rounded-[2rem] border border-red-100 bg-white p-10 text-center shadow-xl shadow-red-100/40">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Access Denied</h1>
        <p className="mt-3 text-base text-gray-500">
          You do not have permission to open this page. Please contact your administrator if you need access.
        </p>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-8 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
