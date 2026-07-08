import './globals.css'

export const metadata = {
  title: 'Carts Store',
  description: 'Shop from Nigerian fashion stores on Carts',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
