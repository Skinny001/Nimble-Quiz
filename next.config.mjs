// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   images: {
//     unoptimized: true,
//   },
//   async headers() {
//     return [
//       {
//         source: '/:path*',
//         headers: [
//           {
//             key: 'Content-Security-Policy',
//             value: [
//               "default-src 'self' https: data: blob:",
//               "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
//               "style-src 'self' 'unsafe-inline' https:",
//               "img-src 'self' data: blob: https:",
//               "font-src 'self' data: https:",
//               "connect-src 'self' https: wss:",
//               "frame-ancestors *",
//             ].join('; '),
//           },
//         ],
//       },
//     ]
//   },
// }

// export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.1.127'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https: data: blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "connect-src 'self' https: wss:",
              "frame-ancestors *",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig