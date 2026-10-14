import { RouterProvider } from 'react-router';
import { PWAProvider } from './providers/PWAProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { router } from './router';

/**
 * Shell principal de la PWA.
 * Ensambla los proveedores de tema (ThemeProvider), controles PWA (PWAProvider)
 * y el enrutador de React Router con el layout Stitch.
 */
export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <PWAProvider>
        <RouterProvider router={router} />
      </PWAProvider>
    </ThemeProvider>
  );
}
