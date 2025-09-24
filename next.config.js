/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'is1-ssl.mzstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'is2-ssl.mzstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'is3-ssl.mzstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'is4-ssl.mzstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'is5-ssl.mzstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
