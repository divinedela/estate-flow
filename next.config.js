/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      // Disable source map warnings in development
      rules: {
        '*.js': {
          loaders: [],
          as: '*.js',
        },
      },
    },
  },
  // Improve source map handling
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer, dev }) => {
    if (dev) {
      // Configure source maps for development
      config.devtool = 'cheap-module-source-map'
    }
    return config
  },
}

module.exports = nextConfig



