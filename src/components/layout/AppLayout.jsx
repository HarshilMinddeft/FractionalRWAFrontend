import { ToastContainer } from 'react-toastify';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

const AppLayout = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <main className="sm:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
      <ToastContainer position="top-center" autoClose={2000} theme={theme} />
    </div>
  );
};

export default AppLayout;
