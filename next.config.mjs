/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Estos paquetes son solo de servidor (Node.js nativo) — nunca se bundlean para el cliente
  serverExternalPackages: ['sqlite3', 'puppeteer', 'nodemailer', 'bindings', 'mercadopago'],
};

export default nextConfig;
