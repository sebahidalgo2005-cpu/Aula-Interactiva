import './globals.css'

export const metadata = {
  title: 'Aula Interactiva - ERP Académico Personal',
  description: 'Gestión universitaria integrada, malla curricular y calendario',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var themeMode = localStorage.getItem('themeMode');
                  var primaryColor = localStorage.getItem('primaryColor') || '#3b82f6';
                  
                  if (themeMode === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  
                  document.documentElement.style.setProperty('--primary-color', primaryColor);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200">
        {children}
      </body>
    </html>
  )
}