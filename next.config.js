/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                pathname: '/**',
            },
        ],
    },
    allowedDevOrigins: ['http://192.168.0.94:3000'],
};

export default config;
